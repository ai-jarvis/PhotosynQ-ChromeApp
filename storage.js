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
		
		if(result['measurement_tmp'] === undefined)
			WriteMessage('There is no measurement saved','warning')
		else{
			ResultString = "";
	
			try {
			  ResultString = JSON.parse(result['measurement_tmp']);
			} catch (e) {
			  	DiscardMeasurement();
			  	$('#SubNavigation a[href="#ProjectTab"]').tab('show');
			  	$('#MainDisplayContainer').css('background-image', 'none');
				$('#SubDisplayContainer').prop('contenteditable', true);
				$('#PlotsContainer').append(result['measurement_tmp'].replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'));
				WriteMessage('Data was corrupted, please fix manually.','danger');
				return;
			}		
			$('#PlotsContainer').empty();
			$('#SaveMeasurementToFile').show();
			$('#MeasurementMenu').show();
			plot(ResultString);
		}
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
			$('#DatabaseSignedInLink, #ViewMyProfileBtn').attr('href',_authentication.user.profile_url);
			DatabaseGetImage('avatar',_authentication.user.thumb_url,function(img){
				$('#LoginUserAvatar').attr('src',img.src);
			});
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
//						Load notification settings from storage
// ===============================================================================================
function LoadMuteNotificationFromStorage(){
	chrome.storage.local.get('MuteNotifications', function(result){
		if(result['MuteNotifications'] !== undefined){
			_muteMessages = result['MuteNotifications'];
			if(!_muteMessages){
				$('#MuteAllNotifications small').html('<i class="fa fa-toggle-on"></i> Show popup notifications');
			}
			else if(_muteMessages){
				$('#MuteAllNotifications small').html('<i class="fa fa-toggle-off"></i> Show popup notifications');
			}
		}
		else{
			var store = {}; 
			store['MuteNotifications'] = _muteMessages;
			chrome.storage.local.set(store);
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
				_media = $.extend(true, {}, JSON.parse(result['media']) );
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
			if($('#port-picker option[value="'+port_request['path']+'"]').length > 0 && $('#port-picker option').length > 0){
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
	if(_projects[id] !== undefined){
		$('#MainDisplayContainer').css('background-image', 'none');
		
		/** Add project title **/
		var html = '<div class="col-md-12"><legend>'+_projects[id].name+'</legend></div>';
		
		/** Add project lead and link to website **/
		html += '<div class="col-md-5 col-lg-4">'
			+'<div class="media">'
			+'<a href="'+_projects[id].lead.profile_url+'" class="pull-left" id="LeadAvatar" target="_blank">'
			+'<img src="img/thumb_missing.png" class="media-object img-circle" style="width:64px; height:64px">'
			+'</a>'
			+'<div class="media-body">'
			+'<h4 class="media-heading">'+_projects[id].lead.name+'</h4>'
			+'<small class="text-muted">'
			//+'<i class="fa fa-envelope-o text-success"></i> '+_projects[id].lead.email
			//+'<br>'
			+_projects[id].lead.institute
			+'<br>'
			+'<strong class="text-primary">'+_projects[id].lead.data_count+'</strong> Contributions'
			+'</small>'
			+'</div>'
			+'<hr>'
			+'<h4 class="text-primary">'+_projects[id].data_count+' <small>Measurements</small></h4>'
		
			var lastactivity = ' 1 minute ago'
			var timediff = Date.now() - new Date(_projects[id].update)
			if(timediff < 36e5)
				lastactivity = Math.floor(timediff % 36e5 / 60000) +' minute'
			else if(timediff < 864e5)
				lastactivity =  Math.floor(timediff % 864e5 / 36e5) +' hour'
			else if(timediff < 2.62974e9)
				lastactivity =  Math.floor(timediff / 864e5) +' day'
			else if(timediff < 3.156e10)
				lastactivity =  Math.floor(timediff / 2.62974e9) +' month'
			else if(timediff < 3.156e10)
				lastactivity =  Math.floor(timediff / 3.156e+10) +' year'
			
			if(parseInt(lastactivity) > 1)
				lastactivity += 's'
			lastactivity += ' ago'
				
			
		html += '<h5 class="text-primary">Latest Activity <small>'+ lastactivity +'</small></h5>'
			+'<hr>'
			+'<div class="btn-group btn-group-justified">'
			+'<div class="btn-group">'
			+'<a class="btn btn-link" href="'+_projects[id].url+'/explore_data" target="_blank" title="View collected data on photosynq"><i class="fa fa-line-chart"></i> Explore data</a>'
			+'</div>'
			+'<div class="btn-group">'
			+'<a class="btn btn-link text-left" href="'+_projects[id].url+'" target="_blank" title="View the project on photosynq"><i class="fa fa-flask"></i> View project</a>'
			+'</div>'
			+'</div>'

			+'<div class="btn-group btn-group-justified">'
			+'<div class="btn-group btn-group-lg">'
			+'<a class="btn btn-link" href="https://twitter.com/intent/tweet?url='+_projects[id].url+'" target="_blank" title="Share this project on twitter"><i class="fa fa-twitter"></i></a>'
			+'</div>'
			+'<div class="btn-group btn-group-lg">'
			+'<a class="btn btn-link text-left" href="https://plus.google.com/share?url='+_projects[id].url+'" target="_blank" title="Share this project on google+"><i class="fa fa-google-plus-square"></i></a>'
			+'</div>'
			+'<div class="btn-group btn-group-lg">'
			+'<a class="btn btn-link text-left" href="http://www.facebook.com/sharer/sharer.php?u='+_projects[id].url+'" target="_blank" title="Share this project on facebook"><i class="fa fa-facebook-square"></i></a>'
			+'</div>'
			+'</div>'
			
			+'</div>'
			+'<hr>'
			
			/** Add scripts and descriptions **/
			html += '<h4>Protocols</h4>'
			+'<dl>'
			for(ii in _projects[id].protocols_ids){
				html += '<dt>'+_protocols[_projects[id].protocols_ids[ii]].name+'</dt>';
				html += '<dd class="text-muted"><small>'+_protocols[_projects[id].protocols_ids[ii]].description+'</small></dd>';
			}
			html += '</dl>'
		html += '</div>';
		
		/** Adding project directions and description **/
		html += '<div class="col-md-7 col-lg-8">'
			+'<blockquote style="font-size:14px">'+_projects[id].directions_to_collaborators+'</blockquote>'
			+'<h4>About</h4>'
			+'<div class="text-justify" id="ProjectAboutSection">'
			//+'<div id="ImageSpacer" class="pull-right" style="padding-left:10px;"></div>'
			+ _projects[id].description
			+'</div>'
		+'</div>';		
		
		$('#PlotsContainer').append(html);
		
		DatabaseGetImage('project',_projects[id].image_url,function(img){
			$('#ProjectAboutSection').prepend('<img src="'+img.src+'" class="pull-left img-rounded" style="margin-right:10px; width:40%">');
			
		});
		
		DatabaseGetImage('avatar',_projects[id].lead.thumb_url,function(img){
			$('#LeadAvatar img').attr("src", img.src);
		});


	
		if($('#CheckBoxRememberAnswers:checked').length == 1)
			return

		_SelectedProject = _projects[id].id;
		var html = '';
		// Set up User Questions here...
		for(question in _projects[id].custom_fields){
			if(_projects[id].custom_fields[question].label == "")
				continue;
			if(_projects[id].custom_fields[question].value_type == 1 && _projects[id].custom_fields[question].value !== ""){
				html += '<div class="form-group">';
				html += '<label for="answer_'+_projects[id].custom_fields[question].id+'">'+_projects[id].custom_fields[question].label+'</label>';
				html += '<select class="form-control" id="answer_'+_projects[id].custom_fields[question].id+'">'
				html += '<option value="">Your answer</option>';
				var values = _projects[id].custom_fields[question].value.split(',');
				
				for(answerstring in values){
					if(values[answerstring].trim().length > 0)
						html += '<option value="'+values[answerstring].trim()+'">'+values[answerstring].trim()+'</option>';
				}
				html += '</select>';
				html += '</div>';
			}
			else if(_projects[id].custom_fields[question].value_type == 2){
				html += '<div class="form-group">';
				html += '<label for="answer_'+_projects[id].custom_fields[question].id+'">'+_projects[id].custom_fields[question].label+'</label>';
				html += '<input type="text" class="form-control" id="answer_'+_projects[id].custom_fields[question].id+'" placeholder="Your answer" maxlength="100">'
				html += '</div>';
			}
		}
		$('#UserAnswers').html(html);
	}
	else{
		_SelectedProject = null;
		WriteMessage('Project not found.','danger');
	}
};


// ===============================================================================================
// Empty local storage
// ===============================================================================================
function EmptyStorage(){
	chrome.storage.local.clear(function(){
		WriteMessage('Cache empty.','info')
	});
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

			/* Keys to skip */
			var skip = ['data_raw','HTML','Macro','GraphType','protocol_id','ConsoleInput']		
	
			/* Collect data for tables to display */
			var readabledata = '';
			var RawDataHeader = {};
			var MacroDataHeader = {};
			var RawDataProtocol = {};
			var MaxRawDataLen = 0;
			for(var i in ResultString['sample']){
				for(var v in ResultString['sample'][i]){
					if(ResultString['sample'][i][v].data_raw !== undefined && ResultString['sample'][i][v].data_raw != ""){
						if(RawDataHeader[v] === undefined)
							RawDataHeader[v] = []
						RawDataHeader[v].push('"#'+(+i+1)+'"');
						if(RawDataProtocol[v] === undefined)
							RawDataProtocol[v] = []
						RawDataProtocol[v].push([i,v]);
						if(MaxRawDataLen < ResultString['sample'][i][v].data_raw.length)
							MaxRawDataLen = ResultString['sample'][i][v].data_raw.length
					}
					if(i>0)
						continue;
					for(var_name in ResultString['sample'][i][v]){
						if(MacroDataHeader[v] === undefined)
							MacroDataHeader[v] = []
						if(MacroDataHeader[v].indexOf(var_name) === -1)
							MacroDataHeader[v].push(var_name);
					}
					if(MacroArray[i] !== undefined){
						if( MacroArray[i][v] !== undefined){
							for(var_name in MacroArray[i][v]){
								if(MacroDataHeader[v] === undefined)
									MacroDataHeader[v] = []
								if(MacroDataHeader[v].indexOf(var_name) === -1)
									MacroDataHeader[v].push(var_name);
							}
						}
					}
				}
			}
			
			readabledata += 'Measurement\n'
			readabledata += '--------------------------------------------------------------------------\n';			
			readabledata += 'Recorded: ' + new Date(ResultString.time).toLocaleString()+ '\n'
			readabledata +=  '\n'

			
			if(ResultString.notes !== undefined){
				if(ResultString.notes != ""){
					readabledata += 'Notes\n'
					readabledata += '--------------------------------------------------------------------------\n';			
					readabledata += ResultString.notes+ '\n\n'
				}
			}
			
			for(protocol in MacroDataHeader){
				var protocol_id = ResultString['sample'][0][v].protocol_id || false
				var protocol_name = 'Unknown'
				if(protocol_id && _protocols[protocol_id])
					protocol_name = _protocols[protocol_id].name || 'Unknown'
				readabledata += 'Data for "'+ protocol_name +'" (tab delimited)\n'
				readabledata += '--------------------------------------------------------------------------\n';
				for(key in MacroDataHeader[protocol]){
					if(skip.indexOf(MacroDataHeader[protocol][key]) !== -1)
						continue;			
					readabledata += MacroDataHeader[protocol][key]+'\t';
				}
				readabledata += '\n'
		
				for(i in ResultString['sample']){
					for(key in MacroDataHeader[protocol]){
						if(skip.indexOf(MacroDataHeader[protocol][key]) !== -1)
							continue;	
						if(MacroDataHeader[protocol][key] == 'time')
							readabledata += (parseInt(ResultString['sample'][i][protocol][MacroDataHeader[protocol][key]]) - parseInt(ResultString.time)) + '\t'
				
						else if(ResultString['sample'][i][protocol][MacroDataHeader[protocol][key]] !== undefined)
							readabledata += ResultString['sample'][i][protocol][MacroDataHeader[protocol][key]] + '\t'
					
						else if(MacroArray[i][protocol][MacroDataHeader[protocol][key]] !== undefined)
							readabledata += MacroArray[i][protocol][MacroDataHeader[protocol][key]] + '\t'
					}
					readabledata += '\n'
				}
				readabledata += '\n'
			}
	
			/* Insert transposed raw traces */
			if(MaxRawDataLen > 0){
	
				readabledata += 'Raw traces (tab delimited)\n'
				readabledata += '--------------------------------------------------------------------------\n';

				/* Add protocol names header */
				for(j in RawDataProtocol){
					var protocol_id = ResultString['sample'][0][j].protocol_id || false
					var protocol_name = 'Unknown'
					if(protocol_id && _protocols[protocol_id])
						protocol_name = _protocols[protocol_id].name || 'Unknown'
					readabledata += protocol_name +'\t'
					for(k=0;k<RawDataHeader[j].length-1;k++)
						readabledata +='\t';
				}
				readabledata +='\n'
				
				/* Add data_raw header */
				var RawDataHeaders = []
				for(j in RawDataProtocol)
					RawDataHeaders.push(RawDataHeader[j].join('\t'));
				readabledata += RawDataHeaders.join('\t') + '\n'

				/* Add transposed data_raw */
				var line = [];
				var point = ""
				for(i=0;i<MaxRawDataLen;i++){
					for(j in RawDataProtocol){
						for(var k in RawDataProtocol[j]){
							point = ResultString['sample'][RawDataProtocol[j][k][0]][RawDataProtocol[j][k][1]].data_raw[i];
							if(point !== undefined)
								line.push( point )
							else
								line.push("");
						}
					}
					readabledata += line.join('\t') + '\n';
					line = [];
					point = "";
				}
				readabledata +='\n'
			}

			if(ResultString.ConsoleInput !== undefined){
				readabledata += 'Console Input\n'
				readabledata += '--------------------------------------------------------------------------\n';
				readabledata += ResultString.ConsoleInput;
				readabledata += '\n\n';
				delete ResultString.ConsoleInput;
			}
	
			readabledata += 'Device Output\n'
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
		
		if(_media[location] === undefined)
			_media[location] = {}
		_media[location][url] = imgencoded;        

		SaveToStorage('media',_media,function(){
			chrome.storage.local.getBytesInUse('media', function(response){
				$('#MediaStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
			});	
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
//							Load data from previously saved file
// ===============================================================================================
function loadFileEntry(chosenEntry) {
	chosenEntry.file(function(file) {
		readAsText(chosenEntry, function(result) {
			var FileRows = result.split('\n');
			var LineSkip = true;
			for(i in FileRows){
			
				if(FileRows[i] == 'Raw Data Output')
					LineSkip = true;
			
				if(FileRows[i][0] !== '{' && LineSkip)
					continue;
					
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
							post['protocols'] = [];
							post['macros'] = [];
							post['plottype'] = 'post';
							for(i in filedata.sample){
								for(ii in filedata.sample[i]){
									if(filedata.sample[i][ii].protocol_id !== undefined && filedata.sample[i][ii].protocol_id != ""){									
										if(_protocols[filedata.sample[i][ii].protocol_id] !== undefined){
											post['protocols'][filedata.sample[i][ii].protocol_id] = _protocols[filedata.sample[i][ii].protocol_id]

											if(_protocols[filedata.sample[i][ii].protocol_id].macro_id !== undefined){
												if(_macros[_protocols[filedata.sample[i][ii].protocol_id].macro_id] !== undefined)
													post['macros'][_protocols[filedata.sample[i][ii].protocol_id].macro_id] = _macros[_protocols[filedata.sample[i][ii].protocol_id].macro_id]
											}									
										}
									}
									
									if(filedata.sample[i][ii].macro_id !== undefined && filedata.sample[i][ii].macro_id != ""){
										if(_macros[filedata.sample[i][ii].macro_id].id !== undefined)
											post['macros'][filedata.sample[i][ii].macro_id] = _macros[filedata.sample[i][ii].macro_id]
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