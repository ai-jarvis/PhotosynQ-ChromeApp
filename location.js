function GetLocation(){
	if(navigator.onLine){
		$('#CurrentLocationIndicator').removeClass('fa-inverse').addClass('text-muted')
		navigator.geolocation.getCurrentPosition(
			function(pos){
				_geolocation = {}
				_geolocation.latitude = pos.coords.latitude
				_geolocation.longitude = pos.coords.longitude
				_geolocation.accuracy = pos.coords.accuracy
			
				WriteMessage('Geo location updated','info');
				$('#CurrentLocationDisplay').html('<small class="text-muted"><i class="fa fa-location-arrow"></i> '+_geolocation.latitude+', '+_geolocation.longitude+'</small>');
				$('#CurrentLocationIndicator').removeClass('text-muted').addClass('fa-inverse').attr('title', _geolocation.latitude+', '+_geolocation.longitude);
				var url = 'http://maps.googleapis.com/maps/api/staticmap?center='+_geolocation.latitude+','+_geolocation.longitude+'&zoom=15&size=300x175&maptype=roadmap&markers=color:red|'+_geolocation.latitude+','+_geolocation.longitude+'&sensor=false'
				DatabaseGetImage('map',url,function(img){
					$('#CurrentLocationDisplayImg').html(img.img+'<small class="text-muted"><i class="fa fa-location-arrow"></i> '+_geolocation.latitude+', '+_geolocation.longitude+' &plusmn; '+pos.coords.accuracy+' m</small>');
				});			
			},
			function(error){
				WriteMessage(error.message,'danger');
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
	}
	return false;
}