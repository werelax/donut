var format = require('util').format;
var read = require('./reader.js').read;
var read_file = require('fs').readFileSync;
var is_array = require('util').isArray;

/* Prelude */

eval(read_file('./lib/prelude.js', 'utf-8'));

/* global utils */

var symbol_id_counter = 0;

function gensym () {
  return "__symb__" + symbol_id_counter++ + "__";
}

/* Transformations */

var special_forms = {};

function compile(ast) {
  var fname, fargs, transformation, js_code;
  if (is_array(ast)) {
    fname = compile(ast[0]);
    args = ast.slice(1);
    transformation = special_forms[fname] || special_forms['_function_call'];
    js_code = transformation(fname, args);
    // This is the best point to inject the macro meta-evaluation of defines!
    return js_code;
  } else {
    return ast;
  }
}

/* Special forms macros */

function def_special_form (name, body) {
  special_forms[name] = body;
}

function declare_operator (name, jsop) {
  jsop || (jsop = name);
  def_special_form(name, function(fname, args) {
    var parenthesize = function(items) {
      var item = compile(items.pop());
      if (items.length == 0) {
        return item;
      } else {
        return "(" + parenthesize(items) + " " + jsop + " " + item + ")";
      }
    };
    return parenthesize(args);
  });
}

function declare_comparison (name, op) {
  op || (op = name);
  def_special_form(name, function(fname, args) {
    return "(" + str_dash_join(args.map(compile), " "+op+" ") + ")";
  });
}

function declare_prefix_op(name, op) {
  op || (op = name);
  def_special_form(name, function(fname, args) {
    return op + "(" + compile(args[0]) + ")";
  });
}

/* Special form definitions */

declare_operator("+");
declare_operator("-", "-");
declare_operator("*", "*");
declare_operator("/");
declare_operator("%");

declare_comparison('<');
declare_comparison('>');
declare_comparison('=<');
declare_comparison('=>');
declare_comparison('=', '==');
declare_comparison('eq_qmark', '==');
declare_comparison('and', '&&');
declare_comparison('or', '||');

declare_prefix_op('not', '!');
declare_prefix_op('negate', '-');

// Base type conversions

def_special_form('_function_call', function(fname, args) {
  if (fname == "") {
    // its just an empty list
    return "[]";
  } else {
    var arguments = str_dash_join(args.map(compile), ", ");
    return fname + "(" + arguments + ")";
  }
});

def_special_form('make_dash_vector', function(fname, args) {
  // alias of (list ...)
  return special_forms['list'](fname, args);
});

def_special_form('make_dash_object', function(fname, args) {
  var args = args.map(compile),
      props = [],
      key,
      value;
  if ((args.length % 2) != 0) throw new Error("HashMap should have even number of params");
  while (args.length > 0) {
    key = args.shift();
    value = args.shift();
    props.push(key + ": " + value);
  }
  return "{" + str_dash_join(props, ", ") + "}";
});

def_special_form("defmacro", function(fname, args) {
  // macros doesn't get compiled
  return "/* macro " + args[0][0] + " omited */ true";
});

// Basic "LIST" operations

def_special_form("list", function(fname, args) {
  args = args.map(compile);
  return format("[%s]", str_dash_join(args, ", "));
});

// Base assignment operations

function in_groups_of(list, n) {
  var len = list.length,
      result = [];
  for (var i=0; i<len; i=i+n) {
    result.push(list.slice(i, i+n));
  }
  return result;
}

// The difference between var/define:
// - var is just to declare the variable.
// - Ok, right know define does more or less the same..
//   but I still don't fully understand the semantics
//   of the scheme's decfine, but I think is for globals
def_special_form("var", function(fname, args) {
  var pairs = in_groups_of(args, 2),
      expansion = function (p) {
        return format("var %s = %s",
                      compile(p[0]),
                      p[1] ? compile(p[1]) : "undefined");
      }
      definitions = pairs.map(expansion);
  return str_dash_join(definitions, '; ');
});

def_special_form("define", function(fname, args) {
  if (is_array(args[0])) return special_forms['define_dash_lambda'](fname, args);
  var pairs = in_groups_of(args, 2),
      expansion = function (p) {
        return format("var %s = %s",
                      compile(p[0]),
                      p[1] ? compile(p[1]) : "undefined");
      }
      definitions = pairs.map(expansion);
  return str_dash_join(definitions.concat(''), '; ');
});

def_special_form("define_dash_lambda", function(fname, args) {
  var lambda_expr = args[0],
      lambda_name = lambda_expr[0],
      lambda_params = lambda_expr.slice(1),
      body = args.slice(1);
  return format("var %s = %s",
                lambda_name,
                special_forms["lambda"](fname, [lambda_params].concat(body)));
});

def_special_form("set_bang", function(fname, args) {
  var symbol = compile(args[0]),
      value = compile(args[1]);
  return format("(%s = %s)", symbol, value);
});

// Hash/Object operations

def_special_form("get", function(fname, args) {
  var index = compile(args[0]),
      obj = compile(args[1]);
  return format("(%s[%s])", obj, index);
});

// Base flow operations

def_special_form("if", function(fname, args) {
  var condition = compile(args[0]),
      if_block = compile(args[1]),
      else_block = args[2] ? compile(args[2]) : void 0;
  // This little trick works for now. But it would
  // be better to implement this properly.
  // The problem was: "if" should be expressions, not statements
  return format("((%s) ? (%s) : (%s))", condition, if_block, else_block);
});

