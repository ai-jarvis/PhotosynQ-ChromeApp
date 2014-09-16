// ===============================================================================================
// 					Initial Parameters
// ===============================================================================================
var connectionId = [-1];
var deviceConnected = [false];
var port_os;
var port_path;
var MeasurementType = null;
var QuickMeasurementProtocol, QuickMeasurement, ResultString, MacroArray, ProtocolArray;
var ShowTansientgraph = true;
var dataRead = '';
var dataSave = '';
var protocol;
var SelectedProject = null;
var _authentication;
var _geolocation = false;
var _protocols = {};
var _userprotocols = {};
var _projects = [];
var _macros = [];
var _media = {};
var _given_answers = [];
var _DevicesSetup = {}


// ===============================================================================================
// 					Logic to read and process incoming data
// ===============================================================================================
function onCharRead(readInfo) {
    if (!connectionId)
		return;

    if (readInfo.connectionId !== connectionId)
    	return;
    	
	var str = ab2str(readInfo.data);

	if(MeasurementType == 'database' || MeasurementType == 'quick' || MeasurementType == 'console'){
		try{
			str = str.replace(new RegExp('{', 'gi'), '{"time": '+ new Date().getTime() +', ');
			str = str.replace(new RegExp('^{', 'gi'), '{"time_offset": '+ new Date().getTimezoneOffset() +', ');
		}
		catch(e){
			console.log(e);
		}
	}

	console.log(str);
	dataRead += str;

	if(dataRead.match(/(MultispeQ Ready\r\n)/gi)){
		setStatus("MultispeQ Ready",'success');
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success').parent().attr('title','Device connected to port '+port_path);
		var SaveConnection = {}
		SaveConnection["os"] = port_os;
		SaveConnection["path"] = port_path;
		SaveToStorage('com_port',SaveConnection, function(){});
		deviceConnected = true;
		dataRead = '';
		MeasurementType = 'BackgroundBatteryCheck';
		chrome.serial.send(connectionId, str2ab('1004+'), function(){});
		$('#ConnectBtn').button('complete');
		return;
	}

	
	if(str.match(/(\r\n)/gi) && dataRead.length > 0 && (MeasurementType == 'database' || MeasurementType == 'quick' || MeasurementType == 'console') && MeasurementType != null){

		ProgressBar((parseInt($('#MeasurementProgress').attr('data-step'))+1), $('#MeasurementProgress').attr('data-total'));
		try{
			var pos = dataRead.lastIndexOf('{');
			var testeded = dataRead.slice(pos);
			testeded = testeded.split("\r\n");
			if($('#MeasurementProgress').attr('data-total') > 5 && ShowTansientgraph){
				plottransient(testeded[0]);
				
			}
		}
		catch(e){}	
	}

	if(dataRead.match(/(\r\n\r\n)$/gi) && dataRead.length > 0 && (MeasurementType == 'database' || MeasurementType == 'quick' || MeasurementType == 'console') && MeasurementType != null){
		dataRead = dataRead.trim();
		try {
		  dataRead = JSON.parse(dataRead);
		} catch (e) {
			WriteMessage('Invalid results received from device.','danger');
			return;
		}			
		dataSave = dataRead;
		EnableInputs();
		ResultString = dataRead;
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
		WriteMessage('Protocol done.','success');

		if(MeasurementType == 'database'){
			$('#SaveMeasurementToDB').show();
			ResultString['user_answers'] = _given_answers;
			if(_geolocation)
				ResultString['location'] = [_geolocation.latitude, _geolocation.longitude];
		}
		
		if(MeasurementType == 'console' || (MeasurementType == 'quick')){
			$('#SaveMeasurementToFile').show();
			SelectedProject = null;
		}

		if(MeasurementType == 'console'){
			ResultString['ConsoleInput'] = $('#ConsoleProtocolContent').val().trim();
			if(_consolemacros){
				if(ResultString.sample !== undefined){
					for(measurementID in ResultString.sample){
						for(protocolID in ResultString.sample[measurementID]){
							if(_consolemacros[protocolID] !== undefined){
								ResultString.sample[measurementID][protocolID]['macro_id'] = _consolemacros[protocolID]
							}
						}
					}
				}
				_consolemacros = false;
			}
		}

		$('#PlotsContainer').empty();
		$('#MeasurementMenu').show();
		chrome.power.releaseKeepAwake();
		plot(dataRead);
		setStatus('MultiSpeQ Ready','success');
		dataRead = '';
		MeasurementType = null;
	}	
} 
  
