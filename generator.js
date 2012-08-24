var read = require(__dirname + '/src/reader.js').read;
var compile = require(__dirname + '/src/compiler.js').compile;
var macroexpand = require(__dirname + '/src/macros.js').macroexpand;
var read_file = require('fs').readFile;
var format = require('util').format;
var decorate = require('js-beautify').js_beautify;

function generate_js (donut_code, callback) {

  read_file(__dirname + "/lib/prelude.js", 'utf-8', function(err, data) {
    if (err) { throw err; }
    var js_prelude = data;

    read_file(__dirname + "/lib/prelude.dt", 'utf-8', function(err, data) {
      if (err) { throw err; }
      var prelude = data + "\n\n;;== END OF PRELUDE\n\n";

      // Generation

      try {

        var expanded = macroexpand(read(prelude + donut_code));
        var last = expanded[expanded.length-1];
        var code = expanded.map(compile).concat('').join(";\n");

        // DISABLE MACROS (if something goes terrybly wrong)
        // var code = read(code).map(compile).concat('').join(";\n");

        // TODO: Make all this info available with some command line options
        // console.log("== DONUT: \n");
        // console.log(donut_code);
        // console.log("== TRANDFORMED: \n");
        // console.log(format("%j", expanded));
        // console.log("\n== JS: \n");
        // console.log(decorate(code));
        // console.log("\n== RUN: \n");

        // TODO: Don't include the js prelude on EVERY compiled file...
        var full_code = js_prelude + code;
        callback(decorate(full_code));

      } catch(e) {
        throw e;
        console.log("#==> ERROR: %s", e);
      }
    });
  });
}

exports["generate_js"] = generate_js;
