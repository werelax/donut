var read = require('./reader.js').read;
var compile = require('./compiler.js').compile;

// node donut.js <file.dt>

require('fs').readFile(process.argv[2], 'utf-8', function(err, data) {
  if (err) throw err;
  var code = read(data).map(compile).join(";\n");
  console.log("== DONUT: \n");
  console.log(data);
  console.log("\n== JS: \n");
  console.log(code);
  console.log("\n== RUN: \n");
  eval(code);
});


/* Pending */

/*
✓ (quote (a b c d)) -> (a b c d)
✓ (def a 2 b 3) -> var a = 2, b = 3;
✓ (set a 43)    -> a = 43
✓ defn
✓ (get a 'some-key') -> a['some-key']
✓ progn or some kind of block
✓ (let [a 2] body) -> (function(a) { body })(2)
✓ list, hash, vector constructors (with some NOTES)

* some kind of defmacro

-> this is just library work
* while, for, when, unless, cond, if-let, when-let
* map filter etc...
*/
