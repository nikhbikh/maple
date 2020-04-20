console.log('current_drugs.js');

var CurrentDrugs = function() {
  this.elt = document.getElementById('current_drugs');
  this.drugs = [];
  this.add_button = document.querySelector('#current_drugs .add_button');
  this.add_button.onclick = this.add.bind(this);

  var drug_options = ""
  var known_drugs = [['met', 'Metformin'], 
                     ['su', 'Sulfonylurea']];
  for (let i = 0; i < known_drugs.length; i++) {
    drug_options += `<option value="${known_drugs[i][0]}">${known_drugs[i][1]}</option>`
  }
  var drug_container = document.createElement('temp');
  drug_container.innerHTML =`<div class="drug_selection">
  <select>
    <option value="none"></option>
    ${drug_options}
  </select>
  <button class="remove_button">Remove</button>
</div>`
  this.drug_template = drug_container.children[0];


}

CurrentDrugs.prototype.add = function(event) {
  event.preventDefault();
  if (this.drugs.length && unselected(this.drugs[this.drugs.length - 1])) {
    console.log('first fill out last unfilled drug');  
    return;
  }
  var newDrug = this.drug_template.cloneNode();
  this.elt.appendChild(newDrug);
  this.drugs.push(newDrug);
}

function getSelected(el) {
  el.options[el.selectedIndex].value
}

function unselected(el) {
  return (getSelected(el.querySelector('select')) == "none")
}
