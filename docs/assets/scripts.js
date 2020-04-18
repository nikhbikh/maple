
console.log("hi there");

function main() {
  document.getElementById("current_a1c").onblur = validateNumberToFixed(1);
  document.getElementById("target_a1c").onblur = validateNumberToFixed(1);
  document.getElementById("t1_form").onsubmit = t1Button;

  /*
  document.getElementById("current_a1c").oninput = t1Button;
  document.getElementById("target_a1c").oninput = t1Button;
  document.getElementById("t1_form").oninput = t1Button;
  document.getElementById("eGFR").oninput = t1Button;
  document.getElementById("yes_risk").oninput = t1Button;
  document.getElementById("no_risk").oninput = t1Button;
  */
}

function validateNumberToFixed(i) {
  return (event) => {
    event.target.valueAsNumber = event.target.valueAsNumber.toFixed(1);
  };
}

function getRadio(name) {
  var elts = document.getElementsByName(name);
  for (var i = 0; i < elts.length; i++) { 
    if (elts[i].checked) {
      return elts[i].id;
    }
  }
}

function getFeatures() {
  var ca1c = document.getElementById("current_a1c").valueAsNumber;
  var ta1c = document.getElementById("target_a1c").valueAsNumber;
  var egfr = document.getElementById("eGFR").valueAsNumber;
  var risk = getRadio("risk");
  var met = getRadio("met");
  var goals2 = getRadio("goals2");
  var others = getRadio("others");
  return [ca1c, ta1c, egfr, risk, met, goals2, others];
}


function tryMetformin(drugs, egfr, recs) {
  if (egfr >= 
}

function t1Button(event) {
  event.preventDefault();
  var [ca1c, ta1c, egfr, risk, met, goals2, others] = getFeatures();

  var recs = [];
  if (ca1c > 6.5) {
    if (egfr >= 30) {
      if (met == "no_met") {
        recs.push("start metformin");
      }
    } else if (others == "no_others") {
      recs.push("start sulfonylurea");
    }
  }

  var addSecondary = false;
  if (ca1c > ta1c) {
    if (met == "contra_met") {
      if (others == "no_others") {
        recs.push("add sulfonylurea");
      } else {
        recs.push("I don't know how to add a tertiary drug.");
      }
    } else if (met == "lt3_met") {
      recs.push("stay on metformin for at least 3 months before considering "
              + "adding a secondary");
    } else if (met == "gt3_met") {
      if (others == "no_others") {
        addSecondary = true;
      } else {
        recs.push("I don't know how to add a tertiary drug yet.");
      }
    }
  }

  if (addSecondary) {
    if (risk == "ascvd_risk") {
      recs.push("add GLP-1 RA with CVD benefits");
    } else if (risk == "ckd_hf_risk") {
      if (egfr >= 45) {
        recs.push("add SGLT2i with relevant benefits");
      } else {
        recs.push("add GLP-1 RA with CVD benefits");
      }
    } else if (goals2 == "hypo_goals2" || goals2 == "weight_goals2" 
               || goals2 == "no_goals2") {
      recs.push("add GLP-1 RA"); 
    } else if (goals2 == "cost_goals2") {
      if (ca1c > ta1c + 1) {
        recs.push("add insulin");
      } else {
        recs.push("add sulfonylurea");
      }
    }
  }

  if (recs.length == 0) {
    recs.push("recommending doing nothing");
  }
  var recommendation = document.getElementById("recommendation");
  recommendation.innerHTML = recs.join("<br/>");


  return false;
}

main();
