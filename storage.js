// ===============================================================================================
//						Save data to storage, provide id and data as json
// ===============================================================================================
function SaveToStorage(id,data,callback){
    var jsonfile = {};
	try {
		jsonfile[id] = JSON.stringify(data);
	} catch (e) {
		WriteMessage(id+' has wrong format.','danger');
		return;
	}	    
    callback(chrome.storage.local.set(jsonfile));
}

// ===============================================================================================
//						Save measurement temporarily to local storage
// ===============================================================================================
function SaveOutputToStorage(data){
    var jsonfile = {};
	jsonfile['measurement_tmp'] = data;
    chrome.storage.local.set(jsonfile);
}



// ===============================================================================================
//						Save measurement temporarily to local storage
// ===============================================================================================
function GetOutputFROMStorage(){
	chrome.storage.local.get('measurement_tmp', function(result){
		console.log(result['measurement_tmp']);
	});
}

// ===============================================================================================
//						Remove entry from storage by id
// ===============================================================================================
function RemoveFromStorage(id) {
	chrome.storage.local.remove(id, function(){});
}


// ===============================================================================================
//						Load authentication from storage for automatic login
// ===============================================================================================
function LoadAuthentificationFromStorage() {
	chrome.storage.local.get('authentication', function(result){
		if(result['authentication'] != undefined){
			try {
				_authentication = JSON.parse(result['authentication']);
			} catch (e) {
				RemoveFromStorage('authentication');
				WriteMessage('Stored authentication has wrong format.','danger');
				return;
			}			
			$('#DatabaseSignedIn').show();
			$('#DatabaseSignInState').toggleClass('text-muted fa-inverse').attr('title', 'Signed in as '+_authentication.name);
			$('#DatabaseSignedInUser').text(_authentication.name)
			$('#DatabaseSignedInEmail').text(_authentication.email)
			$('#DatabaseSignInForm').hide();
			$('#DatabaseSignedInLink').attr('href','http://photosynq.venturit.net/users/'+_authentication.name.toLowerCase());
			GetProjectsFromDB(_authentication.auth_token,_authentication.email);
			GetProtocolsFromDB(_authentication.auth_token,_authentication.email);
			GetMacrosFromDB(_authentication.auth_token,_authentication.email);
			DatabaseAddDataToProjectFROMStorage(_authentication.auth_token,_authentication.email);			
		}
		else{
			_authentication = null;
		}
	});
}

