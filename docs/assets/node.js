/**
 * Node
 *
 * Implements a node of a decision tree.
 */

console.log('node.js')

var Node = function(params, parent) {
  this.right_action = params.right_action;
  this.left_action = params.left_action;
  this.left_child = params.left_child;
  this.right_child = params.right_child;
  this.feature = params.feature;
  this.operation = params.operation;
  this.threshold = params.threshold;
  this.threshold_feature = params.threshold_feature;

  this.parent = parent;
}

Node.prototype.toString = function() {
  if (this.action) {
    return `action: ${this.action}`;
  }
  if (this.threshold_feature) {
    return `${this.feature} ${this.operation} ${this.threshold_feature}`;
  } else {
    return `${this.feature} ${this.operation} ${this.threshold}`;
  }
}

Node.prototype.isLeaf = function() {
  return (!defined(this.left_child) && !defined(this.right_child));
}

Node.prototype.evalStr = function(features) {
  var test = this.test(features);
  var f = `${this.feature} (${features[this.feature]})`;
  var t = "" + this.threshold;
  if (this.threshold_feature) {
    t = `${this.threshold_feature} (${features[this.threshold_feature]})`;
  }

  switch (this.operation) {
    case '==':
      var op = test ? '==' : '!=';
      return `${f} ${op} ${t}`;
    case '>=':
      var op = test ? '>=' : '<';
      return `${f} ${op} ${t}`;
    case '<=':
      var op = test ? '<=' : '>';
      return `${f} ${op} ${t}`;
    case '>':
      var op = test ? '>' : '<=';
      return `${f} ${op} ${t}`;
    case '<':
      var op = test ? '<' : '>=';
      return `${f} ${op} ${t}`;
    case 'not':
      var op = test ? 'not' : 'is';
      return `${op} ${f}`;
    case 'is':
      var op = test ? 'is' : 'not';
      return `${op} ${f}`;
    default:
      throw(`Operation "${this.operation}" not implemented`);
  }

}

Node.prototype.test = function(features) {
  var f = features[this.feature];
  if (!defined(f)) {
    throw new NodeError(this.feature, `Feature ${this.feature} not available`);
  }

  var t = this.threshold;
  if (this.threshold_feature) {
    t = features[this.threshold_feature]
    if (!defined(t)) {
      throw new NodeError(
        this.threshold_feature,
        `Feature ${this.threshold_feature} not available`);
    }
  }

  switch (this.operation) {
    case '==':
      if (f == t) {
        return true;
      }
      return false;
    case '>=':
      if (f >= t) {
        return true;
      }
      return false;
    case '<=':
      if (f <= t) {
        return true;
      }
      return false;
    case '>':
      if (f > t) {
        return true;
      }
      return false;
    case '<':
      if (f < t) {
        return true;
      }
      return false;
    case 'not':
      if (!f) {
        return true;
      }
      return false;
    case 'is':
      if (f) {
        return true;
      }
      return false;
    default:
      throw(`Operation "${this.operation}" not implemented`);
  }
}

Node.prototype.traverse = function(features) {
  var right_return = this.right_child;
  var left_return = this.left_child;
  if (this.right_action) {
    right_return = this.right_action;
  }
  if (this.left_action) {
    left_return = this.left_action;
  }

  if (this.test(features)) {
    return right_return;
  } else {
    return left_return;
  }
}

Node.prototype.required_features = function() {
  var f = [];
  if (this.feature) {
    f.push(this.feature);
  }
  if (this.threshold_feature) {
    f.push(this.threshold_feature);
  }
  return f;
}

class NodeError extends Error {
  constructor(feature, message) {
    super(message);
    this.name = "NodeError";
    this.feature = feature;
  }
}

function isLeaf(node) {
  if (node instanceof Node) {
    return node.isLeaf();
  }
  return (new Node(node)).isLeaf();
}

