var _ = require('underscore');
var util = require('util');

/* AST Node */

function Node (type, data) {
  this.type = type;
  this.data = data;
}

function Atom (data) {
  return new Node('atom', data);
}

function List (data) {
  return new Node('list', data);
}

function Vector (data) {
  return new Node('vector', data);
}

function Hash (data) {
  return new Node('hash', data);
}

/* Reader */

function cleanup(code) {
  if (code[0] == ')' || code[0] == ']' || code[0] == '}') {
    code = code.substring(1);
  }
  return code.trim();
}

function is_string (code) {
  return code[0] == "'" || code[0] == "\"";
}

function is_sexp (code) {
  return code[0] == '(';
}

function is_vector (code) {
  return code[0] == '[';
}

function is_hash (code) {
  return code[0] == '{';
}

function end_of_sequence(code, open_char, close_char, balance, acc) {
  balance || (balance = 0); acc || (acc = 0);
  var next_oseq = code.indexOf(open_char) + 1,
      next_oseq_found = (next_oseq > 0),
      next_cseq = code.indexOf(close_char) + 1,
      next_cseq_found = (next_cseq > 0);

  if ((!next_cseq_found && balance != 0) || balance < 0) {
        throw new Error("Unbalanced List: " + code);
    }

  if (balance == 0 && acc > 0) {
    // end reached
    return acc;
  } else if (next_oseq_found && next_oseq < next_cseq) {
    // found (
    return end_of_sequence(code.substring(next_oseq), open_char, close_char, balance +1, acc + next_oseq);
  } else {
    // found )
    return end_of_sequence(code.substring(next_cseq), open_char, close_char, balance -1, acc + next_cseq);
  }
}

function end_of_list(code) {
  return end_of_sequence(code, '(', ')');
}

function end_of_vect(code) {
  return end_of_sequence(code, '[', ']');
}

function end_of_hash(code) {
  return end_of_sequence(code, '{', '}');
}

/* Lexer */

function read_atom (code) {
  var atom_ending_chars = ["\"", "'", "(", ")", " "],
      is_natural = function(n) { return n >= 0; },
      atom_endings = atom_ending_chars.map(function(end) { return code.indexOf(end); }).filter(is_natural),
      atom_end = Math.min.apply({}, atom_endings.concat(code.length)),
      atom = code.substring(0, atom_end).trim().replace(/,/g, ''),
      code = code.substring(atom_end);
  return [new Atom(atom), code];
}

function read_string (code) {
  // XXX: In this shitty implementaiton, you cannot embed \" or \' inside strings!
  var string_char = code[0],
      string_end = code.substring(1).indexOf(string_char) + 2,
      string = code.substring(0, string_end).trim(),
      code = code.substring(string_end);
  return [new Atom(string), code];
}

function read_sexp (code, endfn) {
  endfn || (endfn = end_of_list);
  var sexp_end = endfn(code) - 1,
      sexp_contents = code.substring(1, sexp_end),
      code = code.substring(sexp_end),
      ast = parse(sexp_contents);
  return [ast, code];
}

function read_list (code) {
  var result = read_sexp(code, end_of_list);
  result[0] = new List(result[0]);
  return result;
}

function read_vector (code) {
  var result = read_sexp(code, end_of_vect);
  result[0] = new Vector(result[0]);
  return result;
}

function read_hash (code) {
  var result = read_sexp(code, end_of_hash);
  result[0] = new Hash(result[0]);
  return result;
}

/* Here be reader macros */

function read (code) {
  code = cleanup(code);
  if (is_string(code)) {
    return read_string(code);
  } else if (is_sexp(code)) {
    return read_list(code);
  } else if (is_vector(code)) {
    return read_vector(code);
  } else if (is_hash(code)) {
    return read_hash(code);
  } else {
    return read_atom(code);
  }
}

function parse (code) {
  var result = [], ref, thing;
  while (code.length > 0) {
    ref = read(code);
    thing = ref[0];
    code = cleanup(ref[1]);
    result.push(thing);
  }
  return result;
}

/* Transformations */

var special_forms = {};

var default_transformations = {
  list: '_function_call',
  vector: '_make_array',
  hash: '_make_object'
};

