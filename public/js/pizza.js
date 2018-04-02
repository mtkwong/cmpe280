$(document).ready(function() {
  google.charts.load("current", {packages:["corechart","sankey"]});

  // hide/show sauce radio buttons
  $("#sauceCheck").change(function() {
    if($(this).is(":checked")) {
      $("#divSauce").show();
    } else {
      $("#divSauce").hide();
    }
  });
});

const modes = {
  CRUST: 1,
  SAUCE: 2,
  TOPPINGS: 3,
  DASHBOARD: 4
};
var mode = modes.CRUST;

function init() {
}

function handleBack() {
  switch(mode) {
    case modes.SAUCE:
      $("#sauce").hide();
      $("#crust").show();
      $("#btnBack").hide();
      mode = modes.CRUST;
      break;
    case modes.TOPPINGS:
      $("#toppings").hide();
      $("#sauce").show();
      $("#btnFnsh").hide();
      $("#btnNext").show();
      mode = modes.SAUCE;
      break;
  }
}

function handleNext() {
  switch(mode) {
    case modes.CRUST:
      if($("input[name=crustRadio]").is(":checked")) {
        $("#crust").hide();
        $("#sauce").show();
        $("#btnBack").show();
        mode = modes.SAUCE;
      }
      break;
    case modes.SAUCE:
      if(!$("#sauceCheck").is(":checked") || $("input[name=sauceRadio]").is(":checked")) {
        $("#sauce").hide();
        $("#toppings").show();
        $("#btnNext").hide();
        $("#btnFnsh").show();
        mode = modes.TOPPINGS;
      }
      break;
  }
}

function handleFnsh() {
  // show dashboard
  $("#toppings").hide();
  $("#dashboard").show();
  $("#btnBack").hide();
  $("#btnFnsh").hide();
  $("#btnHome").show();
  var crust = $("input[name=crustRadio]:checked").parent().text();
  var sauce = null;
  if($("#sauceCheck").is(":checked")) {
    sauce = $("input[name=sauceRadio]:checked").parent().text();
  }
  var cheese = ($("#cheeseCheck").is(":checked")) ? "Cheese" : null;
  var toppings = []
  $("input[name=topCheck]:checked").each(function() {
    toppings.push($(this).parent().text());
  });
  drawCharts(crust, sauce, cheese, toppings);
  mode = modes.DASHBOARD;
}

function handleHome() {
  // show home
  $("#dashboard").hide();
  $("#crust").show();
  $("#btnHome").hide();
  $("#btnNext").show();
  $('input[name=crustRadio]').prop('checked',false);
  $('input[name=topCheck]').prop('checked',false);
  $('input[name=cheeseCheck]').prop('checked',false);
  $('input[name=sauceCheck]').prop('checked',false);
  $('input[name=sauceRadio]').prop('checked',false);
  $("#divSauce").hide();
  mode = modes.CRUST;
}

function drawCharts(crust, sauce, cheese, toppings) {
  // pie chart
  var arr = [['Ingredient', 'Quantity']];
  arr.push([crust, 1]);
  if(cheese != null) {
    arr.push([cheese, 4]);
  }
  if(sauce != null) {
    arr.push([sauce, 5]);
  }
  for(var i=0; i<toppings.length; i++) {
    arr.push([toppings[i], 2]);
  }
  var pieData = google.visualization.arrayToDataTable(arr);

  var pieOptions = {
    title: 'My Custom Pizza',
    is3D: false,
    chartArea: { top: 60 },
    backgroundColor: '#cccccc',
    height: 500,
  };

  var pieChart = new google.visualization.PieChart(document.getElementById('piechart'));
  pieChart.draw(pieData, pieOptions);

  // sankey chart
  var sca = [['From', 'To', 'Weight']];
  var layer1 = [crust];
  if(cheese != null) {
    layer1.push(cheese);
  }
  if(sauce != null) {
    layer1.push(sauce);
  }
  if(toppings.length > 2) {
    var idx = Math.floor(toppings.length / 2);
    var layer2 = toppings.slice(0, idx);
    var layer3 = toppings.slice(idx);
    for(var i=0; i<layer1.length; i++) {
      for(var j=0; j<layer2.length; j++) {
        sca.push([layer1[i], layer2[j], r()]);
      }
    }
    for(var i=0; i<layer2.length; i++) {
      for(var j=0; j<layer3.length; j++) {
        sca.push([layer2[i], layer3[j], r()]);
      }
    }
  } else {
    for(var i=0; i<layer1.length; i++) {
      for(var j=0; j<toppings.length; j++) {
        sca.push([layer1[i], toppings[j], r()]);
      }
    }
  }

  var sankeyData = google.visualization.arrayToDataTable(sca);

  var sankeyOptions = {
    height: 500,
  };

  var sankeyChart = new google.visualization.Sankey(document.getElementById('sankeychart'));
  sankeyChart.draw(sankeyData, sankeyOptions);
}
function r() {var rands=[1,1,1,1,1,1,1,1,2,2,3,4,5];return rands[rand(0,9)];}
function rand(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}