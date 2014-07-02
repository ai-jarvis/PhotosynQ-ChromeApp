function GetLocation(){
	if(navigator.onLine){

		navigator.geolocation.getCurrentPosition(
			function(pos){
				console.log(pos.coords);
				_geolocation = {}
				_geolocation.latitude = pos.coords.latitude
				_geolocation.longitude = pos.coords.longitude
				_geolocation.accuracy = pos.coords.accuracy
				
				SaveToStorage('geolocation',_geolocation,function(){});
				
				WriteMessage('Geo Location updated','info');
				$('#CurrentLocationDisplay,#CurrentLocationDisplayImgCoords').html('<small class="text-muted"><i class="fa fa-location-arrow"></i> '+_geolocation.latitude+', '+_geolocation.longitude+'</small>');
				$('#CurrentLocationIndicator').toggleClass('text-muted fa-inverse').attr('title', _geolocation.latitude+', '+_geolocation.longitude);
				var url = 'http://maps.googleapis.com/maps/api/staticmap?center='+_geolocation.latitude+','+_geolocation.longitude+'&zoom=15&size=300x175&maptype=roadmap&markers=color:red|'+_geolocation.latitude+','+_geolocation.longitude+'&sensor=false'
				if(_media[url] !== undefined){
					$('#CurrentLocationDisplayImg').html('<img src="'+_media[url]+'">');
				}else{
					var xhrMap = new XMLHttpRequest();
					xhrMap.responseType = 'blob';
					xhrMap.onreadystatechange = function() {
						if (xhrMap.readyState == 4){
							if(xhrMap.response !== null && xhrMap.response !== undefined){
								$('#CurrentLocationDisplayImg').html('<img src="'+window.URL.createObjectURL(xhrMap.response)+'">');
								SaveImgToLocalStorage(url,window.URL.createObjectURL(xhrMap.response));
							}
						}
					}
					xhrMap.open('GET', url, true);
					xhrMap.send();
				}				
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
				$('#CurrentLocationDisplay,#CurrentLocationDisplayImgCoords').html('<small class="text-muted"><i class="fa fa-location-arrow"></i> '+_geolocation.latitude+', '+_geolocation.longitude+'</small>');
				$('#CurrentLocationIndicator').toggleClass('text-muted fa-inverse').attr('title', _geolocation.latitude+', '+_geolocation.longitude);
				if(_media[url] !== undefined)
					$('#CurrentLocationDisplayImg').html('<img src="'+_media[url]+'">');
			}
		});
	
	}
	return false;
}