def_special_form("cond", function(fname, args) {
  var expr = args[0],
      cond_rec = function(clauses) {
        if (!clauses[0]) { return void 0; }
        var clause = clauses[0],
            condition = clause[0],
            body = clause.slice(1);
        if (condition == "else") {
          return special_forms["progn"](fname, body);
        } else {
          return special_forms["if"](fname,
                                     [ condition,
                                       ["progn"].concat(body),
                                       cond_rec(clauses.slice(1)) ]);

        }
      };
      return cond_rec(args);
});

def_special_form("case", function(fname, args) {
  function expand_clause (clause) {
    // the [].concat(..) trick makes sure it ends as an array
    var value_list = ([].concat(clause[0])).map(compile),
        value_code = str_dash_join(value_list.map(function(v) {
          if (v == "else") {
            return "default:";
          } else {
            return format("case %s:\n", v);
          }
        }), ""),
        body = clause.slice(1).map(compile),
        last = format("return %s;", body.pop()),
        body_code = str_dash_join(body.concat([last, "break", ""]), ";\n") ;
    return value_code + body_code;
  }
  var test = compile(args[0]),
      clauses = args.slice(1),
      symb = gensym();
  return format("(function(%s) { switch(%s) { %s }})(%s)",
                symb,
                symb,
                str_dash_join(clauses.map(expand_clause), ''),
                test);
});

// Base function operations

function params_helpers(params) {
  var len = params.length,
      helper_code = "",
      param, name, value, rest;
  if (!is_array(params)) {
    helper_code += format("%s = Array.prototype.slice.call(arguments);",
                          params);
    params = [params];
  } else {
    for (var i=0; i<len; i++) {
      param = params[i];
      if (is_array(param)) {
        name = param[0];
        value = param[1];
        helper_code += format("%s || (%s = %s); ",
                              name,
                              name,
                              compile(value));
        params[i] = name;
      } else if (param.trim() == ".") {
        rest = params[i+1];
        params.splice(i, 1);
        helper_code += format("%s = Array.prototype.slice.call(arguments, %d);",
                              rest,
                              i);
        break;
      }
    }
  }
  return [params, helper_code];
}

def_special_form("lambda", function(fname, args) {
  var parsed_params = params_helpers(args[0]),
      params = parsed_params[0].map(compile),
      params_helper_code = parsed_params[1],
      body = args.slice(1).map(compile),
      last = body.pop();
  // just to make .str_dash_join() add an ending ;
  body.push('');
  return format("(function(%s) { %s  %s return %s; })",
                params ? params : '',
                params_helper_code,
                str_dash_join(body, ";\n"),
                last);
});

def_special_form("progn", function(fname, args) {
  return format("( %s )", str_dash_join(args.map(compile), ', '));
});

/* Environment operations */

/* Syntax operators */

function quote_rec (tree, acc) {
  acc || (acc = []);
  if (!(tree instanceof Array)) {
    // Don't stringify numbers! (but for JS "." is a number...)
    if (number_qmark(tree)) {
      return acc.concat(parseFloat(tree));
    } else {
      return acc.concat(tree);
    }
  } else if (tree.length == 0) {
    return [acc];
  } else {
    head = tree[0];
    tail = tree.slice(1);
    return quote_rec(tail,
                     acc.concat( quote_rec(head, [])));
  }
};

// Aux function to duble-quote the strings,
// so they doesn't become symbols in the
// expansion phase

function unq_escape (tree) {
  if (!is_array(tree)) {
    if (tree[0] == "\"") {
      return format("%j", tree);
    } else if (number_qmark(tree)) {
      return parseFloat(tree);
    } else {
      return tree;
    }
  } else {
    return tree.reduce(function(acc, el) {
      return append(unq_escape(el), acc);
    }, []);
  }
}

function qquote_rec (tree, acc) {
  acc || (acc = []);
  var result;
  if (!(tree instanceof Array)) {
    return acc.concat(format("%j", tree));
  } else if (tree.length == 0) {
    return [acc];
  } else if (tree[0] == "unquote") {
    result = compile(unq_escape(tree[1]));
    return acc.concat(result);
  } else if (tree[0] == "unquote_dash_splice") {
    result = [format("%j", tree[0]), compile(tree[1])];
    return acc.concat([result]);
  } else if (tree[0] == "quasiquote") {
    // Don't descend to this branch!!
    return acc.concat(format("%j", tree));
  } else {
    head = tree[0];
    tail = tree.slice(1);
    return qquote_rec(tail,
                      acc.concat(qquote_rec(head, [])));
  }
}

function arr_to_str (el) {
  if (el instanceof Array) {
    return format("[ %s ]", str_dash_join(el.map(arr_to_str), ', '));
  } else {
    return el;
  }
}

def_special_form("quote", function(fname, args) {
  var thing = args[0],
      quoted = quote_rec(thing)[0];
  if (quoted == "") {
    // its just a ()
    return "[]";
  } else {
    return format("%j", quoted);
  }
});

def_special_form("quasiquote", function(fname, args) {
  var thing = args[0],
      result = qquote_rec(thing, [])[0];
  if (is_array(result)
      && result.length == 1
      && result[0] == '""') {
    // its just a ()
    return "[]";
  } else {
    return format("assemble_spliced_tree(%s)", arr_to_str(result));
  }
});


/* Exports */

exports['compile'] = compile;
exports['gensym'] = gensym;
