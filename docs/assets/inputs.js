
var Inputs = function(params) {
  this.elements = {};
  for (let i = 0; i < params.hidden.length; i++) {
    if ((elt = document.getElementById(params.hidden[i]))) {
      this.elements[params.hidden[i]] = elt;

    } else {
      throw new Error(`no param ${params.hidden[i]}`);
    }
  }
  for (let i = 0; i < params.visible.length; i++) {
    if ((elt = document.getElementById(params.visible[i]))) {
      this.elements[params.visible[i]] = elt;
    } else {
      throw new Error(`no param ${params.visible[i]}`);
    }
  }

  this.hidden = params.hidden;
  this.visible = params.visible;
  this.draw();
}

Inputs.prototype.draw = function() {
  for (let i = 0; i < params.hidden.length; i++) {
    this.elements[params.hidden[i]].hidden = true;
  }
  for (let i = 0; i < params.visible.length; i++) {
    this.elements[params.visible[i]].hidden = false ;
  }
}

Input.prototype.showFeature = function(feature) {
  if (this.visible.includes(feature)) {
    throw new Error(`Feature "${feature}" is already visible`);
  }
  if (!this.elements['feature']) {
    throw new Error(`Feature "${feature}" not available`);
  }

}
