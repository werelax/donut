Node = function (type, value) {
  return {type: type, value: value};
};

exports.List = function (items) {
  return new Node('list', items);
};

exports.String = function (value) {
  return new Node('string', value);
};

exports.Symbol = function (name) {
  return new Node('symbol', name);
};
