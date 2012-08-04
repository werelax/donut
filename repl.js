var read = require('./src/reader.js').read;
var compile = require('./src/compiler.js').compile;
var macroexpand = require('./src/macros.js').macroexpand;
var read_file = require('fs').readFile;
var readline = require('readline');
var decorate = require('js-beautify').js_beautify;
var format = require('util').format;
var vm = require('vm');

var repl_context = vm.createContext({
  console: console
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// node repl.js

read_file("./lib/prelude.js", 'utf-8', function(err, data) {
  if (err) throw err;
    var js_prelude = data;

    read_file('./lib/prelude.dt', 'utf-8', function(err, data) {
      if (err) throw err;
      var prelude = read(data).map(compile).concat('').join(";\n");

      vm.runInContext(js_prelude, repl_context);
      vm.runInContext(prelude, repl_context);

      console.log("\n\n (·) DONUT 0.0.1 :: Welcome!\n\n");

      var repl = function() {
        rl.question('DONUT * ', function(ans) {
          var result, ast, final_ast, compiled;
          if (ans.trim()) try {
            ast = read(ans);
            final_ast = macroexpand(ast);
            compiled = final_ast.map(compile).concat('').join(";\n");

            console.log(format("  * AST: %j", ast));
            console.log(format("  * EXPANDED: %j", final_ast));
            console.log(format("  * JS: %s", decorate(compiled)));

            console.log("");

            result = vm.runInContext(compiled, repl_context);

            console.log("");

            console.log(format("-> %j", result));

            console.log("");

          } catch (e) {
            console.log(e);
          }
          setTimeout(repl, 0);
        });
      }
      repl();
    });
});
