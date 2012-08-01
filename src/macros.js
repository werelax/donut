var read = (require("./reader.js")["read"]);
var compile = (require("./compiler.js")["compile"]);
var gensym = (require("./compiler.js")["gensym"]);
var format = (require("util")["format"]);
var read_dash_file = (require("fs")["readFileSync"]);;
eval(read_dash_file("./lib/prelude.js", "utf-8"));
var create_dash_scope_qmark = (function(expr) {
    return (function(__symb__0__) {
        switch (__symb__0__) {
        case "define":
        case "let":
            return true;;
            break;
        default:
            return false;;
            break;
        }
    })((expr[0]));
});
var add_dash_to_dash_scope = (function(expr, scope) {
    return (function(__symb__1__) {
        switch (__symb__1__) {
        case "define":
            return add_dash_define_dash_to_dash_scope(expr, scope);;
            break;
        case "let":
            return add_dash_let_dash_to_dash_scope(expr, scope);;
            break;
        }
    })((expr[0]));
});
var add_dash_symbol_dash_to_dash_scope = (function(symbol, value, scope) {
    return (function(current_dash_scope) {
        return ((current_dash_scope[symbol]) = value);
    })((scope[0]));
});
var add_dash_lambda_dash_to_dash_scope = (function(symbol, params, body, scope) {
    return (function(fn) {
        return add_dash_symbol_dash_to_dash_scope(symbol, fn, scope);
    })((["lambda", params]["concat"](body)));
});
var add_dash_define_dash_to_dash_scope = (function(expr, scope) {
    return (function(symbol, value) {
        ((pair_qmark(symbol)) ? (add_dash_lambda_dash_to_dash_scope((symbol[0]), (symbol.slice(1)), value, scope)) : (add_dash_symbol_dash_to_dash_scope(symbol, (value[0]), scope)));
        return expr;
    })((expr[1]), walk_dash_code((expr["slice"](2))));
});
var add_dash_let_dash_to_dash_scope = (function(expr, scope) {
    return (function(header, definitions, body, new_dash_scope) {
        ((definitions).map((function(pair) {
            return (function(symbol, value) {
                return add_dash_symbol_dash_to_dash_scope(symbol, value, new_dash_scope);
            })((pair[0]), (walk_dash_code((pair.slice(1)))[0]));
        })));
        return (header["concat"](walk_dash_code(body, new_dash_scope)));
    })((expr["slice"](0, 2)), (expr[1]), (expr["slice"](2)), cons({}, scope));
});
var run_dash_with_dash_scope = (function(name, expr, scope) {
    return (function(scope_dash_closure) {
        return format(scope_dash_closure, name, compile(expr));
    })(build_dash_scope(scope));
});
var build_dash_scope = (function(scope) {
    return (function(bindings) {
        return ((bindings) ? ((function(keys) {
            return (function(values) {
                return format("(function(%s){ return %s; })(%s)", (keys["join"](", ")), build_dash_scope(butlast(scope)), (values["join"](", ")));
            })(((keys).map((function(k) {
                return compile((bindings[k]));
            }))));
        })(get_dash_keys(bindings))) : ("(%s = %s)"));
    })(last(scope));
});
var _star_macros_star_ = {};;
var is_dash_macro_dash_definition_qmark = (function(expr) {
    return ((expr[0]) == "defmacro");
});
var create_dash_macro = (function(expr, scope) {
    return (function(signature) {
        return (function(name, args, body) {
            (function(macro_dash_function) {
                return ((_star_macros_star_[name]) = eval(run_dash_with_dash_scope(name, macro_dash_function, scope)));
            })(compile((["lambda", args]["concat"](body))));
            return expr;
        })((signature[0]), (signature.slice(1)), walk_dash_code((expr.slice(2)), scope));
    })((expr[1]));
});
var is_dash_macro_dash_expansion_qmark = (function(expr) {
    return some((function(macro) {
        return (macro == (expr[0]));
    }), get_dash_keys(_star_macros_star_));
});
var expand_dash_macro = (function(expr, scope) {
    return (function(name, params) {
        return (function(macro) {
            return (function(expansion) {
                return (function(expanded_dash_ast) {
                    return expanded_dash_ast;
                })((walk_dash_code([expansion], scope)[0]));
            })((macro["apply"]({}, params)));
        })((_star_macros_star_[name]));
    })((expr[0]), (((((expr.slice(1))).map(compile))).map(eval)));
});
var walk_dash_code = (function(ast, scope) {
    scope || (scope = [{}]);
    return ((null_qmark(ast)) ? (nil) : ((function(expr) {
        return (function(next, rest) {
            return cons(next, rest);
        })(((create_dash_scope_qmark(expr)) ? ((add_dash_to_dash_scope(expr, scope))) : (((is_dash_macro_dash_definition_qmark(expr)) ? ((create_dash_macro(expr, scope))) : (((is_dash_macro_dash_expansion_qmark(expr)) ? ((expand_dash_macro(expr, scope))) : (((pair_qmark(expr)) ? ((cons((expr[0]), walk_dash_code((expr.slice(1)), scope)))) : ((expr))))))))), walk_dash_code((ast.slice(1)), scope));
    })((ast[0]))));
});
var macroexpand = (function(ast) {
    console.log(format("AST: %j", ast));
    var expanded = ast ? (walk_dash_code(ast)) : null;
    console.log(format("EXPANDED: %j", expanded));
    return ast ? expanded : ([]);
});
((exports["macroexpand"]) = macroexpand);