// ===============================================================================================
//						Load media from storage
// ===============================================================================================
function LoadMediaFromStorage() {
	chrome.storage.local.get('media', function(result){
		if(result['media'] != undefined){
			try {
				_media = JSON.parse(result['media']);
			} catch (e) {
				RemoveFromStorage('media');
				WriteMessage('Stored media has wrong format.','danger');
				return;
			}
			chrome.storage.local.getBytesInUse('media', function(response){
				$('#MediaStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});		
		}
	});
}

// ===============================================================================================
//						Load port name from storage to connect to known device
// ===============================================================================================
function LoadPortNameFromStorage() {
	chrome.storage.local.get('com_port', function(result){
		if(result['com_port'] != undefined){
			try {
				var port_request = JSON.parse(result['com_port']);	
			} catch (e) {
				RemoveFromStorage('com_port');
				WriteMessage('Stored com port has wrong format.','danger');
				return;
			}
			if($('#port-picker option[value="'+port_request['path']+'"]').length > 0){
				$('#port-picker option[value="'+port_request['path']+'"]').prop('selected', true);
				$('#ConnectBtn').click();
			}
		}
	});	
	
}


// ===============================================================================================
//					Set up question/answers and variables when project is selected
// ===============================================================================================
function SelectProject(id) {
	DiscardMeasurement();
	chrome.storage.local.get('cached_experiments', function(response){
		if(response['cached_experiments'] !== undefined){
			try {
				var experiments = JSON.parse(response['cached_experiments']);
			} catch (e) {
				RemoveFromStorage('cached_experiments');
				WriteMessage('Stored projects have the wrong format.','danger');
				return;
			}				
			if(experiments[id] !== undefined){
				$('#MainDisplayContainer .panel-body').css('background-image', 'none');
				
				/** Add project title **/
				var html = '<div class="col-md-12"><legend>'+experiments[id].name+'</legend></div>';
				
				/** Add project lead and link to website **/
				html += '<div class="col-md-8">'
					+'<div class="media">'
					+'<a href="http://photosynq.venturit.net/users/'+experiments[id].lead.slug+'" class="pull-left" id="LeadAvatar" target="_blank"></a>'
					+'<div class="media-body">'
					+'<h4 class="media-heading">'+experiments[id].lead.name+'</h4>'
					+ experiments[id].lead.email
					+'</div>'
					+'</div>'
					+'</div>'
					+'<div class="col-md-4">'
					+'<a class="btn btn-default btn-sm" href="http://photosynq.venturit.net/projects/'+experiments[id].slug+'" target="_blank">View project on website</a>'
					+'</div>'

				/** Adding project directions **/
				html += '<div class="col-md-12">'
					+'<hr>'
					+'<h4>Measurement directions</h4>'
					+'<p class="bg-warning">'+experiments[id].directions_to_collaborators+'</p>'
					+'</div>';

				/** Add project description **/
				html += '<div class="col-md-12">'
					+'<hr>'
					+'<h4>About</h4>'
					+'<div id="ImageSpacer" class="pull-right" style="padding-left:10px;"></div>'
					+ experiments[id].description
					+'</div>'
					
				/** Add scripts and descriptions **/
				html += '<div class="col-md-12">'
					+'<hr>'
					+'<h4>Protocols</h4>'
					+'<dl>'
					for(ii in experiments[id].protocols_ids){
						html += '<dt>'+_protocols[experiments[id].protocols_ids[ii]].name+'</dt>';
						html += '<dd class="text-muted">'+_protocols[experiments[id].protocols_ids[ii]].description+'</dd>';
					}
					html += '</dl>'
					+'</div>';
				
				$('#PlotsContainer').append(html);
				
				DatabaseGetImage('project',experiments[id].medium_image_url,function(img){
					$('#ImageSpacer').html(img.img);
					$('#ImageSpacer img').addClass('img-thumbnail')
				});
				DatabaseGetImage('avatar',experiments[id].image_file_name,function(img){
					$('#LeadAvatar').html(img.img);
				});

				$('#LeadAvatar').html('<img src="img/thumb_missing.png">')
				
				if($('#CheckBoxRememberAnswers:checked').length == 1)
					return

				SelectedProject = experiments[id].id;
				var html = '';
				// Set up User Questions here...
				for(question in experiments[id].custom_fields){
					if(experiments[id].custom_fields[question].value !== ""){
						html += '<div class="form-group">';
						html += '<label for="answer_'+experiments[id].custom_fields[question].id+'">'+experiments[id].custom_fields[question].label+'</label>';
						html += '<select class="form-control" id="answer_'+experiments[id].custom_fields[question].id+'">'
						html += '<option value="">Your answer</option>';
						var values = experiments[id].custom_fields[question].value.split(',');
						
						for(answerstring in values){
							if(values[answerstring].trim().length > 0)
								html += '<option value="'+values[answerstring].trim()+'">'+values[answerstring].trim()+'</option>';
						}
						html += '</select>';
						html += '</div>';
					}
				}
				$('#UserAnswers').html(html);
			}
		}
		else{
			SelectedProject = null;
			WriteMessage('Project couldn\'t be loaded.','info')
		}
	});
};


// ===============================================================================================
//							Empty local storage... console only
// ===============================================================================================
function EmptyStorage(){
	chrome.storage.local.clear(function(){})
}


// ===============================================================================================
//							Error handler for save file dialog
// ===============================================================================================
function errorHandler(e) {
  console.error(e);
  WriteMessage('File saved.','danger');
}


// ===============================================================================================
//						Save data from quick/console measurement to text-file
// ===============================================================================================
function SaveDataToFile(){
	var timestamp = append_file_time();
	chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: 'PhotosynQ_'+timestamp+'.txt', accepts: [{extensions: ['txt']}] }, function(writableFileEntry) {
		if(!writableFileEntry)
			return;
		writableFileEntry.createWriter(function(writer) {
		  writer.onerror = function(e) {
			WriteMessage('Textfile couldn\'t be saved', 'danger');
		  };
		  writer.onwrite = function(e) {
		  	writer.onwrite = null;
			writer.truncate(writer.position);
		  	$('#SaveQuickMeasurementToFile,#SaveConsoleMeasurementToFile').blur();
			WriteMessage('File saved.','success');
		  };
		  if(ResultString !== null){
			var readabledata = '';
			for(var i in ResultString['sample']){
				for(var m in ResultString['sample'][i]){
					readabledata += ResultString['sample'][i][m]['protocol_name']+'\n'
					readabledata += '--------------------------------------------------------------------------\n';
					for(var v in ResultString['sample'][i][m]){
						if(v == 'time'){
							readabledata += readable_time(parseInt(ResultString['sample'][i][m][v])) +'\n--\n';
						}
						readabledata += v+': '+ResultString['sample'][i][m][v]+'\n';
					}
					readabledata += '--\n';
					if(MacroArray[m] !== undefined){
						for(var v in MacroArray[m]){
							readabledata += v+': '+MacroArray[m][v]+'\n';
						}
					}
					readabledata += '\n\n';
				}
			}

			readabledata += 'Data (tab delimited)\n'
			readabledata += '--------------------------------------------------------------------------\n';
			for(var m in ResultString['sample'][0]){
				for(var v in ResultString['sample'][i][m]){
					if(v == 'time'){
							readabledata += 'Date & Time';
							readabledata += '\ttime [ms]';
					}
					else if(v !== 'protocol_name')
						readabledata += '\t'+v;
				}
			}

			readabledata +='\n'
			for(var i in ResultString['sample']){
				for(var m in ResultString['sample'][i]){
					for(var v in ResultString['sample'][i][m]){
						if(v == 'time'){
							readabledata += readable_time(parseInt(ResultString['sample'][i][m][v]));
							readabledata +='\t'+ (ResultString['sample'][i][m][v] - ResultString.time)
						}
						else if(v !== 'protocol_name')
						readabledata += '\t'+ResultString['sample'][i][m][v];
					}
					if(MacroArray[m] !== undefined){
						for(var v in MacroArray[m]){
							var macroValue = new String(MacroArray[m][v]);
							if(macroValue.match(/No macro available/g))
								readabledata += '\t';
							else
								readabledata += '\t'+macroValue;
						}
					}
					readabledata += '\n';
				}
			}
			readabledata += '\n';

			if(ResultString.ConsoleInput !== undefined){
				readabledata += 'Console Input\n'
				readabledata += '--------------------------------------------------------------------------\n';
				readabledata += ResultString.ConsoleInput;
				readabledata += '\n\n';
				delete ResultString.ConsoleInput;
			}
			
			readabledata += 'Raw Data Output\n'
			readabledata += '--------------------------------------------------------------------------\n';
			readabledata += JSON.stringify(ResultString);
		  	writer.write(new Blob([readabledata], {type: 'text/plain'}));
		  }
		  else
		  	writer.write(new Blob(['Error receiving the data from the instrument.'], {type: 'text/plain'}));
		}, errorHandler);
	});
}

// ===============================================================================================
//						Save graph to file
// ===============================================================================================
function SaveImgToLocalStorage(location,url,urlData){
	var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        var imgencoded = canvas.toDataURL('image/png');
		chrome.storage.local.get('media', function(result){
			if(result['media'] !== undefined){
				try {
					_media = JSON.parse(result['media']);
					if(_media[location] === undefined)
						_media[location] = {}
					_media[location][url] = imgencoded;
					SaveToStorage('media',_media, function(){
						chrome.storage.local.getBytesInUse('media', function(response){
							$('#MediaStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
						});	
					});
				} catch (e) {
					RemoveFromStorage('media');
					WriteMessage('Stored media port has wrong format.','danger');
					return;
				}
				
			}else{
				if(_media[location] === undefined)
					_media[location] = {}
				_media[location][url] = imgencoded;
				SaveToStorage('media',_media,function(){
					chrome.storage.local.getBytesInUse('media', function(response){
						$('#MediaStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
					});	
				});
			}
		});
        canvas = null; 
    };
    img.src = urlData;
}

// ===============================================================================================
//							Append time to suggested filename
// ===============================================================================================
function append_file_time(){
	var timestamp = new Date();
	str = '';
	str += '_'+timestamp.getFullYear();
	str += '-'+ (timestamp.getMonth() + 1);
	str += '-'+timestamp.getDate();
	str += '@'+timestamp.getHours();
	str += '-'+timestamp.getMinutes();
	str += '-'+timestamp.getSeconds();
	return str;
}


// ===============================================================================================
//					Generate human readable date/time information from timestamp
// ===============================================================================================
function readable_time(currentdate){
	var timezone = '';
	var offset = 'h';
	if(!isNaN(offset)){
		currentdate = parseInt(currentdate) + (offset*60*1000);
		var UTC = parseInt(offset/60)
		timezone = ' (UTC' + (( UTC > 0) ? '+'+UTC : UTC) +':00)';
	}
	var readableDate = new Date(parseInt(currentdate));
	return readableDate.toLocaleString()+timezone;	
}


// ===============================================================================================
//							Discard measurement and remove all plots
// ===============================================================================================
function DiscardMeasurement(){
	EnableInputs();
	$('#MeasurementMenu, #SaveMeasurementToFile, #SaveMeasurementToDB').hide();
	$('#PlotsContainer,#TransientPlotsContainer').empty();
	$('#TransientPlotsContainer').css('min-height','0px');
	$('#MainDisplayContainer .panel-body').css('background-image', 'url(\'img/containerbackground.png\')');
	$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
	ProgressBar(0, 0);
	$(window).trigger('resize');
	MeasurementType = null;
	ProtocolArray = null;
	QuickMeasurementProtocol = null;
	QuickMeasurement = null;
	ResultString = null;
	MacroArray = null;
	_terminate = false;
	serialBuffer = '';
	dataRead = '';
	RemoveFromStorage('measurement_tmp');
}

// ===============================================================================================
//							Load data from previously saved file
// ===============================================================================================
function loadFileEntry(_chosenEntry) {
	chosenEntry = _chosenEntry;
	chosenEntry.file(function(file) {
		readAsText(chosenEntry, function(result) {
			var FileRows = result.split('\n');
			for(i in FileRows){
				try{
					var filedata = JSON.parse(FileRows[i]);
					chrome.app.window.create('DataViewer.html', {
						id: "dataview"+ new Date(),
						bounds: {
						top: 0,
						left: 0,
						width: 800,
						height: 600
					},
					minHeight: 360,
					minWidth: 400
					}, 
					function (ProtocolWindow){
						ProtocolWindow.contentWindow.addEventListener('load', function(e) {
							var post = {}
							post['filedata'] = filedata;
							post['used_protocols'] = [];
							post['protocols'] = [];
							post['macros'] = [];
							for(i in filedata.sample){
								for(ii in filedata.sample[i]){
									if(filedata.sample[i][ii].protocol_id !== undefined && filedata.sample[i][ii].protocol_id != ""){									
										post['used_protocols'].push(filedata.sample[i][ii].protocol_id)
										if(_protocols[filedata.sample[i][ii].protocol_id] !== undefined)
											post['protocols'][filedata.sample[i][ii].protocol_id] = _protocols[filedata.sample[i][ii].protocol_id]
										if(_macros[_protocols[filedata.sample[i][ii].protocol_id].macro_id] !== undefined)
											post['macros'][_protocols[filedata.sample[i][ii].protocol_id].macro_id] = _macros[_protocols[filedata.sample[i][ii].protocol_id].macro_id]
									}
								}
							}
							post['file'] = chosenEntry.fullPath;
							ProtocolWindow.contentWindow.postMessage(post, '*');
						});
					});
				}
				catch(e){
					//console.log(e);
				}
			}
		});
	});
}

// ===============================================================================================
//							Read file content as text
// ===============================================================================================
function readAsText(fileEntry, callback) {
	fileEntry.file(function(file) {
		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onload = function(e) {
			callback(e.target.result);
		};
		reader.readAsText(file);
	});
}