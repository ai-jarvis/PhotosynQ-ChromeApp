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
	xhr.open("POST", "http://photosynq.venturit.net/api/v1/sign_in.json", true);
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
				$('#DatabaseSignInState').toggleClass('fa-lock fa-unlock-alt').toggleClass('text-muted fa-inverse').attr('title', 'Signed in as '+response['name']);
				$('#DatabaseSignedInUser').text(response['name'])
				$('#DatabaseSignedInEmail').text(response['email'])
				$('#DatabaseSignInForm').hide();
				$('#DatabaseSignedInLink').attr('href','http://photosynq.venturit.net/users/'+response['name'].toLowerCase());
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
	xhr.open("DELETE", "http://photosynq.venturit.net/api/v1/sign_out.json", true);
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
			$('#DatabaseSignInState').toggleClass('fa-lock fa-unlock-alt').toggleClass('text-muted fa-inverse').attr('title','Not signed in.');
			$('#DatabaseSignedInUser, #DatabaseSignedInEmail').text('');
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
	chrome.storage.local.get('cached_experiments', function(response){
		if(response['cached_experiments'] !== undefined){
			try {
				_experiments = JSON.parse(response['cached_experiments']);
			} catch (e) {
				RemoveFromStorage('cached_experiments');
				WriteMessage('Cached projects have wrong format','danger');
				return;
			}
			$('#ExperimentSelection').empty();
			$('#ExperimentSelectionDescription').text("Select the project you want to collect data for.");
			for(var i in _experiments){
				$('#ExperimentSelection').append('<option value="'+_experiments[i].id+'" title="'+_experiments[i].description+'">'+_experiments[i].name+'</option>');
			}
			
			var sortedProjects = $("#ExperimentSelection option").sort(sortingAZ)
			$("#ExperimentSelection").empty().append( sortedProjects );
			$('#ExperimentSelection').prepend('<option value="" title="Select the protocol you want to run.">Select a Project</option>');			
			
			chrome.storage.local.getBytesInUse('cached_experiments', function(response){
				$('#ProjectStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});
		}
		else{
			WriteMessage('No Experiments cached. Connect to the internet to update your list.','warning')
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
		xhr.open("GET", "http://photosynq.venturit.net/api/v1/projects.json?user_token="+token+"&user_email="+email, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				try {
					tmp = JSON.parse(xhr.responseText);
					_experiments = {};
					for(i in tmp){
						_experiments[tmp[i].id] = {
							'id':tmp[i].id,
							'name':tmp[i].name,
							'custom_fields':tmp[i].custom_fields,
							'directions_to_collaborators':tmp[i].directions_to_collaborators,
							'lead':tmp[i].lead,
							'medium_image_url':tmp[i].medium_image_url,
							'description':tmp[i].description,
							'protocols_ids':tmp[i].protocols_ids,
							'slug':tmp[i].slug
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
				SaveToStorage('cached_experiments',_experiments,function(){
					GetProjectsFromCache();
				});
				WriteMessage('Experiment list updated','info');
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
			$('#QuickMeasurementProtocol optgroup[label="PhotosynQ Protocols"]').empty();
			
			for(var i in _protocols){
				$('#QuickMeasurementProtocol optgroup[label="PhotosynQ Protocols"]').append('<option value="'+i+'" title="'+_protocols[i].description+'">'+_protocols[i].name+'</option>');
			}
	
			//var sortedProtocols = $("#QuickMeasurementProtocol option").sort(sortingAZ)
			//$("#QuickMeasurementProtocol").empty().append( sortedProtocols );
		}
		else{
			WriteMessage('No Protocols cached. Connect to the internet to update your list.','warning')
		}
		
		if(response['cached_userprotocols'] !== undefined){
			try {
				_userprotocols = JSON.parse(response['cached_userprotocols']);
			} catch (e) {
				RemoveFromStorage('cached_userprotocols');
				WriteMessage('Cached user protocols have wrong format','danger');
				return;
			}
			$('#QuickMeasurementProtocol optgroup[label="Your Protocols"]').empty();

			for(var i in _userprotocols){
				$('#QuickMeasurementProtocol optgroup[label="Your Protocols"]').append('<option value="user_'+i+'" title="'+_userprotocols[i].description+'">'+_userprotocols[i].name+'</option>');
			}
			
		}
		
		chrome.storage.local.getBytesInUse(['cached_protocols','cached_userprotocols'], function(response){
			$('#ProtocolStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
		});
		
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
		xhr.open("GET", "http://photosynq.venturit.net/api/v1/protocols.json?user_token="+token+"&user_email="+email, true);
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
	xhr.open("GET", "http://photosynq.venturit.net/api/v1/macros.json?user_token="+token+"&user_email="+email, true);
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
			SaveToStorage('cached_macros', _macros,function(){});
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
	var project_id = SelectedProject;
	var data = ResultString;
	if(!navigator.onLine && (token != null && email != null && project_id != null && data != '')){
		PushDataToStorage(email,project_id,data)
	}
	if(navigator.onLine && (token != null && email != null && project_id != null && data != '')){
		$('#CurrentInternetConnectionIndicator').removeClass('fa-cloud').addClass('fa-cloud-upload');
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://photosynq.venturit.net/api/v1/projects/"+project_id+"/data.json", true);
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
		try {
			experiment_data = JSON.parse(response['cached_data']);
		} catch (e) {
			RemoveFromStorage('cached_data');
			WriteMessage('Cached data has wrong format ('+e.message+')','danger');
			return;
		}
		if(experiment_data[email] === undefined)
			experiment_data[email] = {}
		if(experiment_data[email][project_id] === undefined)
			experiment_data[email][project_id] = []
		experiment_data[email][project_id].push(data);
		SaveToStorage('cached_data',experiment_data, function(){
			WriteMessage('Measurement cached','info');		
		});
	});
}


// ===============================================================================================
// 						Push data from storage to database
// ===============================================================================================
function PushData(cacheProjectID, token, email, experiment_data, i, callback){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://photosynq.venturit.net/api/v1/projects/"+cacheProjectID+"/data.json", true);
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
							
						}
					}
				} catch (e) {
					console.log(e);
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
	if(_media[location] !== undefined && _media[location][url] != undefined){
		callback('<img src="'+_media[location][url]+'">');
	}	
	else{
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'blob';
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4){
				if(xhr.response !== null && xhr.response !== undefined){
					SaveImgToLocalStorage(location,url,window.URL.createObjectURL(xhr.response));
					callback('<img src="'+window.URL.createObjectURL(xhr.response)+'">');
				}
			}
		}
		xhr.open('GET', url, true);
		xhr.send();
	}
};


// ===============================================================================================
//									Sort dropdown menu
// ===============================================================================================
function sortingAZ(a,b) {
	if (a.text > b.text) 
		return 1;
	else if (a.text < b.text) 
		return -1;
	else 
		return 0
}