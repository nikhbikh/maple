console.log('inputs.js')

var Inputs = function() {
  this.hidden = new Set();
  this.visible = new Set();
}

Inputs.prototype.init = function(elements) {
  this.elements = new Map();
  this.visible.clear();
  this.hidden.clear();
  console.log(elements);
  elements.forEach( elt => {
    this.elements.set(elt.getName(), elt);
    this.hidden.add(elt);
  });
  this.draw();
}

Inputs.prototype.showFeature = function(feature) {
  var el = this.elements.get(feature);
  if (!el) {
    throw new Error(`Feature "${feature}" not available`);
  }
  this.hidden.delete(el);
  this.visible.add(el);
}

Inputs.prototype.hideAll = function(feature) {
  this.visible.clear();
  for (let el of this.elements.values()) {
    this.hidden.add(el)
  }
}

Inputs.prototype.draw = function() {
  this.hidden.forEach( el => { el.hide(); });
  this.visible.forEach( el => { el.show(); });
}

Inputs.prototype.getFeatures = function() {
  var features = new Map();
  for (let [key, val] of this.elements) {
    features[key] = val.getValue();
  }
  return features;
}

var AbstractInput = function() {}
AbstractInput.prototype.getName = function() {
  throw new Error('Not implemented!');
}
AbstractInput.prototype.getValue = function() {
  throw new Error('Not implemented!');
}
AbstractInput.prototype.show = function() {
  throw new Error('Not implemented!');
}
AbstractInput.prototype.hide = function() {
  throw new Error('Not implemented!');
}
AbstractInput.prototype.listen = function() {
  throw new Error('Not implemented!');
}

var NumberInput = function(inputCallback, id, precision) {
  AbstractInput.call(this);
  this.name = id;
  this.elt = document.getElementById(id);
  this.elt.onblur = validateNumberToFixed(1);
  this.listen(inputCallback);
}
NumberInput.prototype = Object.create(AbstractInput.prototype);
NumberInput.prototype.constructor = NumberInput;
NumberInput.prototype.getValue = function() {
  return this.elt.valueAsNumber;
}
NumberInput.prototype.getName = function() {
  return this.name;
}
NumberInput.prototype.show = function() {
  this.elt.parentElement.hidden = false;
}
NumberInput.prototype.hide = function() {
  this.elt.parentElement.hidden = true;
}
NumberInput.prototype.listen = function(inputCallback) {
  this.elt.oninput = inputCallback; 
}

var Ta1cPlus1 = function(inputCallback) {
  NumberInput.call(this, inputCallback, 'ta1c', 1);
}
Ta1cPlus1.prototype = Object.create(NumberInput.prototype);
Ta1cPlus1.prototype.constructor = Ta1cPlus1;
Ta1cPlus1.prototype.getName = function() {
  return 'ta1c+1';
}
Ta1cPlus1.prototype.getValue = function() {
  return this.elt.valueAsNumber + 1;
}

var RadioInput = function(inputCallback, name) {
  this.elts = document.getElementsByName(name);
  this.name = name;
  this.listen(inputCallback);
}
RadioInput.prototype = Object.create(AbstractInput.prototype);
RadioInput.prototype.constructor = RadioInput;
RadioInput.prototype.getValue = function() {
  for (var i = 0; i < this.elts.length; i++) { 
    if (this.elts[i].checked) {
      return this.elts[i].id;
    }
  }
}
RadioInput.prototype.getName = function() {
  return this.name;
}
RadioInput.prototype.show = function() {
  this.elts[0].parentElement.parentElement.hidden = false;
}
RadioInput.prototype.hide = function() {
  this.elts[0].parentElement.parentElement.hidden = true;
}
RadioInput.prototype.listen = function(inputCallback) {
  this.elts.forEach( elt => { elt.onchange = inputCallback;});
}

var ContraSu = function() {}
ContraSu.prototype = Object.create(AbstractInput.prototype);
ContraSu.prototype.constructor = ContraSu;
ContraSu.prototype.getName  = function() { return 'contra_su'; }
ContraSu.prototype.getValue = function() { return false; }
ContraSu.prototype.show = function() {}
ContraSu.prototype.hide = function() {}
ContraSu.prototype.listen = function() {}

var NOthers = function() {}
NOthers.prototype = Object.create(AbstractInput.prototype);
NOthers.prototype.constructor = NOthers;
NOthers.prototype.getName  = function() { return 'n_others'; }
NOthers.prototype.getValue = function() { return 1; }
NOthers.prototype.show = function() {}
NOthers.prototype.hide = function() {}
NOthers.prototype.listen = function() {}

var SideEffectsMet = function() {}
SideEffectsMet.prototype = Object.create(AbstractInput.prototype);
SideEffectsMet.prototype.constructor = SideEffectsMet;
SideEffectsMet.prototype.getName  = function() { return 'side_effects_met'; }
SideEffectsMet.prototype.getValue = function() { return false; }
SideEffectsMet.prototype.show = function() {}
SideEffectsMet.prototype.hide = function() {}
SideEffectsMet.prototype.listen = function() {}


function getAllElements(inputCallback) {
  window.cd = new CurrentDrugs(inputCallback);
  var elements = [
    new NumberInput(inputCallback, 'ca1c', 1),
    new NumberInput(inputCallback, 'ta1c', 1),
    new NumberInput(inputCallback, 'egfr', 0),
    new Ta1cPlus1(inputCallback),
    new RadioInput(inputCallback, 'risk'),
    new RadioInput(inputCallback, 'goals2'),
    new SideEffectsMet(),
    new NOthers(),
    new ContraSu(),
  ].concat(cd.getFeatures());
  return elements
}
