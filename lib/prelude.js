// Get all the keys from an Objet

function get_dash_keys (obj) {
  var key_list = [];
  for (var p in obj) if (obj.hasOwnProperty(p)) {
    key_list.push(p);
  }
  return key_list;
}

/* LIST FUNCTIONS */

function cons (item, list) {
  var copy = list.slice();
  copy.unshift(item);
  return copy;
}

function last (list) {
  var len = list.length;
  return list[len-1];
}

function butlast (list) {
  var len = list.length;
  return list.slice(0, len-1);
}

// not the most efficient implementation
function some (fn, list) {
  var result = list.filter(fn);
  return result.length > 0 ? result : false;
}

function map (fn, list) {
  return list.map(fn);
}

function pair_qmark (list) {
  return typeof(list) == 'object'
         && list.hasOwnProperty('length')
         && list instanceof Array;
}

function null_qmark (list) {
  return pair_qmark(list)
         && list.length == 0;
}

/* MACRO HELPERS */

function assemble_spliced_tree (tree, acc) {
  acc || (acc = []);
  if (!pair_qmark(tree)) {
    return acc.concat(tree);
  } else if (null_qmark(tree)) {
    return acc;
  } else if (tree[0] == "unquote_dash_splice") {
    // Compile?
    return acc.concat(tree[1]);
  } else {
    head = tree[0];
    tail = tree.slice(1);
    return assemble_spliced_tree(tail,
                                 acc.concat( assemble_spliced_tree(head, [])));
  }
}

/* CONSTANTS */

var nil = [];

/* SUGAR */

function print () {
  console.log.apply(console, arguments);
}

