var _ = require('underscore');
var format = require('util').format;
var reader = require('./reader.js');

/* Transformations */

var special_forms = {};

function compile(ast) {
  var fname, fargs, transformation, js_code;
  if (_.isArray(ast)) {
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
  return "{" + props.join(", ") + "}";
});

// Basic "LIST" operations

def_special_form('list', function(fname, args) {
  var args = args.map(compile);
  return format("[%s]", args.join(", "));
});

def_special_form('quote', function(fname, args) {
  var thing = args[0];
  function read_item (t) {
    if (_.isArray(t)) {
      return format("[%s]", t.map(read_item).join(", "));
    } else {
      return t;
    }
  };
  return read_item(thing);
});

def_special_form('car', function(fname, args) {
  var list = compile(args[0]);
  return format("( %s[0] )", list);
});

def_special_form('cdr', function(fname, args) {
  var list = compile(args[0]);
  return format("( %s.slice(1) )", list);
});

def_special_form('cons', function(fname, args) {
  var thing = compile(args[0]),
      list = compile(args[1]);
  return format("[%s].concat(%s)", thing, list);
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

def_special_form('define', function(fname, args) {
  if (_.isArray(args[0])) return special_forms['define_dash_lambda'](fname, args);
  var pairs = in_groups_of(args, 2),
      expansion = function (p) { return format("var %s = %s", compile(p[0]), p[1]? compile(p[1]):"undefined"); }
      definitions = pairs.map(expansion);
  return definitions.join('; ');
});

def_special_form('define_dash_lambda', function(fname, args) {
  var lambda_expr = args[0],
      lambda_name = lambda_expr[0],
      lambda_params = lambda_expr.slice(1),
      body = args.slice(1);
  return format("var %s = %s",
                lambda_name,
                special_forms['lambda'](fname, [lambda_params].concat(body)));
});

def_special_form('set!', function(fname, args) {
  var symbol = compile(args[0]),
      value = compile(args[1]);
  return format("(%s = %s)", symbol, value);
});

// Hash/Object operations

def_special_form('get', function(fname, args) {
  var index = compile(args[0]),
      obj = compile(args[1]);
  return format("(%s[%s])", obj, index);
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

def_special_form('lambda', function(fname, args) {
  var params = args[0].map(compile),
      body = args.slice(1).map(compile),
      last = body.pop();
  // just to make .join() add an ending ;
  body.push('');
  return format("(function(%s) {\n %s return %s;\n })",
                params,
                body.join(";\n"),
                last);
});

def_special_form('progn', function(fname, args) {
  // Beware!: progn creates lexical environments!
  return special_forms['let'](fname, [[]].concat(args));
});

/* Environment operations */

def_special_form('let', function(fname, args) {
  var bindings = args[0],
      names = [],
      values = [],
      body = args.slice(1).map(compile),
      last = body.pop();
  body.push('');
  bindings.forEach(function(b) {
    names.push(b[0]);
    values.push(compile(b[1]));
  });
  return format("(function(%s){ %s return %s;\n })(%s)",
                names.join(", "),
                body.join(";\n"),
                last,
                values.join(", "));
});

/* Exports */

exports['compile'] = compile;
