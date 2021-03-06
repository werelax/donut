/* PREDICATES */

function number_qmark(thing) {
  return typeof(thing) == "number"
         || (typeof(thing) == "string"
         && !!thing.match(/^[\d\.]+$/))
         && thing.trim() != ".";
}

function pair_qmark (list) {
  return !!list
         && typeof(list) == 'object'
         && list.hasOwnProperty('length')
         && list instanceof Array;
}

// not really correct, but...
function atom_qmark (list) {
  return !pair_qmark(list);
}

function null_qmark (list) {
  return pair_qmark(list)
         && list.length == 0;
}

/* LIST FUNCTIONS */

function car (list) {
  return list[0];
}

function cdr (list) {
  return list.slice(1);
}

function nth(i, list) {
  return list[i];
}

function caar (list) {
  return list[0][0];
}

function cadr (list) {
  return nth(1, list);
}

function caadr (list) {
  return list[1][0];
}

function caddr (list) {
  return nth(2, list);
}

function cadddr (list) {
  return nth(3, list);
}

function cddr (list) {
  return list.slice(2);
}

function cdddr (list) {
  return list.slice(3);
}

function cons (item, list) {
  var copy = list.slice();
  copy.unshift(item);
  return copy;
}

function append (item, list) {
  var copy = list.slice();
  copy.push(item);
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

function push_bang (thing, list) {
  list.push(thing);
  return list;
}

// because Array.join() doesn't respect
// things as nulls or undefines
function str_dash_join (list, separator) {
  separator || (separator = "");
  // coerte to string
  separator = separator + "";
  if (null_qmark(list)) {
    return "";
  } else {
    return list.slice(1).reduce(function (acc, el) {
      return  acc + separator +  el;
    }, list[0] + "");
  }
}

function flatten (list) {
  var result = [];
  list.forEach(function (el) {
    el.forEach(function(inner) {
      result.push(inner);
    });
  });
  return result;
}

/* FUNCTION INVOCATION */

function apply (fn, args) {
  return fn.apply({}, args);
}

function call (fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return apply(fn, args);
}

function compose (fn1, fn2) {
  return function() {
    return fn1(fn2.apply({}, arguments));
  }
}

/* MAPPING FUNCTIONS */

// not the most efficient implementation
function some (fn, list) {
  var result = list.filter(fn);
  return result.length > 0 ? result : false;
}

function map (fn, list) {
  if (arguments.length > 2) {
    return _multiple_map.apply({}, arguments);
  }
  return list.map(fn);
}

function _multiple_map (fn) {
  var lists = Array.prototype.slice.call(arguments, 1),
      len = lists[0].length,
      args = [],
      results = [];
  for (var i=0; i<len; i++) {
    args = [];
    lists.forEach(function(l) { args.push(l[i]); });
    results.push(fn.apply({}, args));
  }
  return results;
}

function reduce (fn, list, initial_value) {
  if (!!initial_value) {
    return list.reduce(fn, initial_value);
  } else {
    return list.reduce(fn);
  }
}

/* OBJECT/HASH FUNCTIONS */

// Adds some calling overhead, but its the most correct way
function method_dash_call (method_name, object) {
  return function(object) {
    var args = Array.prototype.slice.call(arguments, 1);
    return object[method_name].apply(object, args);
  };
}

function get_dash_keys (obj) {
  var key_list = [];
  for (var p in obj) if (obj.hasOwnProperty(p)) {
    key_list.push(p);
  }
  return key_list;
}

function has_dash_key (obj, key) {
  // hasOwnProperty has an inconsistent behaviour
  // when passed an array: it first flattens it
  // with .toString() !
  return !pair_qmark(key)
          && obj.hasOwnProperty(key);
}

/* PRIMIVITE TYPES FUNCTIONS */

function str () {
  return Array.prototype.join.call(arguments, "");
};

/* MACRO HELPERS */

function assemble_spliced_tree (tree) {
  if (!pair_qmark(tree)) {
    return tree;
  } else {
    return tree.reduce(function(acc, el) {
      if (pair_qmark(el)) {
        if (el[0] == "unquote_dash_splice") {
          return acc.concat(el[1]);
        } else if (el[0] == "quasiquote") {
          // Don't descend to this branch!!
          return append(el, acc);
        } else {
          return append(assemble_spliced_tree(el), acc);
        }
      } else {
        if (el == "unquote_dash_splice") {
          return acc;
        } else {
          return append(el, acc);
        }
      }
    }, []);
  }
}

/* CONSTANTS */

var nil = [];

/* SUGAR */

function print () {
  console.log.apply(console, arguments);
}