// ===============================================================================================
// 					Set Port info 
// ===============================================================================================
chrome.serial.onReceive.addListener(onCharRead);
chrome.runtime.getPlatformInfo(function(info) {
		port_os = info.os;
});

// ===============================================================================================
// 					Connect to selected Port
// ===============================================================================================
function onConnect(connectionInfo) {
  if (!connectionInfo) {
    setStatus('Could not open port','danger');
    $('#DeviceConnectionState').removeClass().addClass('fa fa-times text-danger').parent().attr('title','Could not open port');
    $('#ConnectBtn').button('reset');
    return;
  }
  connectionId = connectionInfo.connectionId;
  setStatus('Unknown Device','warning');
  $('#DeviceConnectionState').removeClass().addClass('fa fa-exclamation-triangle text-warning').parent().attr('title','Unknown Device');
  chrome.serial.send(connectionId, str2ab("1000+"), function(e){ });	// send 1000+ to get the answer 'MultiSpeQ Ready'
  $('#ConnectBtn').button('complete');
};

// ===============================================================================================
// 					Serial input to receive connection status -> answer 'MultispeQ Ready'
// ===============================================================================================
function CheckConnection(connectionId){
    if (!connectionId)
		return;
	chrome.serial.send(connectionId, str2ab("1000+"), function(e){ });	// send 9 to get the answer 'MultiSpeQ Ready'
}

// ===============================================================================================
// 					Change color according to port status
// ===============================================================================================
function setStatus(status,color) {
	$('#status').html(status).removeClass().addClass('label label-'+color);
}

// ===============================================================================================
// 					remove port from box
// ===============================================================================================
function removeOptions(selectbox){
	var i;
	for(i=selectbox.options.length-1;i>=0;i--)
	{
		selectbox.remove(i);
	}
}


// ===============================================================================================
// 					Build port picker menu
// ===============================================================================================
function buildPortPicker(ports) {

  var portPicker = document.getElementById('ModalProjectPorts');
  removeOptions(portPicker);

	ports.forEach(function(port) {
		var portOption = document.createElement('option');
		if(!port.path.match(/(\/dev\/cu\.)/g)){
			portOption.value = port.path;
			portOption.innerText = port.path.replace(/(\/dev\/tty\.?)/g,'');
			portPicker.appendChild(portOption);
		}
	});
  
  portPicker.onchange = function() {
    if (connectionId != -1) {
      chrome.serial.disconnect(connectionId, function(){
		$('#ConnectBtn').button('reset');
      });
    }
    $('#DeviceConnectionState').removeClass().addClass('fa fa-times text-danger').parent().attr('title','Not connected');
    setStatus('Not connected','info');
    deviceConnected = false;
  };
  
  
}

// ===============================================================================================
// 					Serial connection error handling
// ===============================================================================================
chrome.serial.onReceiveError.addListener(function(e){
	if(e.error == 'device_lost'){
		connectionId = -1;
		deviceConnected = false;
     	$('#DeviceConnectionState').removeClass().addClass('fa fa-times text-danger').parent().attr('title','Not connected');
		setStatus('Not connected','info');
		console.log(e.error)
		$('#ConnectBtn').button('reset');
	}
});


// ===============================================================================================
// 					Open port an apply settings
// ===============================================================================================
function openSelectedPort() {
	var portPicker = document.getElementById('port-picker');
	var selectedPort = portPicker.options[portPicker.selectedIndex].value;
	port_path = selectedPort;
	chrome.serial.connect(selectedPort, {bitrate: 115200}, onConnect);
}

// ===============================================================================================
// 						Fetch available Ports and built list
// ===============================================================================================
function fetchPorts(){
	chrome.serial.getDevices(function(devices) {
		buildPortPicker(devices);
	});
}

