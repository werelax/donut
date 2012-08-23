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
var compile = (require(__dirname + "/compiler.js")["compile"]);
var format = (require("util")["format"]);
var read_dash_file = (require("fs")["readFileSync"]);;
eval(read_dash_file(__dirname + "/../lib/prelude.js", "utf-8"));
var _star_macros_star_ = {};;
var is_dash_var_qmark = (function(expr) {
    return ((car(expr) == "define") || (car(expr) == "var"));
});
var is_dash_lambda_qmark = (function(expr) {
    return (function() {
        var head = car(expr);
        var tail = cdr(expr);
        return ((pair_qmark(head) && (car(head) == "lambda")));
    })();
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
    return format(ctx, format("%s; %%s", compile(expr)));
});
var expand_dash_lambda = (function(expr, ctx) {
    return (function() {
        var definition = car(expr);
        var args = map(macro_dash_walker, cdr(expr));
        var params = cadr(definition);
        var body = cddr(definition);
        return ((function() {
            var new_dash_ctx = format(ctx, format("return (function(%s) { %%s })(%s);", str_dash_join(params, ", "), str_dash_join(map(compile, args), ", ")));
            var new_dash_body = macro_dash_walker(body, new_dash_ctx);
            return (assemble_spliced_tree([
                ["lambda", params, ["unquote_dash_splice", new_dash_body]],
                ["unquote_dash_splice", args]
            ]));
        })());
    })();
});
var run_dash_with_dash_context = (function(name, expr, ctx) {
    return format("(function() { %s })()", format(ctx, format("var %s; return %s = %s;", name, name, compile(expr))));
});
var compile_dash_macro = (function(expr, ctx) {
    (function() {
        var signature = cadr(expr);
        var name = car(signature);
        var params = cdr(signature);
        var body = macro_dash_walker(cddr(expr), ctx);
        var macro_dash_function = compile(assemble_spliced_tree(["lambda", params, ["unquote_dash_splice", body]]));
        return (((_star_macros_star_[name]) = eval(run_dash_with_dash_context(name, macro_dash_function, ctx))));
    })();
    return expr;
});
var expand_dash_macro = (function(expr, ctx) {
    return (function() {
        var name = car(expr);
        var params = cdr(expr);
        var macro = (_star_macros_star_[name]);
        var expansion = apply(macro, params);
        var walked_dash_expansion = macro_dash_walker(expansion, ctx);
        return (walked_dash_expansion);
    })();
});
var macro_dash_walker = (function(tree, ctx) {
    ctx || (ctx = "%s");
    return (((atom_qmark(tree) || null_qmark(tree) || is_dash_quoted_qmark(tree))) ? ((tree)) : (((is_dash_var_qmark(car(tree))) ? ((cons(car(tree), macro_dash_walker(cdr(tree), add_dash_var_dash_to_dash_ctx(car(tree), ctx))))) : ((((is_dash_lambda_qmark(tree)) ? ((expand_dash_lambda(tree, ctx))) : (((is_dash_macro_dash_definition_qmark(tree)) ? ((compile_dash_macro(tree, ctx))) : (((is_dash_macro_dash_expansion_qmark(tree)) ? ((expand_dash_macro(tree, ctx))) : ((cons(macro_dash_walker(car(tree), ctx), macro_dash_walker(cdr(tree), ctx))))))))))))));
});
((exports["macroexpand"]) = macro_dash_walker);
