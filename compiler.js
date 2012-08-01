var _ = require('underscore');
var format = require('util').format;
var read = require('./reader.js').read;

/* global utils */

var symbol_id_counter = 0;

function gensym () {
  return "__symb__" + symbol_id_counter++ + "__";
}

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

declare_operator("+");
declare_operator("_dash_", "-");
declare_operator("_star_", "*");
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

def_special_form("str", function(fname, args) {
  var result = args.map(compile).join('');
  return format("\"%s\"", result);
})

// Basic "LIST" operations

def_special_form('list', function(fname, args) {
  var args = args.map(compile);
  return format("[%s]", args.join(", "));
});

def_special_form('cons', function(fname, args) {
  var item = compile(args[0]),
      list = compile(args[1]);
  return format("([%s].concat(%s))", item, list);
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

def_special_form('nth', function(fname, args) {
  var index = compile(args[0]),
      list = compile(args[1]);
  return format("(%s[%s])", list, index);
});

def_special_form('cadr', function(fname, args) {
  return special_forms['nth'](fname, [1].concat(args));
});

def_special_form('caddr', function(fname, args) {
  return special_forms['nth'](fname, [2].concat(args));
});

def_special_form('cddr', function(fname, args) {
  var list = compile(args[0]);
  return format("(%s.slice(2))", list);
});

def_special_form('cdddr', function(fname, args) {
  var list = compile(args[0]);
  return format("(%s.slice(3))", list);
});

def_special_form('map', function(fname, args) {
  var fn = compile(args[0]),
      list = compile(args[1]);
  return format("((%s).map(%s))", list, fn);
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
      expansion = function (p) {
        return format("var %s = %s",
                      compile(p[0]),
                      p[1] ? compile(p[1]) : "undefined");
      }
      definitions = pairs.map(expansion);
  return definitions.concat('').join('; ');
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

def_special_form('method_dash_call', function(fname, args) {
  var method_name = compile(args[0]),
      object = compile(args[1]),
      params = args.slice(2).map(compile);
  return format("(%s[\"%s\"](%s))", object, method_name, params.join(", "));
});

// Base flow operations

def_special_form("if", function(fname, args) {
  var condition = args[0]
      if_block = args[1],
      else_block = args[2],
      expanded = "";
  // This little trick works for now. But it would
  // be better to implement this properly.
  // The problem was: "if" should be expressions, not statements
  return format("((%s) ? (%s) : (%s))",
                compile(condition),
                compile(if_block),
                (else_block ? compile(else_block) : void 0));
});

def_special_form("cond", function(fname, args) {
  var expr = args[0],
      cond_rec = function(clauses) {
        var clause = clauses[0],
            condition = clause[0],
            body = clause.slice(1);
        if (condition == "else") {
          return special_forms['progn'](fname, body);
        } else {
          return special_forms['if'](fname,
                                     [ condition,
                                       ['progn'].concat(body),
                                       cond_rec(clauses.slice(1)) ]);

        }
      };
      return cond_rec(args);
});

def_special_form("case", function(fname, args) {
  function expand_clause (clause) {
    // the [].concat(..) trick makes sure it ends as an array
    var value_list = ([].concat(clause[0])).map(compile),
        value_code = value_list.map(function(v) {
          if (v == 'else') {
            return "default:";
          } else {
            return format("case %s:\n", v);
          }
        }).join(''),
        body = clause.slice(1).map(compile),
        last = format("return %s;", body.pop()),
        body_code = body.concat([last, "break", ""]).join(";\n") ;
    return value_code + body_code;
  }
  var test = compile(args[0]),
      clauses = args.slice(1),
      symb = gensym();
  return format("(function(%s) { switch(%s) { %s }})(%s);",
                symb,
                symb,
                clauses.map(expand_clause).join(''),
                test);
});

// Base function operations

function params_helpers(params) {
  var len = params.length,
      helper_code = "",
      param, name, value;
  for (var i=0; i<len; i++) {
    param = params[i];
    if (_.isArray(param)) {
      name = param[0];
      value = param[1];
      helper_code += format("%s || (%s = %s); ",
                            name,
                            name,
                            compile(value));
      params[i] = name;
    }
  }
  return [params, helper_code];
}

def_special_form('lambda', function(fname, args) {
  var parsed_params = params_helpers(args[0]),
      params = parsed_params[0].map(compile),
      params_helper_code = parsed_params[1],
      body = args.slice(1).map(compile),
      last = body.pop();
  // just to make .join() add an ending ;
  body.push('');
  return format("(function(%s) {\n %s \n %s return %s;\n })",
                params,
                params_helper_code,
                body.join(";\n"),
                last);
});

def_special_form('progn', function(fname, args) {
  return format("( %s )", args.map(compile).join(', '));
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
exports['gensym'] = gensym;
