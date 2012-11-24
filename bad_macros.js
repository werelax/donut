["defmacro",["let","bindings",".","body"],["__faster_let_aux","bindings","body"]] => false
["__faster_let_aux","bindings","body"] => false
"__faster_let_aux" => false
"bindings" => false
"body" => false
["defmacro",["let_star_","bindings",".","body"],["quasiquote",["let",["unquote","bindings"],["unquote_dash_splice","body"]]]] => false
["quasiquote",["let",["unquote","bindings"],["unquote_dash_splice","body"]]] => false
["defmacro",["letrec","bindings",".","body"],["quasiquote",["let",["unquote","bindings"],["unquote_dash_splice","body"]]]] => false
["quasiquote",["let",["unquote","bindings"],["unquote_dash_splice","body"]]] => false
["defmacro",["doto","thing",".","body"],["reduce",["lambda",["acc","thing"],["if",["pair_qmark","thing"],["quasiquote",[["unquote",["car","thing"]],["unquote","acc"],["unquote_dash_splice",["cdr","thing"]]]],["quasiquote",[["unquote","thing"],["unquote","acc"]]]]],"body","thing"]] => false
["reduce",["lambda",["acc","thing"],["if",["pair_qmark","thing"],["quasiquote",[["unquote",["car","thing"]],["unquote","acc"],["unquote_dash_splice",["cdr","thing"]]]],["quasiquote",[["unquote","thing"],["unquote","acc"]]]]],"body","thing"] => false
"reduce" => false
["if",["pair_qmark","thing"],["quasiquote",[["unquote",["car","thing"]],["unquote","acc"],["unquote_dash_splice",["cdr","thing"]]]],["quasiquote",[["unquote","thing"],["unquote","acc"]]]] => false
"if" => false
["pair_qmark","thing"] => false
"pair_qmark" => false
"thing" => false
["quasiquote",[["unquote",["car","thing"]],["unquote","acc"],["unquote_dash_splice",["cdr","thing"]]]] => false
["quasiquote",[["unquote","thing"],["unquote","acc"]]] => false
["eval",["read_dash_file",["+","__dirname","\"/../lib/prelude.js\""],"\"utf-8\""]] => false
"eval" => false
["read_dash_file",["+","__dirname","\"/../lib/prelude.js\""],"\"utf-8\""] => false
"read_dash_file" => false
["+","__dirname","\"/../lib/prelude.js\""] => false
"+" => false
"__dirname" => false
"\"/../lib/prelude.js\"" => false
"\"utf-8\"" => false
["set_bang",["get","\"macroexpand\"","exports"],"macro_dash_walker"] => false
"set_bang" => false
["get","\"macroexpand\"","exports"] => false
"get" => false
"\"macroexpand\"" => false
"exports" => false
"macro_dash_walker" => false
/* PREDICATES */

function number_qmark(thing) {
    return typeof(thing) == "number" || (typeof(thing) == "string" && !! thing.match(/^[\d\.]+$/)) && thing.trim() != ".";
}

function pair_qmark(list) {
    return !!list && typeof(list) == 'object' && list.hasOwnProperty('length') && list instanceof Array;
}

// not really correct, but...
function atom_qmark(list) {
    return !pair_qmark(list);
}

function null_qmark(list) {
    return pair_qmark(list) && list.length == 0;
}

/* LIST FUNCTIONS */

function car(list) {
    return list[0];
}

function cdr(list) {
    return list.slice(1);
}

function nth(i, list) {
    return list[i];
}

function caar(list) {
    return list[0][0];
}

function cadr(list) {
    return nth(1, list);
}

function caadr(list) {
    return list[1][0];
}

function caddr(list) {
    return nth(2, list);
}

function cadddr(list) {
    return nth(3, list);
}

function cddr(list) {
    return list.slice(2);
}

function cdddr(list) {
    return list.slice(3);
}

