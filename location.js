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
				$('#CurrentLocationDisplay,#CurrentLocationDisplayImgCoords').html('<small class="text-muted"><i class="fa fa-location-arrow"></i> '+_geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+')</small>');
				$('#CurrentLocationIndicator').toggleClass('text-muted fa-inverse').attr('title', _geolocation.city+', '+_geolocation.region_code+' - '+_geolocation.country_code+' ('+_geolocation.latitude+', '+_geolocation.longitude+')');
				var xhrMap = new XMLHttpRequest();
				xhrMap.responseType = 'blob';
				xhrMap.onreadystatechange = function() {
					if (xhrMap.readyState == 4){
						if(xhrMap.response !== null && xhrMap.response !== undefined){
							$('#CurrentLocationDisplayImg').html('<img src="'+window.URL.createObjectURL(xhrMap.response)+'">');
						}
					}
				}
				var url = 'http://maps.googleapis.com/maps/api/staticmap?center='+_geolocation.latitude+','+_geolocation.longitude+'&zoom=15&size=300x175&maptype=roadmap&markers=color:red|'+_geolocation.latitude+','+_geolocation.longitude+'&sensor=false'
				xhrMap.open('GET', url, true);
				xhrMap.send();
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