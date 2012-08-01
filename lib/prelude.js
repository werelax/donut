// Get all the keys from an Objet

function get_dash_keys (obj) {
  var key_list = [];
  for (var p in obj) if (obj.hasOwnProperty(p)) {
    key_list.push(p);
  }
  return key_list;
}

/* LIST FUNCTIONS */

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