function cons(item, list) {
    var copy = list.slice();
    copy.unshift(item);
    return copy;
}

function append(item, list) {
    var copy = list.slice();
    copy.push(item);
    return copy;
}

function last(list) {
    var len = list.length;
    return list[len - 1];
}

function butlast(list) {
    var len = list.length;
    return list.slice(0, len - 1);
}

function push_bang(thing, list) {
    list.push(thing);
    return list;
}

// because Array.join() doesn't respect
// things as nulls or undefines
function str_dash_join(list, separator) {
    separator || (separator = "");
    // coerte to string
    separator = separator + "";
    if (null_qmark(list)) {
        return "";
    } else {
        return list.slice(1).reduce(function(acc, el) {
            return acc + separator + el;
        }, list[0] + "");
    }
}

function flatten(list) {
    var result = [];
    list.forEach(function(el) {
        el.forEach(function(inner) {
            result.push(inner);
        });
    });
    return result;
}

/* FUNCTION INVOCATION */

function apply(fn, args) {
    return fn.apply({}, args);
}

function call(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return apply(fn, args);
}

function compose(fn1, fn2) {
    return function() {
        return fn1(fn2.apply({}, arguments));
    }
}

/* MAPPING FUNCTIONS */

// not the most efficient implementation
function some(fn, list) {
    var result = list.filter(fn);
    return result.length > 0 ? result : false;
}

function map(fn, list) {
    if (arguments.length > 2) {
        return _multiple_map.apply({}, arguments);
    }
    return list.map(fn);
}

function _multiple_map(fn) {
    var lists = Array.prototype.slice.call(arguments, 1),
        len = lists[0].length,
        args = [],
        results = [];
    for (var i = 0; i < len; i++) {
        args = [];
        lists.forEach(function(l) {
            args.push(l[i]);
        });
        results.push(fn.apply({}, args));
    }
    return results;
}

function reduce(fn, list, initial_value) {
    if ( !! initial_value) {
        return list.reduce(fn, initial_value);
    } else {
        return list.reduce(fn);
    }
}

/* OBJECT/HASH FUNCTIONS */

function method_dash_call(method_name, object) {
    var params = Array.prototype.slice.call(arguments, 2);
    return object[method_name].apply(object, params);
}

function get_dash_keys(obj) {
    var key_list = [];
    for (var p in obj) if (obj.hasOwnProperty(p)) {
        key_list.push(p);
    }
    return key_list;
}

function has_dash_key(obj, key) {
    // hasOwnProperty has an inconsistent behaviour
    // when passed an array: it first flattens it
    // with .toString() !
    return !pair_qmark(key) && obj.hasOwnProperty(key);
}

/* PRIMIVITE TYPES FUNCTIONS */

function str() {
    return Array.prototype.join.call(arguments, "");
};

/* MACRO HELPERS */

function assemble_spliced_tree(tree) {
    if (!pair_qmark(tree)) {
        return tree;
    } else {
        return tree.reduce(function(acc, el) {
            if (pair_qmark(el)) {
                if (el[0] == "unquote_dash_splice") {
                    return acc.concat(el[1]);
                } else if (el[0] == "quasiquote") {
                    // Don't descend to this branch!!
                    return append(el, acc);
                } else {
                    return append(assemble_spliced_tree(el), acc);
                }
            } else {
                if (el == "unquote_dash_splice") {
                    return acc;
                } else {
                    return append(el, acc);
                }
            }
        }, []);
    }
}

/* CONSTANTS */

var nil = [];

/* SUGAR */

function print() {
    console.log.apply(console, arguments);
}

