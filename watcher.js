var read_file = require('fs').readFile;
var generate_js = require(__dirname + '/generator.js').generate_js;
var fs = require('fs');

// node donut.js <file.dt>

var path = process.argv[process.argv.length - 1],
    js_file = path.replace(/dt$/, "js"),
    command;


function compile_dt_file (path) {
  read_file(path, 'utf-8', function(err, data) {
    if (err) { throw err; }
    generate_js(data, function(js_code) {
      fs.writeFileSync(js_file, js_code, 'utf-8');
      console.log(" -> generated: %s", js_file);
    });
  });
}

// Compile for the first time
compile_dt_file(path);

// Watcher
fs.watch(path, function(e, name) {
  compile_dt_file(path);
  // TODO: Only watches 1 file!
})
