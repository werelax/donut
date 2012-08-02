var read = require('./src/reader.js').read;
var compile = require('./src/compiler.js').compile;
var macroexpand = require('./src/macros.js').macroexpand;
var read_file = require('fs').readFile;
var format = require('util').format;
var decorate = require('js-beautify').js_beautify;

// node donut.js <file.dt>

var filename = process.argv[process.argv.length - 1],
    command;

if (process.argv.length == 3) {
  command = "compile";
} else {
  command = process.argv[2];
}

read_file("./lib/prelude.js", 'utf-8', function(err, data) {
  if (err) throw err;
    var js_prelude = data;

  read_file('./lib/prelude.dt', 'utf-8', function(err, data) {
    if (err) throw err;
      var prelude = data + "\n\n;;== END OF PRELUDE\n\n";

    read_file(filename, 'utf-8', function(err, data) {
      if (err) throw err;
      var donut_code = data;
      var expanded = macroexpand(read(prelude + donut_code));
      var last = expanded[expanded.length-1];
      var code = expanded.map(compile).concat('').join(";\n");

      // DISABLE MACROS (if something goes terrybly wrong)
      // var code = read(data).map(compile).concat('').join(";\n");

      // TODO: Make all this info available with some command line options
      // console.log("== DONUT: \n");
      // console.log(donut_code);
      // console.log("== TRANDFORMED: \n");
      // console.log(format("%j", expanded));
      // console.log("\n== JS: \n");
      // console.log(decorate(code));
      // console.log("\n== RUN: \n");

      if (command == "run") {
        eval(js_prelude +  code);
      } else {
        console.log(format("%s", decorate(code)));
      }
    });
  });
});
