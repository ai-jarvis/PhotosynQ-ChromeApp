function GetLocation(){
	var location_animation = '<div style="width:300px; height:175px;" class="text-muted text-center">';
	location_animation += '<i class="fa fa-map-marker faa-burst animated" style="font-size:42px;text-shadow: 2px 2px rgba(0,0,0,0.1);padding-top: 70px;"></i>';
	location_animation += '</div>';
	
	if(navigator.onLine){
		$('#CurrentLocationIndicator').removeClass('fa-inverse').addClass('text-muted')
		$('#CurrentLocationDisplayImg').empty().html(location_animation + '<small class="text-muted">Searching...</small>');
		navigator.geolocation.getCurrentPosition(
			function(pos){
				_geolocation = {}
				_geolocation.latitude = pos.coords.latitude
				_geolocation.longitude = pos.coords.longitude
				_geolocation.accuracy = pos.coords.accuracy
			
				WriteMessage('Geo location updated','info');
				$('#CurrentLocationDisplay').html('<small class="text-muted"><i class="fa fa-map-marker"></i> '+_geolocation.latitude+', '+_geolocation.longitude+'</small>');
				$('#CurrentLocationIndicator').removeClass('text-muted').addClass('fa-inverse').attr('title', 'Your location: '+_geolocation.latitude+', '+_geolocation.longitude);
				var url = 'http://maps.googleapis.com/maps/api/staticmap?center='+_geolocation.latitude+','+_geolocation.longitude+'&zoom=15&size=300x175&maptype=roadmap&markers=color:red|'+_geolocation.latitude+','+_geolocation.longitude+'&sensor=false'
				DatabaseGetImage('map',url,function(img){
					$('#CurrentLocationDisplayImg').html(img.img+'<small class="text-muted"><i class="fa fa-map-marker"></i> '+_geolocation.latitude+', '+_geolocation.longitude+' &plusmn; '+pos.coords.accuracy+' m</small>');
				});			
			},
			function(error){
				WriteMessage(error.message,'danger');
				_geolocation = false;
				$('#CurrentLocationDisplayImg').empty().html(location_animation + '<small class="text-muted">Location not found</small>');
				$('#CurrentLocationDisplay').html('<small class="text-danger"><i class="fa fa-map-marker"></i> Unknown</small>');
				$('#CurrentLocationIndicator').addClass('text-muted').removeClass('fa-inverse').attr('title', 'Unknown location');
			},
			{
			  enableHighAccuracy: true,
			  timeout: 15000,
			  maximumAge: 0
			}
		);
	}
	else{
		WriteMessage('You need to be online to identify your geo location.','warning');
		_geolocation = false;
		$('#CurrentLocationDisplayImg').empty().html(location_animation + '<small class="text-muted">Location not found (offline)</small>');
		$('#CurrentLocationDisplay').html('<small class="text-danger"><i class="fa fa-map-marker"></i> Unknown</small>');
		$('#CurrentLocationIndicator').addClass('text-muted').removeClass('fa-inverse').attr('title', 'Unknown location');
	}
	return false;
}