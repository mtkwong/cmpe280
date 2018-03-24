function init() {
  /*
    var center = {lat: 37.382093, lng: -122.001715};
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: center
    });*/
    var map = initMap();

    $.ajax({
      url: "/getMapData",
      type: "GET",
      success: function(res) {
        var json = JSON.parse(res);
        var locArr = json.locations.location;
        var locTypes = {
          "Distribution Facility": {
            marker: "http://www.googlemapsmarkers.com/v1/fc382a/",
            color: '#fc382a'
          },
          "HeadQuarters": {
            marker: "http://www.googlemapsmarkers.com/v1/ffffff/",
            color: '#ffffff'
          },
          "Call Center": {
            marker: "http://www.googlemapsmarkers.com/v1/8ce0ff/",
            color: '#8ce0ff'
          },
          "RetailLocation": {
            marker: "http://www.googlemapsmarkers.com/v1/32d137/",
            color: '#32d137'
          }
        }
        var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var labelIndex = 0;
        var legend = document.getElementById('legend');

        for(var i=0; i<locArr.length; i++) {
          var loc = locArr[i];
          var pos = new google.maps.LatLng(loc.latitude, loc.longitude);
          var curIcon = locTypes[loc.type].marker;
          var curLabel = labels[labelIndex++ % labels.length];

          var marker = new google.maps.Marker({
            position: pos,
            icon: curIcon,
            label: curLabel,
            map: map
          });

          var circle = new google.maps.Circle({
            strokeColor: locTypes[loc.type].color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: locTypes[loc.type].color,
            fillOpacity: 0.30,
            map: map,
            center: pos,
            radius: Math.sqrt(loc.$revenue)
          });

          var legend = document.getElementById('legend');
          var div = document.createElement('div');
          div.innerHTML = '<img src="' + curIcon + '" height=20 width=14> ' + curLabel + ': ' + loc.address;
          legend.appendChild(div);
        }

        map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legend);
      }
    });
  }

function initMap() {
  var center = {lat: 37.382093, lng: -122.001715};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: center
  });

  return map;
}