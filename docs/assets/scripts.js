
console.log("script.js");

const NOW = new Date();
const TODAY = [NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate()].join('-');

function main() {
  getTreesFromNetwork(onTreeLoad);
}

function onTreeLoad(roots) {
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
  window.actions = actions;
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
        break;
      case 'need more input':
        actions.get('need more input').push(result.missing_feature);
        break;
      default:
        throw (`Action ${action} not handled`);
    }
  });

  clearRecommendations();
  if (actions.has('need more input')) {
    var sub = [...new Set(actions.get('need more input'))].join(', ')
    addRecommendation('need more input', sub);
    this.i.draw();
    return;
  }
  if (actions.size == 0) {
    this.i.draw();
    addRecommendation('nothing to do');
    return;
  }
  for (let [rec, path] of actions) {
    var sub = [];
    path.forEach( p => sub.push(p.join(' -> ')));
    addRecommendation(rec, sub.join('<br/>'));
  }
  this.i.draw();
}

function clearRecommendations() {
  var recs = document.querySelector('.recommendations');
  recs.innerHTML = '';
}

function addRecommendation(rec, sub) {
  window.sub = sub;
  var recs = document.querySelector('.recommendations');
  var new_rec = document.createElement('div');
  new_rec.setAttribute('class', 'recommendation');
  var recP = document.createElement('p');
  recP.setAttribute('class', 'recP');
  recP.innerHTML = rec;
  new_rec.appendChild(recP);
  if (sub) {
    var subP = document.createElement('p');
    subP.innerHTML = sub;
    subP.setAttribute('class', 'subP');
    new_rec.appendChild(subP);
  }
  recs.appendChild(new_rec);
}


window.onload = main
