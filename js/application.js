var app = {
  apikey: "d2d424a2bf6456078b621e67ffccb3647a159423",
  map: L.map('map', { center: [39.957042, -75.175922], zoom: 13 }),
  geojsonClient: new cartodb.SQL({ user: 'chloequ', format: 'geojson' }),
  jsonClient: new cartodb.SQL({ user: 'chloequ', format: 'json' }),
  drawnItems: new L.FeatureGroup()
};

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(app.map);

var fillForm = function(properties) {
  $('#total_num_rides').val("Total Number of Rides: " + properties.total_num_rides);
  $('#address').val("Address: " + properties.addressstreet);
  $('#zipcode').val("Zipcode: "+properties.addresszipcode);
  $('#dockNumber').val("Docking Capacity: " + properties.totaldocks);
  $('#tll_per').val("Share of All Indego Rides: " + (Math.round(properties.ttl_per*100)).toFixed(1) + "%");
  $('#station_id').val("Station ID: " + properties.station_id);
  $('#departure').val("Departure: " + properties.start_num_rides + " rides, " + (Math.round(properties.st_per_in*100)).toFixed(1) + "% of total");
  $('#arrival').val("Arrival: " + properties.end_num_rides + " rides, " + (Math.round(properties.ed_per_in*100)).toFixed(1) + "% of total");
  $('#daratio_value').val("Departures/Arrivals: " + Math.round(properties.start_num_rides/properties.end_num_rides*100).toFixed(1) + "%");
  $('#round_trip').val("Round Trip Share: " + Math.round(properties.per_round*100).toFixed(1)+"%");
};

  var execution;
  var lowFilterNumber;
  var hiFilterNumber;
  var defaultLayer;
  var setLayer;
  var filterLayers=[];
  var filterLayer;
  var min;
  var max;
  var avg;
  var avgRound;
  var minFeature;
  var maxFeature;
  var theSelected;
  var minMarker=[];
  var maxMarker=[];
  var minMarkers=[];
  var maxMarkers=[];
  var minText0;
  var maxText0;

// variables for mapping routes
  var mystart;
  var myend;
  var mylocation;
  var myObject;
  var myJSON;
  var myURL;
  var routeResponse;
  var myCoordinates;
  var myStartRoute;
  var myEndRoute;
  var startMarker;
  var endMarker;
  var count_start;
  var count_end;

//variables for maps
  var map1Layer;
  var map1Layers=[];
  var map2Layer;
  var map2Layers=[];

var general=function(){
  app.jsonClient.execute("SELECT COUNT(*) FROM indego_combined")
    .done(function(data) {
      $('#stationTotal').val("Number of Indego Stations:");
      $('#stationTotal1').val(data.rows[0].count);
    });
  app.jsonClient.execute("SELECT SUM(totaldocks) FROM indego_combined")
    .done(function(data) {
      $('#bikeTotal').val("Number of Indego Bikes:");
      $('#bikeTotal1').val(data.rows[0].sum);
    });
  app.jsonClient.execute("SELECT COUNT(*) FROM indego_all_clean")
    .done(function(data) {
      $('#total').val("Total Number of Indego Rides in 2016:");
      $('#total1').val(data.rows[0].count);
    });
  app.jsonClient.execute("SELECT((SELECT COUNT(*)FROM indego_all_clean WHERE trip_route_category='Round Trip')/(SELECT COUNT(*)FROM indego_all_clean)::numeric) AS roundPer")
    .done(function(data) {
      $('#roundPer').val("Overall Round Trips Share:");
      $('#roundPer1').val((Math.round(data.rows[0].roundper*100)).toFixed(1) + "%");
    });
  app.jsonClient.execute("SELECT ROUND(AVG(total_num_rides),0) FROM indego_combined")
    .done(function(data) {
      $('#mean').val("Average Annual Rides Per Station:");
      $('#mean1').val(data.rows[0].round);
      avg=data.rows[0].round;
    });
  app.jsonClient.execute("SELECT station_id,total_num_rides FROM indego_combined GROUP BY station_id,total_num_rides HAVING total_num_rides=(SELECT min(total_num_rides) FROM indego_combined)")
    .done(function(data) {
      $('#min').text("Least Popular: Station " + data.rows[0].station_id + ", " + data.rows[0].total_num_rides + " rides");
      min=data.rows[0].total_num_rides;
      minText0=data.rows[0].total_num_rides;
      $('#minText').val(minText0);
    });
  app.jsonClient.execute("SELECT station_id,total_num_rides FROM indego_combined GROUP BY station_id,total_num_rides HAVING total_num_rides=(Select MAX(total_num_rides) from indego_combined)")
    .done(function(data) {
      $('#max').text("Most Popular: Station " + data.rows[0].station_id + ", " + data.rows[0].total_num_rides + " rides");
      max=data.rows[0].total_num_rides;
      maxText0=data.rows[0].total_num_rides;
      $('#maxText').val(maxText0);
    });
  app.jsonClient.execute("SELECT AVG(per_round) FROM indego_combined")
    .done(function(data) {
      avgRound=data.rows[0].avg;
    });
};
general();

