var read = require('./src/reader.js').read;
var compile = require('./src/compiler.js').compile;
var macroexpand = require('./src/macros.js').macroexpand;
var read_file = require('fs').readFile;
var readline = require('readline');
var format = require('util').format;

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

      eval(js_prelude);
      eval(prelude);

      console.log("\n\n (·) DONUT 0.0.1 :: Welcome!\n\n");

      var repl = function() {
        rl.question('DONUT> ', function(ans) {
          try {
            var result = eval(macroexpand(read(ans)).map(compile).concat('').join(";\n"));
            console.log(format("-> %j", result));
          } catch (e) {
            console.log(e);
          }
          setTimeout(repl, 0);
        });
      }
      repl();
    });
});