function DFS(root, op) {
  var node_stack = [];
  if (isLeaf(root)) {
    return;
  }
  node_stack.push(root);
  while (node_stack.length > 0) {
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
  var take_metformin = {
                    'feature': 'egfr',
                    'threshold': 30,
                    'operation': '>=',
                    'right_child': {
                                    'feature': 'met',
                                    'operation': '==',
                                    'threshold': 0,
                                    'right_child': {
                                                    'feature': 'side_effects_met',
                                                    'operation': 'not',
                                                    'right_action': 'take metformin'}}};
  var take_sulfonylurea = {'feature': 'contra_su',
                           'operation': 'not',
                           'right_action': 'take sulfonylurea'};
  var add_oral = fillLeft(take_metformin, take_sulfonylurea);
  var add_injectible = {"feature":"risk",
                    "operation":"==",
                    "threshold":"ascvd_risk",
                    "right_action":"take GLP-1 RA with CVD benefits",
                    "left_child":{"feature":"risk",
                                  "operation":"==",
                                  "threshold":"ckd_hf_risk",
                                  "right_child":{"feature":"egfr",
                                                 "operation":">=",
                                                 "threshold":"45",
                                                 "right_action":"take SGLT2i with benefits",
                                                 "left_action":"take GLP-1 RA with CVD benefits"},
                                   "left_child":{"feature":"risk",
                                                 "operation":"==",
                                                 "threshold":"no_risk",
                                                 "right_child":{"feature":"goals2",
                                                                "operation":"==",
                                                                "threshold":"hypo_goals2",
                                                                "right_action":"take GLP-1 RA",
                                                                "left_child":{"feature":"goals2",
                                                                              "operation":"==",
                                                                              "threshold":"weight_goals2",
                                                                              "right_action":"take GLP-1 RA",
                                                                              "left_child":{"feature":"goals2",
                                                                                            "operation":"==",
                                                                                            "threshold":"none",
                                                                                            "right_action":"take GLP-1 RA"}}}}}};
  
  
  var start_first_drug = fillLeft(add_oral, add_injectible);
  
  var start_second_drug = {'feature': 'last_drug_time',
                       'operation': '<',
                       'threshold': 90,
                       'right_action': 'give drug 3 months before adding a second drug.',
                       'left_child': {'feature': 'current_a1c',
                                      'operation': '>',
                                      'threshold_feature': 'target_a1c+1',
                                      'right_child': fillLeft(add_injectible, add_oral),
                                      'left_child': add_oral}};
  
  var root1 = {
               'feature': 'current_a1c',
               'threshold': 6.5,
               'operation': '>=',
               'right_child': take_metformin};
  
  
  var root2 = {'feature': 'current_a1c',
               'threshold_feature': 'target_a1c',
               'operation': '>',
               'right_child': {'feature': 'n_drugs',
                               'operation': '==',
                               'threshold': 0,
                               'right_child': start_first_drug,
                               'left_child': {'feature': 'n_drugs',
                                              'operation': '==',
                                              'threshold': 1,
                                              'right_child': start_second_drug,
                                              'left_action': 'Don\'t know how more than 2 drugs'}}};
  return [inflateTree(root1), inflateTree(root2)];
}

function inflateTree(root) {
  var op = {'before': (curr_node) => {
    if (curr_node.right_child) {
      curr_node['right_child'] = new Node(curr_node.right_child, curr_node);
    }
    if (curr_node.left_child) {
      curr_node['left_child'] = new Node(curr_node.left_child, curr_node);
    }
  }};
  var root_copy = JSON.parse(JSON.stringify(root));
  DFS(root_copy, op);
  return new Node(root_copy);
}


function traverseTree(root, features) {
  var results = {};
  var next = root;
  results['path'] = [];
  results['required_features'] = new Set();
  while (next instanceof Node) {
    try {
      next.required_features().forEach( f => results.required_features.add(f));
      results.path.push(next.evalStr(features));
      next = next.traverse(features);
    } catch (e) {
      if (e instanceof NodeError) {
        results['state'] = 'need more input';
        results['missing_feature'] = e.feature;
        return results;
      } else {
        throw (e);
      }
    }
  }
  if (next) {
    results['state'] = 'action';
    results['action'] = next;
  } else {
    results['state'] = 'no action';
  }
  return results;
}




