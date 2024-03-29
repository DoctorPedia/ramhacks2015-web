var map;
var loc = {lat: 37.5333, lng: -77.4667};
// navigator.geolocation.getCurrentPosition(GetLocation);
// function GetLocation(location) {
//     loc['lat'] = location.coords.latitude;
//     loc['lng'] =location.coords.longitude;
// }
var doctorLocs = [];
function findDoctors(range, limit, insureID, specID) {
	//specID = "";
	navigator.geolocation.getCurrentPosition(function(location){
		loc['lat'] = location.coords.latitude;
    	loc['lng'] =location.coords.longitude;

		if(!(limit.length > 0))
			limit = '20';
		if(!(range.length > 0))
			range = '10';

		var baseURL = 'https://api.betterdoctor.com/2015-01-27/doctors';
		var request = {
			type: 'GET',
			url: 'https://api.betterdoctor.com/2015-01-27/doctors',
			data: {
				location: loc.lat + "," + loc.lng + "," + range,
				user_location: loc.lat + "," + loc.lng,
				limit: limit,
				user_key: "02d43d2040b26fd640f5963e44054d2f"
			}
		};
		if(insureID.length>0)
			request.data['insurance_uid'] = insureID;
		if(specID.length > 0)
			request.data['specialty_uid'] = specID;
		$.ajax(request).done(function (res) {
			parseDoctors(res.data);
			populateMap();
		});


    	
	});
}
function parseDoctors(doctors) {
	for(var i =0; i<doctors.length;i++){
		var practices = doctors[i].practices;
		for(var j = 0; j<practices.length; j++){
			var tempObj = {
				loc: {
					lat: practices[j].lat,
					lng: practices[j].lon
				},
				url: doctors[i].attribution_url,
				specs: doctors[i].specialties,
				practice: doctors[i].practices[0].name,
				profile: doctors[i].profile //first_name, middle_name, last_name, title, image_url, gender, bio
			};
			if(doctors[i].ratings.length > 0)
				tempObj['rating'] = doctors[i].ratings[0].rating;
			else//add fake ratings
				tempObj['rating'] = ((Math.random() * 10) + 1) % 5;
			doctorLocs.push(tempObj);			
		}
	}
}
function populateMap () {
	for(var i = 0; i<doctorLocs.length; i++){
		var marker = new google.maps.Marker({
		    map: map,
		    position: doctorLocs[i].loc,
		    title: doctorLocs[i].practice
		  });
		attachInfo(marker, doctorLocs[i]);
	}
	map.panTo(loc);
}
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: loc,
    zoom: 10
  });
}
function attachInfo(marker, doctor){
	var specString = "";
	for(var k = 0; k<doctor.specs.length; k++){
		if(k==(doctor.specs.length -1))
			specString += " " + doctor.specs[k].name;
		else
			specString += " " + doctor.specs[k].name + ",";

	}
	var infoContent = 
		"<div>"+ "<h1>"+doctor.practice+"</h1><hr>"+ '<div class="pull-left" style="width: 50%; max-width: 46px; float:left">'
			+ "<img src='"+doctor.profile.image_url+"' height=45px widith=45px /></div>" +
			"<h2><a href='" + doctor.url + "'>"+doctor.profile.last_name + ", " + doctor.profile.first_name + "</a></h2>"+
			"<h3>"+specString+"</h3>";
		if(doctor.rating)
			infoContent += '<span class="stars">' + doctor.rating +'</span>';
		infoContent += "</div>";
	var infowindow = new google.maps.InfoWindow({
	  content: infoContent
	});
	marker.addListener('click', function() {
	  infowindow.open(map, marker);
	  $('span.stars').stars();
	});
}

function popSpecs() {
	var allSpec = [];
	var specRequest = {
		data: {
			user_key: "02d43d2040b26fd640f5963e44054d2f"
		},
		type: 'GET',
		url: 'https://api.betterdoctor.com/2015-01-27/specialties'
	}
	$.ajax(specRequest).done(function (res) {
		res.data.sort(function(a,b){
			var an = a.name,
				bn = b.name;

			if(an > bn) {
				return 1;
			}
			if(an < bn) {
				return -1;
			}
			return 0;
		});

		for(var i =0; i<res.data.length; i++){
			//allSpec.append({
			//	name: res.data[i].name,
			//	id: res.data[i].uid
			//});	
			AddDoctor(res.data[i].uid,res.data[i].name);		
		}
	});
	

}
function popProviders () {
	var allPro = [];
	var specRequest = {
		data: {
			user_key: "02d43d2040b26fd640f5963e44054d2f"
		},
		type: 'GET',
		url: 'https://api.betterdoctor.com/2015-01-27/insurances'
	}
	$.ajax(specRequest).done(function (res) {
		for(var i =0; i<res.data.length; i++){
			//allPro.append({
			//	name: res.data[i].name,
			//	plans: res.data[i].plans
			//});			
			AddInsurer({
				name: res.data[i].name,
				plans: res.data[i].plans
			});
		}
	});

}
$.fn.stars = function() {
    return $(this).each(function() {
        // Get the value
        var val = parseFloat($(this).html());
        // Make sure that the value is in 0 - 5 range, multiply to get width
        var size = Math.max(0, (Math.min(5, val))) * 16;
        // Create stars holder
        var $span = $('<span />').width(size);
        // Replace the numerical value with stars
        $(this).html($span);
    });
}
