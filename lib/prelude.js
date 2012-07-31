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

