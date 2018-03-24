var id=0; // Current ID, for inserting into database
var pngUrl;

$(document).ready(function() {
  // Prepare camera capture
  const player = document.getElementById('player');
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  const captureButton = document.getElementById('capture');

  const constraints = {
    video: true,
  };

  captureButton.addEventListener('click', () => {
    // Draw the video frame to the hidden canvas
    context.drawImage(player, 0, 0, canvas.width, canvas.height);
    pngUrl = canvas.toDataURL();
  });

  // Attach the video stream to the video element and autoplay
  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      player.srcObject = stream;
    });
});

// Show the appropriate content depending on which menubar item is clicked
function showDiv(name) {
  if(name === "Demographics") {
    document.getElementById("dmTab").className = "currentTab";
    document.getElementById("hvTab").className = "";
    document.getElementById("rpTab").className = "";
    document.getElementById("dmDiv").style.display = "block";
    document.getElementById("hvDiv").style.display = "none";
    document.getElementById("rpDiv").style.display = "none";
  }
  else if(name === "Health Vitals") {
    document.getElementById("dmTab").className = "";
    document.getElementById("hvTab").className = "currentTab";
    document.getElementById("rpTab").className = "";
    document.getElementById("dmDiv").style.display = "none";
    document.getElementById("hvDiv").style.display = "block";
    document.getElementById("rpDiv").style.display = "none";
  }
  else if(name === "Reports") {
    document.getElementById("dmTab").className = "";
    document.getElementById("hvTab").className = "";
    document.getElementById("rpTab").className = "currentTab";
    document.getElementById("dmDiv").style.display = "none";
    document.getElementById("hvDiv").style.display = "none";
    document.getElementById("rpDiv").style.display = "block";
    buildTable();
  }
}

function saveDm() {
  // Update ID here
  id++;

  $.ajax({
    url: "/savePersonalInfo",
    type: "POST",
    data: JSON.stringify({
      id: id,
      fn: document.getElementById("fnm").value,
      ln: document.getElementById("lnm").value,
      gn: document.getElementById("gnd").value,
      ag: document.getElementById("age").value,
      dt: document.getElementById("det").value,
      ph: pngUrl
    }),
    contentType: "application/json",
  });

  document.getElementById("dmForm").reset();
}

function saveHv() {
  $.ajax({
    url: "/saveHealthInfo",
    type: "POST",
    data: JSON.stringify({
      id: id,
      ht: document.getElementById("hgt").value,
      wt: document.getElementById("wgt").value,
      bt: document.getElementById("bdt").value,
      pr: document.getElementById("pls").value,
      bp: document.getElementById("bps").value,
      md: document.getElementById("med").value,
      nt: document.getElementById("nts").value
    }),
    contentType: "application/json",
  });

  document.getElementById("hvForm").reset();
  document.getElementById("med").value = "";
  document.getElementById("nts").value = "";
}

function buildTable() {
  $.ajax({
    url: "/retrieveInfo",
    type: "GET",
    success: function(res) {
      var results = JSON.parse(res);
      var len = results.length,i,item,tr,tdName,tdAge,tdGender,tdPhoto,img,tdMeds,tdNotes;
      var tbody = document.getElementById("tbody");
      tbody.innerHTML = "";

      for (i = 0; i < len; i++){
        item = results[i];
        tr = document.createElement("tr");
        if (i%2 == 0) {
          tr.className = "even";
        } else {
          tr.className = "odd";
        }
        tdName = document.createElement("td");
        tdName.innerHTML = item.firstname + " " + item.lastname;
        tr.appendChild(tdName);
        tdAge = document.createElement("td");
        tdAge.innerHTML = item.age;
        tr.appendChild(tdAge);
        tdGender = document.createElement("td");
        tdGender.innerHTML = item.gender;
        tr.appendChild(tdGender);

        tdPhoto = document.createElement("td");
        img = document.createElement("img");
        img.src = item.photo;
        tdPhoto.appendChild(img);
        tr.appendChild(tdPhoto);

        tdMeds = document.createElement("td");
        tdMeds.innerHTML = item.medications;
        tr.appendChild(tdMeds);
        tdNotes = document.createElement("td");
        tdNotes.innerHTML = item.notes;
        tr.appendChild(tdNotes);

        tbody.appendChild(tr);
      }
    }
  });
}