var numStyle2 = function (feature) {
  if (feature.properties.total_num_rides < 5000){
    return {
      radius: 3,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity:0.7
    };
  }
  if (feature.properties.total_num_rides < 10000 && feature.properties.total_num_rides >= 5000){
    return {
      radius: 5,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity:0.7
    };
  }
  if (feature.properties.total_num_rides < 15000 && feature.properties.total_num_rides >= 10000){
    return {
      radius: 7,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity:0.7
    };
  }
  if (feature.properties.total_num_rides < 20000 && feature.properties.total_num_rides >= 15000){
    return {
      radius: 9,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity:0.7
    };
  }
  if (feature.properties.total_num_rides < 25000 && feature.properties.total_num_rides >= 20000){
    return {
      radius: 11,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity: 0.6
    };
  }
  if (feature.properties.total_num_rides < 30000 && feature.properties.total_num_rides >= 25000){
    return {
      radius: 13,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity: 0.7
    };
  }
  else {
    return {
      radius: 16,
      color:"deepskyblue",
      weight: 5,
      opacity: 0,
      fillColor:"deepskyblue",
      fillOpacity: 0.85
    };
  }
};
var range1;
var mapStyle1 = function (feature) {
  return {
    radius: 8,
    color: featureColor1(feature.properties.daratio),
    weight: 5,
    opacity: 0.6,
    fillColor: featureColor1(feature.properties.daratio),
    fillOpacity: 0.9
  };
};

var mapStyle2 = function (feature) {
  return {
    radius: 8,
    color: featureColor2(feature.properties.per_round),
    weight: 5,
    opacity: 0.6,
    fillColor: featureColor2(feature.properties.per_round),
    fillOpacity: 0.8
  };
};

var selectedStyle = {
  radius: 20,
  color:'greenyellow',
  weight: 8,
  opacity: 0.5,
  fillColor:'gray',
  fillOpacity: 0.7
};

var endStyle = {
  radius: 20,
  color:"midnightblue",
  weight: 5,
  opacity: 0.6,
  fillColor: "midnightblue",
  fillOpacity: 0
};

var startStyle = {
  radius: 25,
  color:'#e5d090',
  weight: 5,
  opacity: 0.7,
  fillColor:'#e5d090',
  fillOpacity: 0
};