// ===============================================================================================
// 					Initialized, when app is loaded
// ===============================================================================================
onload = function() {
	
	$('#BtnAddDevice').on('click', AddDevice);
	
	$('#BtnRefreshPorts').on('click', fetchPorts);
	
	$('#DeviceControlTable').on('click', '.BtnRemoveDevice', function(){
		var i = $(this).val();
		$('#DeviceControlTable tbody tr[data-device-id="'+i+'"]').remove();
		chrome.serial.disconnect(_DevicesSetup[i].connectionID, function(){
			delete _DevicesSetup[i];
		});
	});
	
	$('#ModalConnection').on('show.bs.modal',function(){
		fetchPorts();
		for(device in _DevicesSetup){
			$('ModalProjectPorts option[value="'+ _DevicesSetup[device].Port +'"]').prop( "disabled", false );
		}
	});

	$('#ModalMeasurement').on('show.bs.modal',function(){
		$('#MeasurementProtocolList a').removeClass('active');
	});


	$('#ModalConnection, #ModalMeasurement, #ModalProject, #ModalResults').on('show.bs.modal',function(e){
		var modalID = $(this).attr('id');
		var deviceID = $(e.relatedTarget).parent().parent().parent().parent().attr('data-device-id')
		$('#'+modalID+' .modal-title small').text('Device #'+deviceID);
	});

	$('#FilterProtocolList').on('keyup', function(){
		if($(this).val() != ""){
			$("#MeasurementProtocolList a, #UserProtocolsList a").hide();
			$("#MeasurementProtocolList a:contains('"+$(this).val()+"')").show();
		}
		else
			$("#MeasurementProtocolList a").show();
		return false;
	});


	$('#MeasurementProtocolList').on('click', 'a', function(){
		if($(this).hasClass('active'))
			$(this).removeClass('active');
		else{
			$('#MeasurementProtocolList a').removeClass('active');
			$(this).addClass('active');
		}
		return false;
	});
	

	$('#BtnApplyProtocol').on('click',function(){
		var ProtocolID = $('#MeasurementProtocolList .active').attr('data-value');
		
	});
	
	// Initial app settings
	// ===============================================================================================
	fetchPorts();
	AddDevice();

	window.addEventListener('message', function(event) {
		_projects = event.data.projects;
		AddProjectList();
		_protocols = event.data.protocols;
		AddMeasurementList()
		_macros = event.data.macros;
	});

};

// ===============================================================================================
// 						Convert string to ArrayBuffer
// ===============================================================================================
function str2ab(str) {
	var buf=new ArrayBuffer(str.length);
	var bufView=new Uint8Array(buf);
	for (var i=0; i<str.length; i++) {
		bufView[i]=str.charCodeAt(i);
	}
	return buf;
}

// ===============================================================================================
// 						Convert ArrayBuffer to string
// ===============================================================================================
function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
};

// ===============================================================================================
// 						Split longer strings into chunks before send
// ===============================================================================================
function SendLongStrings(string){
	var SendDataInChunks = function(chunks) {
		chrome.serial.send(connectionId, str2ab(chunks[x]), function(){
			x++;
			if(x < chunks.length)
				SendDataInChunks(chunks);
			else if(x == chunks.length)
				return false;
		});	
	}
	var str_to_chunks = string.match(/.{1,120}/g);
	var x=0;
	SendDataInChunks(str_to_chunks);
}	

// ===============================================================================================
//						 Logic run if Regular Measurement is started
// ===============================================================================================
function DatabaseMeasurement() {
	$('#DatabaseMeasurement').blur();
	if(SelectedProject === null){
		WriteMessage('Please select a project first','warning');
		return;
	}
	
	var no_answers = false;
	_given_answers = [];
	$('#UserAnswers select option:selected').each(function(i,k){
		_given_answers.push($(k).attr('value'));
		if($(k).attr('value') === ""){
			no_answers = true;
		}
	});
	if(no_answers){
		WriteMessage('Please answer all questions first','danger');
		return false;
	}
	var protocol = [];
	if(_experiments[SelectedProject].protocols_ids !== undefined){
		for(pIds in _experiments[SelectedProject].protocols_ids){
			var pID = _experiments[SelectedProject].protocols_ids[pIds];
			if(_protocols[pID].protocol_json !== undefined){
				if(_protocols[pID].protocol_json !== ''){
					protocol.push(_protocols[pID].protocol_json);
				}
				else
					protocol.push({});
			}
		}
	}
	RunMeasurement(protocol,'database');
	return;
};

// ===============================================================================================
// 						Logic run if Quick Measurement is started
// ===============================================================================================
function QuickMeasurement() {
	var QuickMeasurementProtocol = $('#QuickMeasurementTab .list-group .active').attr('data-value');
	if(QuickMeasurementProtocol === undefined){
		WriteMessage('Select a protocol first','warning');
		return;
	}

	protocol = [];
	if(QuickMeasurementProtocol.match(/(user_)/g)){
		if(_userprotocols[QuickMeasurementProtocol.substr(5)] !== undefined)
			protocol.push(_userprotocols[QuickMeasurementProtocol.substr(5)].protocol_json);
	}
	else{
		if(_protocols[QuickMeasurementProtocol] !== undefined)
			protocol.push(_protocols[QuickMeasurementProtocol].protocol_json);
	}
	RunMeasurement(protocol,'quick')
	return;
};


