console.log('current_drugs.js');

var DrugInput = function(name, value, onhide) {
  this.name = name;
  this.value = value;

  // Show/hide handled by CurrentDrugs object.
  this.onhide = onhide;
  this.hidden = true;
}
DrugInput.prototype = Object.create(AbstractInput.prototype);
DrugInput.prototype.constructor = DrugInput;
DrugInput.prototype.getName = function() {
  return this.name;
}
DrugInput.prototype.getValue = function() {
  return this.value;
}
DrugInput.prototype.setValue = function(value) {
  this.value = value;
}
DrugInput.prototype.show = function() {
  this.hidden = false;
  this.onhide();
}
DrugInput.prototype.hide = function() {
  this.hidden = true;
  this.onhide();
}
DrugInput.prototype.listen = function(inputCallback) {
  // Do nothing because actually listening is handled by CurrentDrugs objects.
}


var CurrentDrugs = function(inputCallback) {
  this.elt = document.querySelector('#current_drugs .drugs');
  this.drugs = this.elt.children;
  this.known_drugs = new Map([['met', 'Metformin'], 
                             ['su', 'Sulfonylurea']]);
  this.createFeatures();
  this.inputCallback = inputCallback;
  this.add_button = document.querySelector('#current_drugs .add_button');
  this.add_button.onclick = this.add.bind(this);
}

CurrentDrugs.prototype.createFeatures = function() {
  this.drug_features = new Map();
  for (let key of this.known_drugs.keys()) {
    this.drug_features.set(
        key, new DrugInput(key, 0, this.onhide.bind(this)));
  }

  this.drug_features.set(
      'n_drugs',
      new DrugInput('n_drugs', 0, this.onhide.bind(this)));

  this.drug_features.set(
      'last_drug_val',
      new DrugInput('last_drug_val', undefined, this.onhide.bind(this)));

  this.drug_features.set(
      'last_drug_time',
      new DrugInput('last_drug_time', undefined, this.onhide.bind(this)));
}

CurrentDrugs.prototype.getFeatures = function() {
  return Array.from(this.drug_features.values());
}

CurrentDrugs.prototype.add = function(event) {
  event.preventDefault();
  if (this.drugs.length && unselected(this.drugs[this.drugs.length - 1])) {
    console.log('first fill out last unfilled drug');  
    return;
  }
  console.log('adding');

  var drug_options = ""
  var selected_drugs = this.getSelectedDrugs();
  var unselected_drugs = new Map(this.known_drugs);
  selected_drugs.forEach( v => { unselected_drugs.delete(v); });
  if (unselected_drugs.size == 0) {
    console.log('taking all the drugs');
    return;
  }

  for (let [key, value] of unselected_drugs) {
    drug_options += `<option value="${key}">${value}</option>`
  }
  var drug_container = document.createElement('temp');
  drug_container.innerHTML =`<div class="drug_selection">
  <select>
    <option value="none"></option>
    ${drug_options}
  </select>
  <label>Start date:
  <input type="date" max="${TODAY}">
  </label>
  <button class="remove_button">Remove</button>
</div>`
  var newDrug = drug_container.children[0];
  newDrug.querySelector('.remove_button').onclick = this.remove.bind(this);
  newDrug.querySelector('select').onchange = this.onchange.bind(this);
  newDrug.querySelector('input').onchange = this.onchange.bind(this);
  this.elt.appendChild(newDrug);
}

CurrentDrugs.prototype.remove = function(event) {
  event.preventDefault();  
  var el = event.target;
  el.parentElement.parentElement.removeChild(event.target.parentElement);
  this.onchange();
}


CurrentDrugs.prototype.getSelectedDrugs = function() {
  var current_drugs = new Map();
  for (el of this.drugs) {
    let [drug, days_ago] = getSelected(el);
    if (drug != "none" && defined(days_ago)) {
      current_drugs.set(drug, days_ago);
    }
  }
  return current_drugs;
}

CurrentDrugs.prototype.onchange = function() {
  var current_drugs = this.getSelectedDrugs();
  var unselected_drugs = new Set(this.known_drugs.keys());

  var min_drug = [null, Number.MAX_SAFE_INTEGER];
  for (let [drug, days_ago] of current_drugs) {
    unselected_drugs.delete(drug);
    this.drug_features.get(drug).setValue(days_ago);

    if (days_ago < min_drug[1]) {
      min_drug = [drug, days_ago];
    }
  }
  if (min_drug[0]) {
    this.drug_features.get('last_drug_time').setValue(min_drug[1]);
    this.drug_features.get('last_drug_val').setValue(min_drug[0]);
  }
  this.drug_features.get('n_drugs').setValue(current_drugs.size);
  for (let d of unselected_drugs) {
    this.drug_features.get(d).setValue(0);
  }
  this.inputCallback();
}

CurrentDrugs.prototype.onhide = function() {
  var drug_features = this.getFeatures();
  if (drug_features.every(d => d.hidden)) {
    this.elt.parentElement.hidden = true;
  } else {
    this.elt.parentElement.hidden = false;
  }
}

function getSelected(drug_selection_el) {
  var select_el = drug_selection_el.querySelector('select') 
  var date_el = drug_selection_el.querySelector('input') 
  return [select_el.options[select_el.selectedIndex].value,
          getDaysAgo(date_el)];
}

function getDaysAgo(el) { 
  var date = el.parentElement.querySelector('input').valueAsDate;
  if (defined(date)) {
    return Math.round((NOW - date) / 1000 / 60 / 60 / 24);
  }
  return null;
}

function unselected(el) {
  let drug, days_ago = getSelected(el);
  return (drug == "none");
}


