var read_file = require('fs').readFile;
var generate_js = require('./generator.js').generate_js;

// node donut.js <file.dt>

var filename = process.argv[process.argv.length - 1],
    command;

if (process.argv.length == 3) {
  command = "compile";
} else {
  command = process.argv[2];
}

read_file(filename, 'utf-8', function(err, data) {
  if (err) { throw err; }
  generate_js(data, function(code) {
    if (command == "run") {
      eval(code);
    } else {
      console.log("%s", code);
    }
  });
});