var stationClick=function(properties){
  $('#map > div.leaflet-control-container > div.leaflet-top.leaflet-left').css("left","390px");
  $('#refresh').css("left","400px");
  //map out the possible most popular routes
  //as startstation
  app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE start_station_id="+properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
  .done(function(data){
    count_start=data.rows[0].count;
    if(data.rows[0].start_lat!==data.rows[0].end_lat){
      mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
      myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
      mylocation=[mystart,myend];
      myObject = {
        "locations": mylocation,
        "costing":"bicycle",
        "directions_options":{"units":"miles"}
      };
      myJSON = JSON.stringify(myObject);
      myURL =
      "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
      routeResponse = $.ajax(myURL);
      routeResponse.done(function(data){
        myCoordinates = decode(data.trip.legs[0].shape);
        if (myStartRoute!==undefined){
          app.map.removeLayer(myStartRoute);
        }
        myStartRoute=L.polyline(myCoordinates, {color:'#e5d090',weight:5});
        myStartRoute.addTo(app.map);
      });
      if (endMarker!==undefined){
        app.map.removeLayer(endMarker);
      }
      endMarker=L.circleMarker([data.rows[0].end_lat,data.rows[0].end_lon],endStyle).bindTooltip("Hottest Destination: Station "+data.rows[0].end_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
      endMarker.addTo(app.map);
    }
    else{
      if (myStartRoute!==undefined){
        app.map.removeLayer(myStartRoute);
      }
      if (endMarker!==undefined){
        app.map.removeLayer(endMarker);
      }
    }
    $('#destination_id').val("Hottest Destination: Station " + data.rows[0].end_station_id);
  });
  //as endstation
  app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE end_station_id="+properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
  .done(function(data){
    count_end=data.rows[0].count;
    if(data.rows[0].start_lat!==data.rows[0].end_lat){
      mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
      myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
      mylocation=[mystart,myend];
      myObject = {
        "locations": mylocation,
        "costing":"bicycle",
        "directions_options":{"units":"miles"}
      };
      myJSON = JSON.stringify(myObject);
      myURL =
      "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
      routeResponse = $.ajax(myURL);
      routeResponse.done(function(data){
        myCoordinates = decode(data.trip.legs[0].shape);
        if (myEndRoute!==undefined){
          app.map.removeLayer(myEndRoute);
        }
        myEndRoute=L.polyline(myCoordinates, {color: 'midnightblue',weight:2});
        myEndRoute.addTo(app.map);
      });
      if (startMarker!==undefined){
        app.map.removeLayer(startMarker);
      }
      startMarker=L.circleMarker([data.rows[0].start_lat,data.rows[0].start_lon],startStyle).bindTooltip("Hottest Origin: Station "+data.rows[0].start_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
      startMarker.addTo(app.map);
    }
    else{
      if (myEndRoute!==undefined){
        app.map.removeLayer(myEndRoute);
      }
      if (startMarker!==undefined){
        app.map.removeLayer(startMarker);
      }
    }
    $('#origin_id').val("Hottest Origin: Station " + data.rows[0].start_station_id);
  });
  //ends here
  fillForm(properties);
  $('#leftbar').fadeIn();
  $('#maps').hide();
  $('#stationInfo').fadeIn();
  $('#indivStats').fadeIn();
  $('#macroStats').hide();
  state0=0;
  state1=0;
};

// set up color range
var featureColor1;
var range1;
var minText1;
var maxText1;
app.jsonClient.execute("SELECT MIN(daratio),MAX(daratio) FROM indego_combined")
.done(function(data) {
  minText1=Math.round(data.rows[0].min*100).toFixed(1);
  maxText1=Math.round(data.rows[0].max*100).toFixed(1);
  range1=[data.rows[0].min,data.rows[0].max];
  featureColor1=chroma.scale(["dodgerblue","gold","#ff6d93"]).domain(range1);
});
var featureColor2;
var range2;
var minText2;
var maxText2;
app.jsonClient.execute("SELECT MIN(per_round),MAX(per_round) FROM indego_combined")
.done(function(data) {
  minText2=Math.round(data.rows[0].min*100).toFixed(1);
  maxText2=Math.round(data.rows[0].max*100).toFixed(1);
  range2=[data.rows[0].min,data.rows[0].max];
  featureColor2=chroma.scale(["rgb(36, 80, 191)","rgb(40, 201, 136)","greenyellow"]).domain(range2);
});

// define layer setup for clickable layer
setLayer={
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng,numStyle2(feature));
  },
  onEachFeature: function(feature, layer) {
    if (feature.properties.total_num_rides===min) {
      minFeature=feature;
    }
    if (feature.properties.total_num_rides===max) {
      maxFeature=feature;
    }
    layer.on('mouseover', function(l) {
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle({
          radius: 15,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0,
          fillColor: '#9ba1aa',
          fillOpacity: 0.8,
        });
        layer.bindTooltip("Station ID: "+layer.feature.properties.station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
      }
    });
    layer.on('mouseout', function(l){
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle(numStyle2(feature));
      }
    });
    layer.on('click', function(l) {
      $('#map > div.leaflet-control-container > div.leaflet-top.leaflet-left').css("left","390px");
      $('#refresh').css("left","400px");
      //map out the possible most popular routes
      //as startstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE start_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_start=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myStartRoute!==undefined){
              app.map.removeLayer(myStartRoute);
            }
            myStartRoute=L.polyline(myCoordinates, {color: 'midnightblue',weight:2});
            myStartRoute.addTo(app.map);
          });
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
          endMarker=L.circleMarker([data.rows[0].end_lat,data.rows[0].end_lon],endStyle).bindTooltip("Hottest Destination: Station "+data.rows[0].end_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          endMarker.addTo(app.map);
        }
        else{
          if (myStartRoute!==undefined){
            app.map.removeLayer(myStartRoute);
          }
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
        }
        $('#destination_id').val("Hottest Destination: Station " + data.rows[0].end_station_id);
      });
      //as endstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE end_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_end=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myEndRoute!==undefined){
              app.map.removeLayer(myEndRoute);
            }
            myEndRoute=L.polyline(myCoordinates, {color:'#e5d090',weight:5});
            myEndRoute.addTo(app.map);
          });
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
          startMarker=L.circleMarker([data.rows[0].start_lat,data.rows[0].start_lon],startStyle).bindTooltip("Hottest Origin: Station "+data.rows[0].start_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          startMarker.addTo(app.map);
        }
        else{
          // roundtripEnder=1;
          if (myEndRoute!==undefined){
            app.map.removeLayer(myEndRoute);
          }
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
        }
        $('#origin_id').val("Hottest Origin: Station " + data.rows[0].start_station_id);
      });
      //ends here
      fillForm(feature.properties);
      $('#leftbar').fadeIn();
      $('#maps').hide();
      $('#stationInfo').fadeIn();
      $('#indivStats').fadeIn();
      $('#macroStats').hide();
      $('.legend').css("left","400px");
      $('.originalBar').fadeOut();
      $('#indivIntro').fadeOut();
      $('.bottomBar').fadeIn();
      state0=0;
      state1=0;
      layer.setStyle(selectedStyle);
      if (theSelected) {
        if (l.target._leaflet_id===theSelected._leaflet_id) { layer.setStyle(numStyle2(feature));}
        else {theSelected.setStyle(numStyle2(theSelected.feature));}
      }
      theSelected = l.target;
    });
  }
};
setMap1={
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng,mapStyle1(feature));
  },
  onEachFeature: function(feature, layer) {
    if (feature.properties.total_num_rides===min) {
      minFeature=feature;
    }
    if (feature.properties.total_num_rides===max) {
      maxFeature=feature;
    }
    layer.on('mouseover', function(l) {
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle({
          radius: 15,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0,
          fillColor: '#9ba1aa',
          fillOpacity: 0.8,
        });
        layer.bindTooltip("Station ID: "+layer.feature.properties.station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
      }
    });
    layer.on('mouseout', function(l){
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle(mapStyle1(feature));
      }
    });
    layer.on('click', function(l) {
      $('#map > div.leaflet-control-container > div.leaflet-top.leaflet-left').css("left","390px");
      $('#refresh').css("left","400px");
      //map out the possible most popular routes
      //as startstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE start_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_start=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myStartRoute!==undefined){
              app.map.removeLayer(myStartRoute);
            }
            myStartRoute=L.polyline(myCoordinates, {color:'midnightblue',weight:2});
            myStartRoute.addTo(app.map);
          });
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
          endMarker=L.circleMarker([data.rows[0].end_lat,data.rows[0].end_lon],endStyle).bindTooltip("Hottest Destination: Station "+data.rows[0].end_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          endMarker.addTo(app.map);
        }
        else{
          if (myStartRoute!==undefined){
            app.map.removeLayer(myStartRoute);
          }
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
        }
        $('#destination_id').val("Hottest Destination: Station " + data.rows[0].end_station_id);
      });
      //as endstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE end_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_end=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myEndRoute!==undefined){
              app.map.removeLayer(myEndRoute);
            }
            myEndRoute=L.polyline(myCoordinates, {color:'#e5d090',weight:5});
            myEndRoute.addTo(app.map);
          });
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
          startMarker=L.circleMarker([data.rows[0].start_lat,data.rows[0].start_lon],startStyle).bindTooltip("Hottest Origin: Station "+data.rows[0].start_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          startMarker.addTo(app.map);
        }
        else{
          if (myEndRoute!==undefined){
            app.map.removeLayer(myEndRoute);
          }
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
        }
        $('#origin_id').val("Hottest Origin: Station " + data.rows[0].start_station_id);
      });
      //ends here
      fillForm(feature.properties);
      $('#leftbar').fadeIn();
      $('#maps').hide();
      $('#stationInfo').fadeIn();
      $('#indivStats').fadeIn();
      $('#macroStats').hide();
      $('.legend').css("left","400px");
      $('.originalBar').fadeOut();
      $('#indivIntro').fadeOut();
      $('.bottomBar').fadeIn();
      state0=0;
      state1=0;
      layer.setStyle(selectedStyle);
      if (theSelected) {
        if (l.target._leaflet_id===theSelected._leaflet_id) { layer.setStyle(mapStyle1(feature));}
        else {theSelected.setStyle(mapStyle1(theSelected.feature));}
      }
      theSelected = l.target;
    });
  }
};
setMap2={
  pointToLayer: function(feature, latlng) {
    return L.circleMarker(latlng,mapStyle2(feature));
  },
  onEachFeature: function(feature, layer) {
    if (feature.properties.total_num_rides===min) {
      minFeature=feature;
    }
    if (feature.properties.total_num_rides===max) {
      maxFeature=feature;
    }
    layer.on('mouseover', function(l) {
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle({
          radius: 15,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0,
          fillColor: '#9ba1aa',
          fillOpacity: 0.8,
        });
        layer.bindTooltip("Station ID: "+layer.feature.properties.station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
      }
    });
    layer.on('mouseout', function(l){
      if (theSelected===undefined || theSelected._leaflet_id!==l.target._leaflet_id) {
        layer.setStyle(mapStyle2(feature));
      }
    });
    layer.on('click', function(l) {
      $('#map > div.leaflet-control-container > div.leaflet-top.leaflet-left').css("left","390px");
      $('#refresh').css("left","400px");
      //map out the possible most popular routes
      //as startstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE start_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_start=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myStartRoute!==undefined){
              app.map.removeLayer(myStartRoute);
            }
            myStartRoute=L.polyline(myCoordinates, {color: 'midnightblue',weight:2});
            myStartRoute.addTo(app.map);
          });
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
          endMarker=L.circleMarker([data.rows[0].end_lat,data.rows[0].end_lon],endStyle).bindTooltip("Hottest Destination: Station "+data.rows[0].end_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          endMarker.addTo(app.map);
        }
        else{
          if (myStartRoute!==undefined){
            app.map.removeLayer(myStartRoute);
          }
          if (endMarker!==undefined){
            app.map.removeLayer(endMarker);
          }
        }
        $('#destination_id').val("Hottest Destination: Station " + data.rows[0].end_station_id);
      });
      //as endstation
      app.jsonClient.execute("SELECT start_lat,start_lon,end_lat,end_lon,start_station_id,end_station_id,count(*) AS count FROM indego_all_clean WHERE end_station_id="+feature.properties.station_id+"GROUP BY 1,2,3,4,5,6 ORDER BY count DESC LIMIT 1")
      .done(function(data){
        count_end=data.rows[0].count;
        if(data.rows[0].start_lat!==data.rows[0].end_lat){
          mystart={"lat":data.rows[0].start_lat, "lon":data.rows[0].start_lon};
          myend={"lat":data.rows[0].end_lat,"lon":data.rows[0].end_lon};
          mylocation=[mystart,myend];
          myObject = {
            "locations": mylocation,
            "costing":"bicycle",
            "directions_options":{"units":"miles"}
          };
          myJSON = JSON.stringify(myObject);
          myURL =
          "https://matrix.mapzen.com/optimized_route?json=" + myJSON + "&api_key=mapzen-bE4GcSs";
          routeResponse = $.ajax(myURL);
          routeResponse.done(function(data){
            myCoordinates = decode(data.trip.legs[0].shape);
            if (myEndRoute!==undefined){
              app.map.removeLayer(myEndRoute);
            }
            myEndRoute=L.polyline(myCoordinates, {color:'#e5d090',weight:5});
            myEndRoute.addTo(app.map);
          });
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
          startMarker=L.circleMarker([data.rows[0].start_lat,data.rows[0].start_lon],startStyle).bindTooltip("Hottest Origin: Station "+data.rows[0].start_station_id,{opacity: 0.7, offset:[-10,0], direction:'left'}).openTooltip();
          startMarker.addTo(app.map);
        }
        else{
          if (myEndRoute!==undefined){
            app.map.removeLayer(myEndRoute);
          }
          if (startMarker!==undefined){
            app.map.removeLayer(startMarker);
          }
        }
        $('#origin_id').val("Hottest Origin: Station " + data.rows[0].start_station_id);
      });
      //ends here
      fillForm(feature.properties);
      $('#leftbar').fadeIn();
      $('#maps').hide();
      $('#stationInfo').fadeIn();
      $('#indivStats').fadeIn();
      $('#macroStats').hide();
      $('.legend').css("left","400px");
      $('.originalBar').fadeOut();
      $('#indivIntro').fadeOut();
      $('.bottomBar').fadeIn();
      state0=0;
      state1=0;
      layer.setStyle(selectedStyle);
      if (theSelected) {
        if (l.target._leaflet_id===theSelected._leaflet_id) { layer.setStyle(mapStyle2(feature));}
        else {theSelected.setStyle(mapStyle2(theSelected.feature));}
      }
      theSelected = l.target;
    });
  }
};

