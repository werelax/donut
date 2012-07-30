var format = require('util').format;

/* Reader primitives */

var group_delimiters = {};

function declare_group_delimiters(open, close) {
  group_delimiters[open] = close;
}

declare_group_delimiters('(', ')');
declare_group_delimiters('[', ']');
declare_group_delimiters('{', '}');

function find_closing(code, open_char, close_char, balance, acc) {
  close_char || (close_char = group_delimiters[open_char]);
  balance || (balance = 0); acc || (acc = 0);
  var next_oseq = code.indexOf(open_char) + 1,
      next_oseq_found = (next_oseq > 0),
      next_cseq = code.indexOf(close_char) + 1,
      next_cseq_found = (next_cseq > 0);

  if ((!next_cseq_found && balance != 0) || balance < 0) {
        throw new Error("Unbalanced List: " + code);
    }

  if (balance == 0 && acc > 0) {
    // end reached
    return acc;
  } else if (next_oseq_found && next_oseq < next_cseq) {
    // found (
    return find_closing(code.substring(next_oseq), open_char, close_char, balance +1, acc + next_oseq);
  } else {
    // found )
    return find_closing(code.substring(next_cseq), open_char, close_char, balance -1, acc + next_cseq);
  }
}

function read_till_closing(code, open_char) {
  var end_exp = find_closing(code, open_char);
  return code.substr(0, end_exp);
}

function strip_delimiters(stream) {
  var openc = stream[0],
      closec = stream.substr(-1),
      length = stream.length;
  if (closec == group_delimiters[openc]) {
    return stream.substr(1, length-2);
  } else {
    return stream;
  }
}

/* Reader macros */

var reader_macros = [];

function call_prefix_reader_macro(fn, stream) {
  var tmp = read_token(stream),
      token = tmp[0],
      remainder = tmp[1],
      expansion = fn(token.stream);
  return [null, expansion + remainder];
};

function call_delimited_reader_macro(fn, symbol, stream) {
  var content_end = find_closing(stream, symbol),
      content = strip_delimiters(stream.substr(0, content_end)),
      remainder = stream.substr(content_end),
      expansion = fn(content);
  return [null, expansion + remainder]
}

function def_prefix_reader_macro (symbol, fn) {
  var invocation = function(stream) {
    return call_prefix_reader_macro(fn, stream.substr(symbol.length));
  };
  return reader_macros.unshift({name: symbol, fn: invocation});
}

function def_delimited_reader_macro (symbol, fn) {
  var invocation = function(stream) { return call_delimited_reader_macro(fn, symbol, stream); };
  return reader_macros.unshift({name: symbol, fn: invocation});
}

def_prefix_reader_macro("'", function(stream) {
  return format("(quote %s)", stream);
});

def_prefix_reader_macro(":", function(stream) {
  return format("\"%s\"", stream.trim());
});

def_prefix_reader_macro(".", function(stream) {
  return format("method-call %s ", stream.trim());
});

def_delimited_reader_macro("[", function(stream) {
  return format("(make-vector %s)", strip_delimiters(stream));
});

def_delimited_reader_macro("{", function(stream) {
  return format("(make-object %s)", stream);
});

/* Readers */

var readers = [];

function def_reader (symbol, fn) {
  return readers.push({name: symbol, fn: fn});
}

// list
def_reader('(', function(stream) {
  var length = find_closing(stream, '('),
      sexp = stream.substr(0, length),
      remainder = stream.substr(length);
  return [{type: 'list', stream: sexp}, remainder];
});

// string
def_reader('"', function(stream) {
  // XXX: In this shitty implementaiton, you cannot embed \" or \' inside strings!
  var string_char = stream[0],
      string_end = stream.substr(1).indexOf(string_char) + 2,
      string = stream.substr(0, string_end).trim(),
      remainder = stream.substring(string_end);
  return [{type: 'string', stream: string}, remainder];
});

// keyword
def_reader(':', function(stream) {
  throw new Error("PENDING");
});

// symbol
// name == emtpy string => default reader
def_reader('', function(stream) {
  var next_sp = stream.indexOf(' ') + 1,
      atom_end = next_sp || stream.length,
      atom = stream.substr(0, atom_end),
      remainder = stream.substr(atom_end).trim();
  return [{type: 'symbol', stream: atom}, remainder];
});

/* Reader/Macro dispatcher */

function select_from_collection (collection, stream) {
  var len = collection.length, item;
  for (var i=0; i<len; i++) {
    item = collection[i];
    if (stream.substr(0, item.name.length) == item.name) {
      return item.fn;
    }
  }
  return false;
}

function select_reader (stream) {
  return select_from_collection(reader_macros, stream)
         || select_from_collection(readers, stream);
}

/* Main reader utilities */

/* Parsers */

function to_js_name(string) {
  return string
          .replace(/-/g, '_dash_')
          .replace(/\*/g, '_star_')
          .replace(/\?/g, '_qmark')
          ;
}

var parsers = {
  'symbol': function(stream) {
    return to_js_name(stream.trim());
  },
  'string': function(stream) {
    return stream.trim();
  },
  'list': function(stream) {
    var items = read(strip_delimiters(stream));
    return items;
  }
};

function parse (token) {
  var parser = parsers[token.type];
  return parser(token.stream);
}

function read_token (code) {
  var reader = select_reader(code),
      token = reader(code.trim());
  // discard null tokens (reader macroexpansions)
  if (token[0] != null) {
    return token;
  } else {
    return read_token(token[1]);
  }
}

function strip_comments(code) {
  return code.replace(/;.*\n/g, '');
}

/* Main READ entry point */

function read (code, tree) {
  tree || (tree = []);
  var step = read_token(strip_comments(code)),
      token = step[0],
      remainder = step[1].trim();
  tree.push( parse(token));
  if (remainder.length == 0) {
    return tree;
  } else {
    return read(remainder, tree);
  }
}

// Only exports the main entry point

exports['read'] = read;
