/**
 * Node
 *
 * Implements a node of a decision tree.
 */

var Node = function(params) {
  this.is_leaf = params.is_leaf;
  this.action = params.action;
  this.parent = params.parent;
  this.left_child = params.left_child;
  this.right_child = params.right_child;
  this.feature = params.feature;
  this.operation = params.operation;
  this.threshold = params.threshold;
  this.threshold_feature = params.threshold_feature;
}

Node.prototype.toString = function() {
  if (this.action) {
    return `action: ${this.action}`;
  }
  if (this.threshold_feature) {
    return `${this.features} ${this.operation} ${this.threshold_feature}`;
  } else {
    return `${this.features} ${this.operation} ${this.threshold}`;
  }
}

Node.prototype.traverse = function(features) {
  if (this.action) {
    return this.action;
  }

  if (!this.feature) {
    return this.right_child;
  }

  var f = features[this.feature];
  if (f == undefined) {
    throw new NodeError(this.feature, `Feature ${this.feature} not available`);
  }

  var t = this.threshold;
  if (this.threshold_feature) {
    t = features[this.threshold_feature]
    if (t == undefined) {
      throw new NodeError(
        this.threshold_feature,
        `Feature ${this.threshold_feature} not available`);
    }
  }
  var right_return = this.right_child;
  var left_return = this.left_child;
  if (this.action) {
    right_return = this.action;
    left_return = null;
  }

  switch (this.operation) {
    case '==':
      if (f == t) {
        return right_return;
      }
      return left_return;
    case '>=':
      if (f >= t) {
        return right_return;
      }
      return left_return;
    case '<=':
      if (f <= t) {
        return right_return;
      }
      return left_return;
    case '>':
      if (f > t) {
        return right_return;
      }
      return left_return;
    case '<':
      if (f < t) {
        return right_return;
      }
      return left_return;
    case 'not':
      if (!f) {
        return right_return;
      }
      return left_return;
    case 'is':
      if (f) {
        return right_return;
      }
      return left_return;
  }
}


class NodeError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "NodeError";
    this.field = field;
  }
}

function isLeaf(node) {
  return (node == undefined) || (node.action) || (node == null)
}


function DFS(root, op) {
  var node_stack = [];
  if (isLeaf(root)) {
    return;
  }
  node_stack.push(root);
  while (node_stack.length > 0) {
    console.log('dfs');
    let curr_node = node_stack.pop();
    if (isLeaf(curr_node)) {
      continue;
    }
    if (op.before) {
      op.before(curr_node);
    }
    if (curr_node.right_child) {
      node_stack.push(curr_node['right_child']);
    }
    if (curr_node.left_child) {
      node_stack.push(curr_node['left_child']);
    } 
    if (op.after) {
      op.after(curr_node);
    }
  }
}

function getAllFeatures(root) {
  var op = {'features': new Set(),
            'after': () => {},
            'before': function(curr_node) {
              this.features.add(curr_node.feature);
            }};
  DFS(root, op);
  return op.features;
}

function fillLeft(root, left) {
  console.log('fill left');
  var root_copy = JSON.parse(JSON.stringify(root));
  var op = {'before': () => {},
            'after': (curr_node) => {
              if (!('left_child' in left)) {
                curr_node['left_child'] = left;
              }
            }};

  DFS(root_copy, op);
  return root_copy;
}

function getTrees() {
  var take_metformin = {'is_leaf': false,
                    'feature': 'egfr',
                    'threshold': 30,
                    'operation': '>=',
                    'right_child': {'is_leaf': false,
                                    'feature': 'taking_met',
                                    'operation': 'not',
                                    'right_child': {'is_leaf': false,
                                                    'feature': 'side_effects_met',
                                                    'operation': 'not',
                                                    'right_child': {'is_leaf': true,
                                                                    'action': 'take metformin'}}}};
  var take_sulfonylurea = {'feature': 'contra_su',
                       'operation': 'not',
                       'right_child': {'action': 'take sulfonylurea'}};
  var add_oral = fillLeft(take_metformin, take_sulfonylurea);
  var add_injectible = {"feature":"risk",
                    "operation":"==",
                    "target":"ascvd_risk",
                    "right_child":{"action":"take GLP-1 RA with CVD benefits"},
                    "left_child":{"feature":"risk",
                                  "operation":"==",
                                  "target":"ckd_hf_risk",
                                  "right_child":{"feature":"egfr",
                                                 "operation":">=",
                                                 "target":"45",
                                                 "right_child":{"action":"take SGLT2i with benefits"},
                                                 "left_child":{"action":"take GLP-1 RA with CVD benefits"}},
                                   "left_child":{"feature":"risk",
                                                 "operation":"==",
                                                 "target":"no_risk",
                                                 "right_child":{"feature":"goals2",
                                                                "operation":"==",
                                                                "target":"hypo_goals2",
                                                                "right_child":{"action":"take GLP-1 RA"},
                                                                "left_child":{"feature":"goals2",
                                                                              "operation":"==",
                                                                              "target":"weight_goals2",
                                                                              "right_child":{"action":"take GLP-1 RA"},
                                                                              "left_child":{"feature":"goals2",
                                                                                            "operation":"==",
                                                                                            "target":"none",
                                                                                            "right_child":{"action":"take GLP-1 RA"}}}}}}};
  
  
  var start_first_drug = fillLeft(add_oral, add_injectible);
  
  var start_second_drug = {'feature': 'first_drug_time',
                       'operation': '<',
                       'threshold': '3m',
                       'right_child': {'action': 'take first drug for 3 months before adding a second drug.'},
                       'left_child': {'feature': 'ca1c',
                                      'operation': '>',
                                      'threshold_feature': 'ta1c+1',
                                      'right_child': add_injectible,
                                      'left_child': fillLeft(add_oral, add_injectible)}};
  
  var root1 = {'is_leaf': false,
               'feature': 'ca1c',
               'threshold': 6.5,
               'operation': '>=',
               'right_child': take_metformin};
  
  
  var root2 = {'feature': 'ca1c',
           'threshold_feature': 'ta1c',
           'operation': '>',
           'right_child': {'feature': 'n_others',
                           'operation': '==',
                           'threshold': 0,
                           'right_child': start_first_drug},
           'left_child': {'feature': 'n_others',
                          'threshold': 1,
                          'right_child': start_second_drug},
                          'left_child': {'is_leaf': true,
                                         'action': 'Don\'t know how more than 2 drugs'}};
  return [inflateTree(root1), inflateTree(root2)];
}

function traverseTree(root, features) {
  var prev = root;
  var next = root;
  while (next instanceof Node) {
    console.log(next);
    next = next.traverse(features);
  }
  console.log(next);
}

function isFull(node) {
  return (node.left_child instanceof Node && node.right_child instanceof Node);
}

function nextChild(node) {
  if ('right_child' in node && !(node.right_child instanceof Node)) {
    return ['right_child', node.right_child];
  }
  if ('left_child' in node && !(node.right_child instanceof Node)) {
    return ['left_child', node.left_child];
  }
  return [null, null];
}

function inflate(node) {
  return new Node(node);
}

function inflateTree(root) {
  var op = {'before': (curr_node) => {
    if (curr_node.right_child) {
      curr_node['right_child'] = inflate(curr_node.right_child);
    }
    if (curr_node.left_child) {
      curr_node['left_child'] = inflate(curr_node.left_child);
    }
  }};
  var root_copy = JSON.parse(JSON.stringify(root));
  DFS(root_copy, op);
  return inflate(root_copy);
}

