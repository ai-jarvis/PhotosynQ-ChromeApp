// ===============================================================================================
// 											Database Sign in
// ===============================================================================================
function DatabaseSignIn(){
	if(!navigator.onLine){
		WriteMessage('<i class="fa fa-exclamation-triangle"></i> Offline','warning');
		return false;
	}
	if(document.getElementById('SignInEmail').value == '' || document.getElementById('SignInPassword').value == ''){
		WriteMessage('Enter email and password to sign in.','danger');
		return false;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("POST", _apiURL+"sign_in.json", true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	var params = 'user[email]='+document.getElementById('SignInEmail').value+'&user[password]='+document.getElementById('SignInPassword').value;
	xhr.send(params);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 401){
				WriteMessage('Wrong sign in credentials','danger');
				return;
			}
			try {
				var response = JSON.parse(xhr.responseText);
			} catch (e) {
				WriteMessage('Invalid database response.','danger');
				return;
			}
			if(response['message'] != undefined)
				WriteMessage('Wrong email or password','danger');
			else if(response['auth_token'] != undefined){
				WriteMessage('Successfully signed in','info');
				_authentication = response;
				SaveToStorage('authentication',response,function(){});
				$('#DatabaseSignedIn').show();
				$('#DatabaseSignInState').toggleClass('text-muted fa-inverse').attr('title', 'Signed in as '+response['name']);
				$('#DatabaseSignedInUser').text(response['name'])
				$('#DatabaseSignedInEmail').text(response['email'])
				$('#DatabaseSignInForm').hide();
				$('#DatabaseSignedInLink, #ViewMyProfileBtn').attr('href',response.user.profile_url);
				DatabaseGetImage('avatar',response.user.thumb_url,function(img){
					$('#LoginUserAvatar').attr('src',img.src);
				});
				
				GetProjectsFromDB(_authentication.auth_token,_authentication.email);
				GetProtocolsFromDB(_authentication.auth_token,_authentication.email);
				GetMacrosFromDB(_authentication.auth_token,_authentication.email);
			}
		}
	}
	return false;
};

// ===============================================================================================
// 											Database Sign Off
// ===============================================================================================
function DatabaseSignOff(){
	if(!navigator.onLine){
		WriteMessage('Offline','danger');
		return false;
	}
	var xhr = new XMLHttpRequest();
	xhr.open("DELETE", _apiURL+"sign_out.json", true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			try {
				var response = JSON.parse(xhr.responseText);
			} catch (e) {
				WriteMessage('Invalid database response ('+e.message+')','danger');
				return;
			}
			if(response['message'] != undefined)
				WriteMessage('Successfully signed off','info');	
			}	
			_authentication = null;
			RemoveFromStorage('authentication');
			$('#DatabaseSignedIn').hide();
			$('#DatabaseSignInState').toggleClass('text-muted fa-inverse').attr('title','Not signed in.');
			$('#DatabaseSignedInUser, #DatabaseSignedInEmail').text('');
			$('#DatabaseSignedInLink, #ViewMyProfileBtn').attr('href','');
			$('#SignInEmail,#SignInPassword').val('');
			$('#DatabaseSignInForm').show();
		}
	
	var params = "auth_token="+_authentication.auth_token;
	xhr.send(params);
	return false;
};