// ===============================================================================================
// 									Run Measurement
// ===============================================================================================
function RunMeasurement(protocol,mtype){
	// Check Connection
	if (connectionId == -1 || !deviceConnected){
		WriteMessage('MultispeQ device not connected','danger');
		return;
	}
	
	// Check if protocol is a valid json
	var protocol_string = false;
	try {
	  protocol_string = JSON.stringify(protocol);
	} catch (e) {
		WriteMessage('Protocol has invalid format.','danger');
		return;
	}

	if(protocol == false || protocol.length == 0){
		WriteMessage('Protocol not found or empty.','danger');
		return;
	}

	// Reset variables, empty MainDisplayContainer, blur buttons
	DiscardMeasurement();
	$('#DatabaseMeasurement, #QuickMeasurement, #ConsoleProtocol').blur();
	$('#MainDisplayContainer .panel-body').css('background-image', 'none');
	
	// Check protocol and submit
	setStatus('MultiSpeQ Busy','danger');
	$('#DeviceConnectionState').removeClass().addClass('fa fa-refresh fa-spin text-success');
	ResultString = null;
	MacroArray = null;
	MeasurementType = mtype;
	dataRead = '';
	DisableInputs();
	chrome.power.requestKeepAwake('system');
	SendLongStrings(protocol_string+'!');
	$('#TransientPlotsContainer').css('min-height','55%');
	var protocol_total = protocol.length;
	var protocol_measurements = 1;
	ShowTansientgraph = true;
	for(m in protocol){
		if(protocol[m].measurements !== undefined){
			if(protocol[m].measurements > protocol_measurements)
				protocol_measurements = protocol[m].measurements;
		}
		if(protocol[m].measurements_delay !== undefined && protocol[m].measurements_delay < 1 && ShowTansientgraph)
			ShowTansientgraph = false;
	}
	protocol_total *= protocol_measurements;
	ProgressBar(1, protocol_total);
	return;
}


// ===============================================================================================
// 									Terminate or Rescue Measurement
// ===============================================================================================
function TerminateMeasurement(){
	$('#TerminateMeasurement').blur();
	chrome.serial.send(connectionId, str2ab("-1-1+"), function(){
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
		EnableInputs();
	});
}

// ===============================================================================================
// 									Display Message on screen
// ===============================================================================================
function WriteMessage(text,type){
	toastr.options = {
	  "closeButton": false,
	  "debug": false,
	  "positionClass": "toast-top-right",
	  "onclick": null,
	  "showDuration": "300",
	  "hideDuration": "1000",
	  "timeOut": "2000",
	  "extendedTimeOut": "1000",
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
	}
	if(!_muteMessages)
		show = false;
	
	var notificationbtn = $('#NotificationHistory').prev().find('.fa-bell');
	if(!notificationbtn.hasClass('fa-inverse'))
		notificationbtn.addClass('fa-inverse');
	
	html = '<li style="padding:2px 15px 2px 15px">'
	if(type == 'info'){
		html += '<i class="fa fa-info-circle text-info" style="margin-right:10px;"></i>'
		if(!_muteMessages)
			toastr.info(text)
	}
	if(type == 'warning'){
		html += '<i class="fa fa-exclamation-circle text-warning" style="margin-right:10px;"></i>'
		toastr.warning(text)
	}
	if(type == 'danger'){
		html += '<i class="fa fa-exclamation-triangle text-danger" style="margin-right:10px;"></i>'
		if(!notificationbtn.next().hasClass('fa-circle'))
			notificationbtn.parent().append('<i class="fa fa-circle text-danger" style="position:absolute; margin-left:-7px; margin-top:-2px"></i>');
		toastr.error(text)
	}
	if(type == 'success'){
		html += '<i class="fa fa-check-square text-success" style="margin-right:10px;"></i>'
		if(!_muteMessages)
			toastr.success(text)
	}
	html += '<span class="text-muted">'+text+'</span>'
	html += '<small class="text-muted pull-right" style="" data-timestamp="'+ Date.now() +'">0 sec ago</small>'
	html += '</li>'
	html += '<li class="divider"></li>'
	$('#NotificationHistory li ul').prepend(html);
	$('.toast-top-right').css('top','55px');
	
	notificationbtn.addClass("faa-ring animated").delay(1000).queue(function(){
		$(this).removeClass("faa-ring animated").dequeue();
	});
}


