function GetLocation(){
	/*
	Using the free service freegeoip.net
	to get the location until the location service for the chrome extension
	leaves the developer version.
	
	freegeoip.net/{format}/{ip_or_hostname}{format}/{ip_or_hostname}
	{format} csv, xml or json
	*/
	if(navigator.onLine){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://freegeoip.net/json/", true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				try {
					_geolocation = JSON.parse(xhr.responseText);
				} catch (e) {
					WriteMessage('Invalid location information.','danger');
					return;
				}
				SaveToStorage('geolocation',_geolocation,function(){});
				WriteMessage('Geo Location updated','info');
				$('#CurrentLocationDisplay').html('<small><i class="fa fa-location-arrow"></i> '+_geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+')</small>');
				$('#CurrentLocationIndicator').toggleClass('text-muted fa-inverse').attr('title', _geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+')');
			}
		}
	}
	else{
		chrome.storage.local.get('geolocation', function(result){
			if(result !== undefined){
				try {
					_geolocation = JSON.parse(result);
				} catch (e) {
					RemoveFromStorage('geolocation');
					WriteMessage('Invalid location information.','danger');
					return;
				}
				WriteMessage('Geo Location from cache','info');
				$('#CurrentLocationDisplay').html('<small><i class="fa fa-location-arrow"></i> '+_geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+')</small>');
				$('#CurrentLocationIndicator').toggleClass('text-muted fa-inverse').attr('title', _geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+') - Cached');
			}
		});
	
	}
	return false;
}