var __faster_let_aux = (function(bindings, body) {
    return assemble_spliced_tree([
        ["lambda", [""],
            ["unquote_dash_splice", map((function(binding) {
                return assemble_spliced_tree(["var", car(binding), cadr(binding)]);
            }), bindings)],
            ["progn", ["unquote_dash_splice", body]]
        ]
    ]);
});
/* macro let omited */
true;
/* macro let_star_ omited */
true;
/* macro letrec omited */
true;
var in_dash_pairs = (function(list) {
    return ((null_qmark(list)) ? (nil) : (cons([car(list), cadr(list)], in_dash_pairs(cddr(list)))));
});
/* macro doto omited */
true;
var compile = (require((__dirname + "/compiler.js"))["compile"]);
var format = (require("util")["format"]);
var read_dash_file = (require("fs")["readFileSync"]);;
eval(read_dash_file((__dirname + "/../lib/prelude.js"), "utf-8"));
var _star_macros_star_ = {};;
var is_dash_var_qmark = (function(expr) {
    return ((car(expr) == "define") || (car(expr) == "var"));
});
var is_dash_lambda_qmark = (function(expr) {
    return let(head(car(expr))(tail(cdr(expr))), (pair_qmark(head) && (car(head) == "lambda")));
});
var is_dash_macro_dash_definition_qmark = (function(expr) {
    return (car(expr) == "defmacro");
});
var is_dash_macro_dash_expansion_qmark = (function(expr) {
    return has_dash_key(_star_macros_star_, car(expr));
});
var is_dash_quoted_qmark = (function(expr) {
    return ((car(expr) == "quote") || (car(expr) == "quasiquote"));
});
var add_dash_var_dash_to_dash_ctx = (function(expr, ctx) {
    return format(ctx, format("%s; %%%%s", compile(expr)));
});
var expand_dash_lambda = (function(expr, ctx) {
    return let(definition(car(expr))(args(map(macro_dash_walker, cdr(expr))), params(cadr(definition)), body(cddr(definition))), let(new_dash_ctx(format(ctx, format("return (function(%s) { %%%s })(%s);", str_dash_join(params, ", "), str_dash_join(map(compile, args), ", "))))(new_dash_body(macro_dash_walker(body, new_dash_ctx))), assemble_spliced_tree([
        ["lambda", params, ["unquote_dash_splice", new_dash_body]],
        ["unquote_dash_splice", args]
    ])));
});
var run_dash_with_dash_context = (function(name, expr, ctx) {
    return format("(function() { %s })()", format(ctx, format("var %s; return %s = %s;", name, name, compile(expr))));
});
var compile_dash_macro = (function(expr, ctx) {
    let(signature(cadr(expr))(name(car(signature)), params(cdr(signature)), body(macro_dash_walker(cddr(expr), ctx)), macro_dash_function(compile(assemble_spliced_tree(["lambda", params, ["unquote_dash_splice", body]])))), ((_star_macros_star_[name]) = eval(run_dash_with_dash_context(name, macro_dash_function, ctx))));
    return expr;
});
var expand_dash_macro = (function(expr, ctx) {
    return let(name(car(expr))(params(cdr(expr)), macro((_star_macros_star_[name])), expansion(apply(macro, params)), walked_dash_expansion(macro_dash_walker(expansion, ctx))), walked_dash_expansion);
});
var macro_dash_walker = (function(tree, ctx) {
    ctx || (ctx = "%s");
    return (((atom_qmark(tree) || null_qmark(tree) || is_dash_quoted_qmark(tree))) ? ((tree)) : (((is_dash_var_qmark(car(tree))) ? ((cons(car(tree), macro_dash_walker(cdr(tree), add_dash_var_dash_to_dash_ctx(car(tree), ctx))))) : ((((is_dash_lambda_qmark(tree)) ? ((expand_dash_lambda(tree, ctx))) : (((is_dash_macro_dash_definition_qmark(tree)) ? ((compile_dash_macro(tree, ctx))) : (((is_dash_macro_dash_expansion_qmark(tree)) ? ((expand_dash_macro(tree, ctx))) : ((cons(macro_dash_walker(car(tree), ctx), macro_dash_walker(cdr(tree), ctx))))))))))))));
});
((exports["macroexpand"]) = macro_dash_walker);