// ===============================================================================================
//						Display ProgressBar
// ===============================================================================================
function ProgressBar(step, total){
	var percent = (parseInt(step)/parseInt(total))*100;
	$('#MeasurementProgress').attr('data-step', step).attr('data-total', total);
	$('#MeasurementProgress .progress-bar').attr('aria-valuenow', percent).css('width', percent+'%');
	$('#MeasurementProgressStep').text(step);
	$('#MeasurementProgressTotal').text(total);
}

// ===============================================================================================
//						Disable all buttons and input fields
// ===============================================================================================
function DisableInputs(){
	$( "button, input[type='button'], select, input[type='checkbox'], textarea" ).prop( "disabled", true );
	$('#SubNavigation li').addClass('disabled');
	$('#TerminateMeasurement, #ShowOutputBtn, #RawOutputTextarea').prop( "disabled", false );
	$('#RawOutputTextarea').hide();
	$('#TerminateMeasurementMenu').show();
}

// ===============================================================================================
//						Enable all buttons and input fields
// ===============================================================================================
function EnableInputs(){
	$( "button, input[type='button'], select, input[type='checkbox'], textarea" ).prop( "disabled", false );
	$('#SubNavigation li').removeClass('disabled');
	$('#TerminateMeasurementMenu').hide();
}


function remove(arr, item) {
      for(var i = arr.length; i--;) {
          if(arr[i] === item) {
              arr.splice(i, 1);
          }
      }
  }
  
function AddDevice(){

	var nextID = false;
	for(id in _DevicesSetup)
		nextID = id
	nextID++;
	_DevicesSetup[nextID] = {'connectionID': -1, 'Port': false, 'Script': '', 'Protocol': [], 'Progress': 0, 'Active': false, 'dataRead': ''}

	var html = '';
	html += '<tr data-device-id="'+nextID+'">';
	html += '<td><strong>'+nextID+'</strong></td>';
	html += '<td>';
	html += '<span><i class="fa fa-desktop"></i><i class="fa fa-times text-danger" style="position:absolute; margin-left:-7px; margin-top:-4px"></i></span>';
	html += '<span class="text-muted" style="margin-left:10px">Com 1</span>';
	html += '</td>';
	html += '<td>';
	html += 'Phi2 Algae';
	html += '</td>';
	html += '<td style="width:200px">';
	html += '<div class="progress" style="margin:0px">';
	html += '<div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">';
	html += '<span class="sr-only">0% Complete</span>';
	html += '</div>';
	html += '</div>';
	html += '</td>';
	html += '<td>';
	html += '<div class="btn-toolbar" role="toolbar">';
	html += '<div class="btn-group btn-group-xs">';
	html += '<button type="button" class="btn btn-default" data-toggle="modal" data-target="#ModalConnection"><i class="fa fa-cogs"></i></button>';
	html += '</div>';
	html += '<div class="btn-group btn-group-xs">';
	html += '<button type="button" class="btn btn-default" data-toggle="modal" data-target="#ModalProject"><i class="fa fa-flask"></i></button>';
	html += '<button type="button" class="btn btn-default" data-toggle="modal" data-target="#ModalMeasurement"><i class="fa fa-rocket"></i></button>';
	html += '</div>';
	html += '<div class="btn-group btn-group-xs">';
	html += '<button type="button" class="btn btn-default"><i class="fa fa-play"></i></button>';
	html += '<button type="button" class="btn btn-default"><i class="fa fa-pause"></i></button>';
	html += '<button class="btn btn-default btn-sm" data-toggle="modal" data-target="#ModalResults"><i class="fa fa-bar-chart-o"></i></button>';
	html += '</div>';
	html += '<div class="btn-group btn-group-xs">';
	html += '<button type="button" class="btn btn-default BtnRemoveDevice" value="'+nextID+'"><i class="fa fa-times"></i></button>';
	html += '</div>';
	html += '</div>';
	html += '</td>';				
	html += '</tr>';
	$('#DeviceControlTable tbody').append(html);
	$('#BtnAddDevice').blur();
}
  
function AddMeasurementList(){
	var html = '';
	for(var i in _protocols){
		html += '<a href="#" class="list-group-item" data-value="'+i+'">';
		html += '<h5 class="list-group-item-heading" style="word-wrap:break-word;">'+_protocols[i].name+'</h5>';
		html += '<small class="list-group-item-text">'+_protocols[i].description+'</small>';
		html += '</a>';
	}
	$('#MeasurementProtocolList').empty().append(html);
}


function AddProjectList(){
	for(project in _projects){
		$('#ModalProject .modal-body').append(_projects[project].name + "<br>");
	}
}
  