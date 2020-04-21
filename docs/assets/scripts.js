
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
  var recommendation = new Set();
  window.rec = recommendation;
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
    result.required_features().forEach( f => this.i.showFeature(f));
  });






    var action = traverseTree(root, this.i);
    if (action) {
      recommendation.add(action);
    }
    console.log('\n');
    });
  this.i.draw();
  if (recommendation.size > 1 && recommendation.has('nothing to do')) {
    recommendation.delete('nothing to do');
  }
  document.getElementById('recommendation').innerHTML = 
      Array.from(recommendation.values()).join('<br/>');
  }

function traverseTree(root, input) {
  var features = input.getFeatures();
  var next = root;
  while (next instanceof Node && !isLeaf(next)) {
    console.log(""+next);
    next.required_features().forEach( f => { input.showFeature(f); });
    try {
      next = next.traverse(features);
    } catch (e) {
      if (e instanceof NodeError) {
        return 'need more input';
      } else {
        throw (e);
      }
    }
  }
  if (next instanceof Node) {
    return next.action;
  } else {
    return 'nothing to do';
  }
}

window.onload = main
