
console.log("script.js");

const NOW = new Date();
const TODAY = [NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate()].join('-');

function main() {
  var roots = getTrees();
  var i = new Inputs();
  window.roots = roots;
  window.i = i;
  var inputCallback = unboundInputCallback.bind({'roots': roots, 'i': i});
  i.init(getAllElements(inputCallback));
  inputCallback();
}

function validateNumberToFixed(i) {
  return (event) => {
    event.target.valueAsNumber = event.target.valueAsNumber.toFixed(1);
  };
}

function defined(v) {
  return (v || v === false || v == 0);
}

function unboundInputCallback() {
  this.i.hideAll();
  var actions = new Map(); 
  actions.get = function(key) {
    let v = Map.prototype.get.call(this, key)
    if (!defined(v)) {
      v = [];
      actions.set(key, v);
    }
    return v;
  }
  this.roots.forEach( root => {
    let result = traverseTree(root, i.getFeatures());
    for (let f of result.required_features.values()) {
      this.i.showFeature(f);
    }
    switch (result.state) {
      case 'action':
        actions.get(result.action).push(result.path);
        break;
      case 'no action':
      case 'need more input':
        actions.get('need more input').push(result.path);
        break;
      default:
        throw (`Action ${action} not handled`);
    }
  });

  clearRecommendations();
  if (actions.has('need more input')) {
    addRecommendation('need more input', actions.get('need more input'));
    return;
  }
  if (actions.size == 0) {
    addRecommendation('nothing to do');
    return;
  }
  for (let [k, v] of actions) {
    addRecommendation(k, v);
  }
}


window.onload = main