function compile(ast) {
  var fname, fargs, transformation;
  if (ast.type == 'atom') {
    return ast.data;
  } else if (ast.type == 'list' || ast.type == 'vector' || ast.type == 'hash') {
    fname = compile(ast.data[0]);
    args = ast.data.slice(1);
    transformation = special_forms[default_transformations[ast.type]];
    if (ast.type == 'list') { transformation = special_forms[fname] || transformation; }
    return transformation(fname, args);
  } else {
    throw new Error("Trying to evaluate an non-ast object. Possibly caused by evaluating a node twice");
  }
}

/* Special forms macros */

function def_special_form (name, body) {
  special_forms[name] = body;
}

function declare_operator (name) {
  def_special_form(name, function(fname, args) {
    var parenthesize = function(items) {
      var item = compile(items.pop());
      if (items.length == 0) {
        return item;
      } else {
        return "(" + parenthesize(items) + " " + fname + " " + item + ")";
      }
    };
    return parenthesize(args);
  });
}

function declare_comparison (name, op) {
  op || (op = name);
  def_special_form(name, function(fname, args) {
    return "(" + args.map(compile).join(" "+op+" ") + ")";
  });
}

function declare_prefix_op(name, op) {
  op || (op = name);
  def_special_form(name, function(fname, args) {
    return op + "(" + compile(args[0]) + ")";
  });
}

/* Special form definitions */

declare_operator('+');
declare_operator('-');
declare_operator('*');
declare_operator('/');
declare_operator('%');

declare_comparison('<');
declare_comparison('>');
declare_comparison('=<');
declare_comparison('=>');
declare_comparison('=', '==');
declare_comparison('and', '&&');
declare_comparison('or', '||');

declare_prefix_op('not', '!');
declare_prefix_op('negate', '-');

// Base type conversions

def_special_form('_function_call', function(fname, args) {
  return fname + "(" + args.map(compile).join(', ') + ")";
});

def_special_form('_make_array', function(fname, args) {
  args = args.map(compile);
  args.unshift(fname);
  return "[" + args.join(', ') + "]";
});

def_special_form('_make_object', function(fname, args) {
  var args = args.map(compile),
      props = [],
      key,
      value;
  args.unshift(fname);
  if ((args.length % 2) != 0) throw new Error("HashMap should have even number of params");
  while (args.length > 0) {
    key = args.shift();
    value = args.shift();
    props.push(key + ": " + value);
  }
  return "{" + props.join(", ") + "}";
});

// Base flow operations

def_special_form('if', function(fname, args) {
  var condition = args[0]
      if_block = args[1],
      else_block = args[2],
      expanded = "";
  expanded += "if (" + compile(condition) + ")\n";
  expanded += "{\n" + compile(if_block);
  if (else_block) { expanded += "\n} else {\n " + compile(else_block); }
  expanded += "\n}\n";
  return expanded;
});

// Base function operations

def_special_form('fn', function(fname, args) {
  var params = args.shift(),
      body = args.shift(),
      vect_to_list = function(v) { return v.replace('[','(').replace(']',')'); };
  params = vect_to_list(compile(params));
  return "(function " + params + " { " + compile(body) + " })";
});

/* Invocation */

// node jungle.js <file .jngl>

require('fs').readFile(process.argv[2], 'utf-8', function(err, data) {
  if (err) throw err;
  console.log(data);
  console.log( parse(data).map(compile).join("\n"));
});


/* Pending */

/*
* (quote (a b c d)) -> (a b c d)
* (def a 2 b 3) -> var a = 2, b = 3;
* (set a 43)    -> a = 43
* (get a 'some-key') -> a['some-key']
* ? (set (get a 'some-key') 12) -> a['some-key'] = 12
* ? (conj a 'some-key' 12) -> a['some-key'] = 12
* ? (prop-set a 'some-key' 12) -> a['some-key'] = 12
* progn or some kind of block
* (let [a 2] body) -> (function(a) { body })(2)
* some kind of defmacro
* defn
* while, for, when, unless, cond, if-let, when-let
* map filter etc...
* list, hash, vector constructors
*/