// define layer function
  var setDefault = function(){
    app.map.setView([39.957042, -75.175922], 13);
    app.geojsonClient.execute("SELECT * FROM indego_combined").done(function(data) {
        defaultLayer=L.geoJson(data, setLayer);
        defaultLayer.addTo(app.map);
    });
    $('.legend').fadeIn();
    $('#sizing').fadeIn();
    $('#gradient2').fadeOut();
    $('#gradient1').fadeOut();
    $('#minText').fadeIn();
    $('#maxText').fadeIn();
    $('#minText').val(minText0);
    $('#maxText').val(maxText0);
  };

  var setFilter = function(){
    if(filterSelect===2){
      switch(option){
        case 1:
          execution="SELECT * FROM indego_combined WHERE total_num_rides<5000";
          break;
        case 2:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=5000 AND total_num_rides<10000";
          break;
        case 3:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=10000 AND total_num_rides<15000";
          break;
        case 4:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=15000 AND total_num_rides<20000";
          break;
        case 5:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=20000 AND total_num_rides<25000";
          break;
        case 6:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=25000 AND total_num_rides<30000";
          break;
        case 7:
          execution="SELECT * FROM indego_combined WHERE total_num_rides>=30000";
          break;
        default:
          execution="SELECT * FROM indego_combined";
          break;
      }
    }
    if(filterSelect===3){
      execution="SELECT * FROM indego_combined WHERE total_num_rides>"+lowFilterNumber+"AND total_num_rides<"+hiFilterNumber;
    }
    if(filterSelect===1){
      execution=roughExecution;
    }
    if(filterSelect===4){
      execution=roughExecution2;
    }
    if(filterSelect===5){
      switch(option){
        case 8:
          execution="SELECT * FROM indego_combined WHERE per_round<0.05";
          break;
        case 9:
          execution="SELECT * FROM indego_combined WHERE per_round>=0.05 AND per_round<0.15";
          break;
        case 10:
          execution="SELECT * FROM indego_combined WHERE per_round>=0.15 AND per_round<0.25";
          break;
      }
    }
    if(execution===undefined){
      alert("Please specify your filter range!");
      setDefault();
    }
    if(filterSelect===1||filterSelect===2||filterSelect===3){
      app.geojsonClient.execute(execution)
        .done(function(data) {
          filterLayer=L.geoJson(data, setLayer);
          filterLayers.push(filterLayer);
          filterLayer.addTo(app.map);
          $('#sizing').fadeIn();
          $('#minText').val(minText0);
          $('#maxText').val(maxText0);
          $('#gradient2').fadeOut();
        }).error(function(){
          alert("Please specify your filter range!");
          setDefault();
        });
    }
    if(filterSelect===4||filterSelect===5){
      app.geojsonClient.execute(execution) // 'LIMIT' should be added to the end of this line
        .done(function(data) {
          filterLayer=L.geoJson(data, setMap2);
          filterLayers.push(filterLayer);
          filterLayer.addTo(app.map);
        }).error(function(){
          alert("Please specify your filter range!");
          setDefault();
        });
      $('#minText').val(minText2+"%");
      $('#maxText').val(maxText2+"%");
      $('#gradient2').fadeIn();
      $('#sizing').fadeOut();
    }

      // .error(
      //   function() {
      //     // if(filterSelect===0 || filterState===0 || execution===undefined || roughExecution===undefined || roughExecution2===undefined){
      //     //   alert("Did you forget to specify the filter?");
      //     // }
      //     // if(filterState===1){
      //     //   if(typeof(lowFilterNumber)!==Number || typeof(hiFilterNumber)!==Number){
      //     //     alert("Please select a filter range or input integers to create a customized filter range!");
      //     //   }
      //     // }
      //     // else{
      //     //   alert("Oops!Something wrong happened");
      //     // }
      //     setDefault();
      //     alert("Please specify your filter range!");
      //   });
  };

  var setfirstMap = function(){
    app.map.setView([39.957042, -75.175922], 13);
    app.geojsonClient.execute("SELECT * FROM indego_combined").done(function(data) {
        map1Layer=L.geoJson(data, setMap1);
        map1Layers.push(map1Layer);
        map1Layer.addTo(app.map);
    });
    $('#minText').val(minText1+"%");
    $('#maxText').val(maxText1+"%");
  };

  var setsecondMap = function(){
    app.map.setView([39.957042, -75.175922], 13);
    app.geojsonClient.execute("SELECT * FROM indego_combined").done(function(data) {
        map2Layer=L.geoJson(data, setMap2);
        map2Layers.push(map2Layer);
        map2Layer.addTo(app.map);
    });
    $('#minText').val(minText2+"%");
    $('#maxText').val(maxText2+"%");
  };

  var option;
  var roughExecution;
  var roughExecution2;
  var refresh;
  refresh=function(){
    if(filterLayers!==undefined){
      _.each(filterLayers,function(e){
        app.map.removeLayer(filterLayer);
      });
    }
    if(minMarkers!==undefined){
      _.each(minMarkers,function(minMarker){
        app.map.removeLayer(minMarker);
      });
    }
    if(maxMarkers!==undefined){
      _.each(maxMarkers, function(maxMarker){
        app.map.removeLayer(maxMarker);
      });
    }
    if(myStartRoute!==undefined){
      app.map.removeLayer(myStartRoute);
    }
    if(myEndRoute!==undefined){
      app.map.removeLayer(myEndRoute);
    }
    if(endMarker!==undefined){
      app.map.removeLayer(endMarker);
    }
    if(startMarker!==undefined){
      app.map.removeLayer(startMarker);
    }
    if(map1Layers!==undefined){
      _.each(map1Layers,function(map1Layer){
        app.map.removeLayer(map1Layer);
        $('#gradient1').fadeOut();
        $('.legendText').fadeOut();
      });
    }
    if(map2Layers!==undefined){
      _.each(map2Layers, function(map2Layer){
        app.map.removeLayer(map2Layer);
        $('#gradient2').fadeOut();
        $('.legendText').fadeOut();
      });
    }
    app.map.removeLayer(defaultLayer);
    execution=undefined;
    roughExecution=undefined;
    roughExecution2=undefined;
    setDefault();
    if(state0===1||state1===1||state2===1){
      $('.legend').css("left","400px");
    }
    $('.bottomBar').fadeOut();
  };

  var filterState;
  $(document).ready(function(){
    $('#option0').click(function(e){
      $('#dropdownMenu1').html("Select your filter range"+' <span class="caret"></span>');
      filterState=0;
    });
    $('#option1').click(function(e){
      $('#dropdownMenu1').html($('#option1').text()+' <span class="caret"></span>');
      filterState=1;
      option=1;
    });
    $('#option2').click(function(e){
      $('#dropdownMenu1').html($('#option2').text()+' <span class="caret"></span>');
      filterState=1;
      option=2;
    });
    $('#option3').click(function(e){
      $('#dropdownMenu1').html($('#option3').text()+' <span class="caret"></span>');
      filterState=1;
      option=3;
    });
    $('#option4').click(function(e){
      $('#dropdownMenu1').html($('#option4').text()+' <span class="caret"></span>');
      filterState=1;
      option=4;
    });
    $('#option5').click(function(e){
      $('#dropdownMenu1').html($('#option5').text()+' <span class="caret"></span>');
      filterState=1;
      option=5;
    });
    $('#option6').click(function(e){
      $('#dropdownMenu1').html($('#option6').text()+' <span class="caret"></span>');
      filterState=1;
      option=6;
    });
    $('#option7').click(function(e){
      $('#dropdownMenu1').html($('#option7').text()+' <span class="caret"></span>');
      filterState=1;
      option=7;
    });
    $('#option00').click(function(e){
      $('#dropdownMenu2').html("Select your filter range"+' <span class="caret"></span>');
      filterState=0;
    });
    $('#option8').click(function(e){
      $('#dropdownMenu2').html($('#option8').text()+' <span class="caret"></span>');
      filterState=1;
      option=8;
    });
    $('#option9').click(function(e){
      $('#dropdownMenu2').html($('#option9').text()+' <span class="caret"></span>');
      filterState=1;
      option=9;
    });
    $('#option10').click(function(e){
      $('#dropdownMenu2').html($('#option10').text()+' <span class="caret"></span>');
      filterState=1;
      option=10;
    });
    $('#below').click(function(e){
      roughExecution="SELECT * FROM indego_combined WHERE total_num_rides<"+avg;
    });
    $('#above').click(function(e){
      roughExecution="SELECT * FROM indego_combined WHERE total_num_rides>"+avg;
    });
    $('#below2').click(function(e){
      roughExecution2="SELECT * FROM indego_combined WHERE per_round<"+avgRound;
    });
    $('#above2').click(function(e){
      roughExecution2="SELECT * FROM indego_combined WHERE per_round>"+avgRound;
    });
  });

  setDefault();

  $('#mapsChoice1').click(function(e){
    if(filterLayers!==undefined){
      _.each(filterLayers,function(e){
        app.map.removeLayer(filterLayer);
      });
    }
    if(map2Layers!==undefined){
      _.each(map2Layers,function(map2Layer){
        app.map.removeLayer(map2Layer);
      });
    }
    app.map.removeLayer(defaultLayer);
    setfirstMap();

  });
  $('#mapsChoice2').click(function(e){
    if(filterLayers!==undefined){
      _.each(filterLayers,function(e){
        app.map.removeLayer(filterLayer);
      });
    }
    if(map1Layers!==undefined){
      _.each(map1Layers,function(map1Layer){
        app.map.removeLayer(map1Layer);
      });
    }
    app.map.removeLayer(defaultLayer);
    setsecondMap();
  });

  $('#min').click(function(e){
    minMarker=L.circleMarker([minFeature.properties.station_lat,minFeature.properties.station_lon],
    { radius:25,
      color: '#9ba1aa',
      weight: 5,
      opacity: 0.5,
      fillColor: '#9ba1aa',
      fillOpacity: 0.1 });
    minMarkers.push(minMarker);
    _.each(minMarkers,function(minMarker){
      minMarker.addTo(app.map);
      minMarker.on('mouseover', function(l){
        minMarker.setStyle( {radius: 15,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0,
          fillColor: '#9ba1aa',
          fillOpacity: 0.8});
      });
      minMarker.on('mouseout', function(l){
        minMarker.setStyle( {radius:25,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0.5,
          fillColor: '#9ba1aa',
          fillOpacity: 0.1});
      });
      minMarker.on('click', function(l){
        $('#indivIntro').fadeOut();
          app.geojsonClient.execute("SELECT * FROM indego_combined WHERE total_num_rides=(SELECT MIN(total_num_rides)FROM indego_combined)")
          .done(function(data) {
              stationClick(data.features[0].properties);
            });
      });
    });
    fillForm(minFeature.properties);
    app.map.setView([minFeature.properties.station_lat, minFeature.properties.station_lon],15);
    if(filterLayers!== undefined) {
      _.each(filterLayers,function(filterLayer){
        app.map.removeLayer(filterLayer);
        defaultLayer.addTo(app.map);
      });
    }
  });

  $('#max').click(function(e){
    maxMarker=L.circleMarker([maxFeature.properties.station_lat,maxFeature.properties.station_lon],
    { radius:25,
      color: '#9ba1aa',
      weight: 5,
      opacity: 0.5,
      fillColor: '#9ba1aa',
      fillOpacity: 0.1 });
    maxMarkers.push(maxMarker);
    _.each(maxMarkers,function(maxMarker){
      maxMarker.addTo(app.map);
      maxMarker.on('mouseover', function(l){
        maxMarker.setStyle( {radius: 15,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0,
          fillColor: '#9ba1aa',
          fillOpacity: 0.8});
      });
      maxMarker.on('mouseout', function(l){
        maxMarker.setStyle( {radius:25,
          color: '#9ba1aa',
          weight: 5,
          opacity: 0.5,
          fillColor: '#9ba1aa',
          fillOpacity: 0.1});
      });
      maxMarker.on('click', function(l){
        $('#indivIntro').fadeOut();
          app.geojsonClient.execute("SELECT * FROM indego_combined WHERE total_num_rides=(SELECT MAX(total_num_rides)FROM indego_combined)")
          .done(function(data) {
              stationClick(data.features[0].properties);
            });
      });
    });
    fillForm(maxFeature.properties);
    app.map.setView([maxFeature.properties.station_lat, maxFeature.properties.station_lon],15);
    if(filterLayers!== undefined) {
      _.each(filterLayers,function(filterLayer){
        app.map.removeLayer(filterLayer);
        defaultLayer.addTo(app.map);
      });
    }
  });

  $('#filter').click(function(e){
    app.map.removeLayer(defaultLayer);
    if(filterLayers!==undefined){
      _.each(filterLayers,function(e){
        app.map.removeLayer(filterLayer);
      });
    }
    if(map1Layers!==undefined){
      _.each(map1Layers,function(e){
        app.map.removeLayer(map1Layer);
        $('#gradient1').fadeOut();
      });
    }
    if(map1Layers!==undefined){
      _.each(map2Layers,function(e){
        app.map.removeLayer(map2Layer);
        $('#gradient2').fadeOut();
      });
    }
    if(myStartRoute!==undefined){
      app.map.removeLayer(myStartRoute);
    }
    if(myEndRoute!==undefined){
      app.map.removeLayer(myEndRoute);
    }
    if(endMarker!==undefined){
      app.map.removeLayer(endMarker);
    }
    if(startMarker!==undefined){
      app.map.removeLayer(startMarker);
    }
    app.map.setView([39.957042, -75.175922], 13);
    lowFilterNumber=$('#low_num_rides').val();
    hiFilterNumber=$('#high_num_rides').val();
    setFilter();
    $('.bottomBar').fadeOut();
  });

  $('#reset').click(function(e){
    refresh();
  });

  $('#refresh').click(function(e){
    refresh();
  });
