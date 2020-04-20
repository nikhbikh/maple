
console.log("script.js");

function main() {
  new CurrentDrugs();
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
  this.roots.forEach( root => { traverseTree(root, this.i); console.log('\n'); });
  this.i.draw();
}

function traverseTree(root, input) {
  var features = input.getFeatures();
  var next = root;
  while (next instanceof Node) {
    console.log(""+next);
    next.required_features().forEach( f => { input.showFeature(f); });
    try {
      next = next.traverse(features);
    } catch (e) {
      if (e instanceof NodeError) {
        return;
      } else {
        throw (e);
      }
    }
  }
  console.log(next);
}

window.onload = main