// ===============================================================================================
// 								Get Projects From Cache
// ===============================================================================================
function GetProjectsFromCache(){
	chrome.storage.local.get('cached_projects', function(response){
		if(response['cached_projects'] !== undefined){
			try {
				_projects = JSON.parse(response['cached_projects']);
			} catch (e) {
				RemoveFromStorage('cached_projects');
				WriteMessage('Cached projects have wrong format','danger');
				return;
			}

			$('#ProjectList').empty();	
			for(var i in _projects){
				var html = '<a href="#" class="list-group-item" data-value="'+_projects[i].id+'" style="min-height:88px;">';
				html += '<img class="media-object pull-left" data-url="'+_projects[i].thumb_url+'" src="/img/thumb_missing.png" style="width: 64px; height: 64px; margin-right:4px">'
				html += '<h5 class="list-group-item-heading" style="word-wrap:break-word;">'+_projects[i].name+'</h5>';
				if(_projects[i].description.length > 400)
					html += '<small class="list-group-item-text">'+_projects[i].description.substring(0, 400)+' ...</small>';
				else
					html += '<small class="list-group-item-text">'+_projects[i].description+'</small>';
				html += '</a>';
				$('#ProjectList').append(html);
				
				DatabaseGetImage('project',_projects[i].thumb_url,function(img){
					$('#ProjectList > a img[data-url="'+img.url+'"]').attr('src', img.src)
				});
			}

			$('#ProjectTab .panel-heading .badge').text(
				$('#ProjectTab .list-group a').length
			);

			chrome.storage.local.getBytesInUse('cached_projects', function(response){
				$('#ProjectStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});

		}
		else{
			WriteMessage('No projects cached. Connect to the internet to update your list.','warning')
		}
	});
}

// ===============================================================================================
// 							Get Projects From Database
// ===============================================================================================
function GetProjectsFromDB(token,email){
	if(navigator.onLine && (token != null && email != null)){
		$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-download');
		var xhr = new XMLHttpRequest();
		xhr.open("GET", _apiURL+"projects.json?user_token="+token+"&user_email="+email, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				try {
					tmp = JSON.parse(xhr.responseText);
					_projects = {};
					for(i in tmp){
						_projects[tmp[i].id] = {
							'id': tmp[i].id,
							'name': tmp[i].name,
							'custom_fields': tmp[i].custom_fields,
							'directions_to_collaborators': tmp[i].directions_to_collaborators,
							'lead': JSON.parse(tmp[i].plead),
							'image_url': tmp[i].photo.large.url,
							'thumb_url': tmp[i].photo.thumb.url,
							'description': tmp[i].description,
							'protocols_ids': tmp[i].protocols_ids,
							'url': tmp[i].purl,
							'update': tmp[i].updated_at,
							'data_count': tmp[i].data_count
						}
					}
				} catch (e) {
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
					WriteMessage('Invalid database response.','danger');
					return;
				}
				if(tmp.error !== undefined){
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
					WriteMessage(''+tmp.error,'danger');
					return;
				}
				SaveToStorage('cached_projects',_projects,function(){
					GetProjectsFromCache();
				});
				WriteMessage('Project list updated','info');
				$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
			}
		}
	}
	return false;
};

// ===============================================================================================
// 								Get Protocols From Cache
// ===============================================================================================
function GetProtocolsFromCache(){
	chrome.storage.local.get(['cached_protocols','cached_userprotocols'], function(response){
		if(response['cached_protocols'] !== undefined){
			try {
				_protocols = JSON.parse(response['cached_protocols']);
			} catch (e) {
				RemoveFromStorage('cached_protocols');
				WriteMessage('Cached protocols have wrong format','danger');
				return;
			}
			
			$('#PhotosynQProtocolsList').empty();	
			var html = "";
			for(var i in _protocols){
				var pre_selected = _protocols[i].pre_selected ? 1 : 0;
				html += '<a href="#" class="list-group-item" data-value="'+i+'" data-preselect="'+pre_selected+'">';
				html += '<h5 class="list-group-item-heading" style="word-wrap:break-word;">'+_protocols[i].name+'</h5>';
				html += '<small class="list-group-item-text">'+_protocols[i].description+'</small>';
				html += '</a>';
			}
			$('#PhotosynQProtocolsList').append(html);

			// Sort by preselect
			var $sorta = $('#PhotosynQProtocolsList a');
			$sorta.sort(function(a,b){
				var an = a.getAttribute('data-preselect'),
					bn = b.getAttribute('data-preselect');

				if(an > bn)
					return -1;
				
				if(an < bn)
					return 1;
				
				return 0;
			});

			$sorta.detach().appendTo($('#PhotosynQProtocolsList'));

		}
		else{
			WriteMessage('No Protocols cached. Connect to the internet to update your list.','warning')
		}

		$('#QuickMeasurementTab .panel-heading .badge').text(
			$('#QuickMeasurementTab .list-group a').length
		);
		
		chrome.storage.local.getBytesInUse(['cached_protocols','cached_userprotocols'], function(response){
			$('#ProtocolStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
		});
		
		// Update Protocols in Protocolcreator
		//----------------------------------------------------------------------------------------
		var ProtocolWindow = chrome.app.window.get('protocolcreate');
		if(ProtocolWindow !== null)
			ProtocolWindow.contentWindow.postMessage({'db':_protocols,'macros':_macros}, '*');
		
	});
	return false;
}

// ===============================================================================================
// 								Get Protocols From Database
// ===============================================================================================
function GetProtocolsFromDB(token,email){
	if(navigator.onLine && (token != null && email != null)){
		$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-download');
		var xhr = new XMLHttpRequest();
		xhr.open("GET", _apiURL+"protocols.json?user_token="+token+"&user_email="+email, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				try {
					tmp = JSON.parse(xhr.responseText);
					_protocols = {};
					for(i in tmp){
						_protocols[tmp[i].id] = {
							'id':tmp[i].id,
							'name':tmp[i].name,
							'slug':tmp[i].slug,
							'pre_selected':tmp[i].pre_selected,
							'macro_id':tmp[i].macro_id,
							'description':tmp[i].description,
							'protocol_json':tmp[i].protocol_json2
						}
					}					
				} catch (e) {
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
					WriteMessage('Invalid database response.','danger');
					return;
				}
				if(tmp.error !== undefined){
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
					WriteMessage(''+tmp.error,'danger');
					return;
				}
				SaveToStorage('cached_protocols',_protocols, function(){
					GetProtocolsFromCache();
				});

				WriteMessage('Protocol list updated','info');
				$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
			}
		}
	}
	return false;
};

// ===============================================================================================
// 								Get Macros from cache
// ===============================================================================================
function GetMacrosFromCache(){
	chrome.storage.local.get('cached_macros', function(response){
		if(response['cached_macros'] !== undefined){
			try {
				_macros = JSON.parse(response['cached_macros']);
			} catch (e) {
				RemoveFromStorage('cached_macros');
				WriteMessage('Cached macros have wrong format','danger');
				return;
			}
			
			chrome.storage.local.getBytesInUse('cached_macros', function(response){
				$('#MacroStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});			

			// Update Macros for Macro creation tool
			//----------------------------------------------------------------------------------------
			var MacroWindow = chrome.app.window.get('macro');
			if(MacroWindow !== null)
				MacroWindow.contentWindow.postMessage({'macros':_macros}, '*');
			
		}	
		else{
			WriteMessage('No Macros cached. Connect to the internet to update your list.','warning');
		}
	});
}

// ===============================================================================================
// 							Get Macros from database and update cache
// ===============================================================================================
function GetMacrosFromDB(token,email){
	$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-download');
	var xhr = new XMLHttpRequest();
	xhr.open("GET", _apiURL+"macros.json?user_token="+token+"&user_email="+email, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.send();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4){			
			try {
				tmp = JSON.parse(xhr.responseText);
				_macros = {};
				for(i in tmp){
					_macros[tmp[i].id] = {
						'id':tmp[i].id,
						'name':tmp[i].name,
						'slug':tmp[i].slug,
						'javascript_code':tmp[i].javascript_code	
					}
				}
			} catch (e) {
				$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
				WriteMessage('Invalid database response.','danger');
				return;
			}
			if(tmp.error !== undefined){
				$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
				WriteMessage(tmp.error,'danger');
				return;
			}
			SaveToStorage('cached_macros', _macros,function(){
				GetMacrosFromCache();
			});
			WriteMessage('Macro list updated','info');
			$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-download').addClass('fa-cloud');
		}
	}
	return false;
};

// ===============================================================================================
// 									Database Add Data to Project
// ===============================================================================================
function DatabaseAddDataToProject(){
	var token = _authentication.auth_token;
	var email = _authentication.email
	var project_id = _SelectedProject;
	var data = ResultString;
	if(!navigator.onLine && (token != null && email != null && project_id != null && data != '')){
		PushDataToStorage(email,project_id,data)
	}
	if(navigator.onLine && (token != null && email != null && project_id != null && data != '')){
		$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-upload');
		var xhr = new XMLHttpRequest();
		xhr.open("POST", _apiURL+"projects/"+project_id+"/data.json", true);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		var params = {"user_token":token, "user_email":email, "data": data};
		try{
			params = JSON.stringify(params);
		}catch(e){
			$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
			WriteMessage('Cannot send data, wrong format ('+e.message+')','danger');
			return;
		}
		xhr.send(params);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				try{
					var response = JSON.parse(xhr.responseText);
					if(response.status == "success"){
						WriteMessage(response.notice,'success');
						SelectProject(project_id);
					}
					else{
						PushDataToStorage(email,project_id,data);
					}
				}catch(e){
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
					WriteMessage('Invalid server response ('+ e.message +')','danger');
					PushDataToStorage(email,project_id,data);
					return;
				}
				$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
			}
		}
	}
	DiscardMeasurement();
	SelectProject(project_id);	
	return false;
};

// ===============================================================================================
// 						Push data to storage in case server response is invalid
// ===============================================================================================
function PushDataToStorage(email,project_id,data){
	chrome.storage.local.get('cached_data', function(response){
		var experiment_data = {};
		if(response['cached_data'] !== undefined){
			try {
				experiment_data = JSON.parse(response['cached_data']);
			} catch (e) {
				RemoveFromStorage('cached_data');
				WriteMessage('Cached data has wrong format ('+e.message+')','danger');
				return;
			}
		}
		if(experiment_data[email] === undefined)
			experiment_data[email] = {}
		if(experiment_data[email][project_id] === undefined)
			experiment_data[email][project_id] = []
		experiment_data[email][project_id].push(data);
		SaveToStorage('cached_data',experiment_data, function(){
			chrome.storage.local.getBytesInUse('cached_data', function(response){
				$('#CachedDataQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});
			WriteMessage('Measurement cached','info');	
		});
	});
}


// ===============================================================================================
// 						Push data from storage to database
// ===============================================================================================
function PushData(cacheProjectID, token, email, experiment_data, i, callback){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", _apiURL+"projects/"+cacheProjectID+"/data.json", true);
	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	var params = {"user_token":token, "user_email":email, "data": experiment_data[email][cacheProjectID][i]};
	try{
		params = JSON.stringify(params);
		xhr.loopid = i;
		xhr.send(params);
	}catch(e){
		WriteMessage('Cannot send data, wrong format ('+e.message+')','danger');
		delete experiment_data[email][cacheProjectID][i];
		SaveToStorage('cached_data',experiment_data, function(){});
		callback(false);
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4){
			try{
				var response = JSON.parse(xhr.responseText);
				if(response.status == "success"){
					WriteMessage(response.notice,'success');
					delete experiment_data[email][cacheProjectID][xhr.loopid];
					SaveToStorage('cached_data',experiment_data, function(){});
					callback(true);
				}
				if(response.status == "failed"){
					WriteMessage(response.notice,'danger');
					callback(false);
				}
			}catch(e){
				WriteMessage('Invalid server response ('+ e.message +')','danger');
				callback(false);
			}
		}
	}
}


// ===============================================================================================
// 								Database Add Data to Project from cache
// ===============================================================================================
function DatabaseAddDataToProjectFROMStorage(token,email){
	chrome.storage.local.getBytesInUse('cached_data', function(response){
		$('#CachedDataQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
	});	
	if(navigator.onLine && (token != null && email != null)){
		chrome.storage.local.get('cached_data', function(response){
			if(response['cached_data'] !== undefined){
				try {
					var experiment_data = JSON.parse(response['cached_data']);
					if(experiment_data[email] !== undefined){
						for(cacheProjectID in experiment_data[email]){
							if(experiment_data[email][cacheProjectID].length === 0){
								continue;
							}
							$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-upload');

							var x = 0;
							var LoopThroughData = function(cacheProjectID, token, email, experiment_data) {
								// call itself
								PushData(cacheProjectID, token, email, experiment_data, x, function(){
									// set x to next item
									x++;
									// any more items in array?
									if(x < experiment_data[email][cacheProjectID].length) {
										LoopThroughData(cacheProjectID, token, email, experiment_data);
									}
									else if(x == experiment_data[email][cacheProjectID].length) {
										for(var ii = experiment_data[email][cacheProjectID].length -1; ii >= 0 ; ii--){
											if(experiment_data[email][cacheProjectID][ii] == null){
												experiment_data[email][cacheProjectID].splice(ii, 1);
											}
										}
										SaveToStorage('cached_data',experiment_data, function(){});
										$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
										return false;
									}
								});
							}
							// start 'loop'
							LoopThroughData(cacheProjectID, token, email, experiment_data);							
							chrome.storage.local.getBytesInUse('cached_data', function(response){
								$('#CachedDataQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
							});
						}
					}
				} catch (e) {
					//RemoveFromStorage('cached_data');
					$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
					WriteMessage('Cached data has wrong format ('+e.message+')','danger');
					return;
				}
			}
		});
	}
	$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud-upload').addClass('fa-cloud');
	return false;
};

// ===============================================================================================
// 								Database Add/Edit Macro
// ===============================================================================================
function DatabaseAddEditMacro(token,email,macro){
	return false
};


// ===============================================================================================
// 								Database Add/Edit Protocol
// ===============================================================================================
function DatabaseAddEditProtocol(token,email,protocol){
	return false
};

// ===============================================================================================
//									Get Images from server
// ===============================================================================================
function DatabaseGetImage(location,url,callback){
	if(url === undefined){
		return;
	}
	if(_media[location] === undefined)
		_media[location] = {}
	
	if(_media[location][url] !== undefined){
		callback({'img':'<img src="'+_media[location][url]+'">','url':url, 'src':_media[location][url]});
	}	
	else{
		if(url.match(/(^https?)/gi) == null)
			return;
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'blob';
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200){
				if(xhr.response !== null && xhr.response !== undefined){
					SaveImgToLocalStorage(location,url,window.URL.createObjectURL(xhr.response));
					callback({'img':'<img src="'+window.URL.createObjectURL(xhr.response)+'">','url':url, 'src':window.URL.createObjectURL(xhr.response)});
				}
			}
		}
		xhr.open('GET', url, true);
		xhr.send();
	}
};