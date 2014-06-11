// ===============================================================================================
// 					Initial Parameters
// ===============================================================================================
var connectionId = -1;
var deviceConnected = false;
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
var _protocols;
var _experiments;
var _macros;
var _given_answers = [];
var _used_protocols = [];
var _terminate = false;

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
		$('#DeviceConnectionState').removeClass('text-muted').removeClass('fa-chain-broken').addClass('fa-inverse').addClass('fa-link').attr('title','Device connected to port '+port_path);
		var SaveConnection = {}
		SaveConnection["os"] = port_os;
		SaveConnection["path"] = port_path;
		SaveToStorage('com_port',SaveConnection);
		deviceConnected = true;
		dataRead = '';
		MeasurementType = 'BackgroundBatteryCheck';
		chrome.serial.send(connectionId, str2ab('1004+'), function(){});
		return;
	}

	if(MeasurementType == 'BackgroundBatteryCheck'){
			try{
				var info = JSON.parse(dataRead);
				for(key in info){
					if (key == 'batt_level')
						BatteryLevel(info[key]);
						MeasurementType = false;
						dataRead = '';
				}
			}
			catch(e){}
		return;
	}

	
	if(MeasurementType == 'MenuBarMeasurement'){
		if(dataRead.match(/(\s?{[\d\w\s\":]*\[)([\d\.]*)(\,)/g) !== null){
			var passedValue = dataRead.replace(/(\s?{[\d\w\s\":]*\[)/g, '');
			passedValue = passedValue.replace(/\,/g, '');
			dataRead = '';
		}
		else if(dataRead.match(/(\,)/g)){
			var passedValue = dataRead.replace(/\,/g, '');
			dataRead = '';
		}	
		$('#ModalDialog .modal-body').html('<div class="text-primary text-center" style="display:none"><strong style="font-size:30px">'+ passedValue +'<strong></div>');
		$('#ModalDialog .modal-body div').fadeIn();
		return;
	}

	if(MeasurementType == 'MenuBarInfo'){
			try{
				var info = JSON.parse(dataRead);
				for(key in info){
					if(key == 'response')
						$('#ModalDialog .modal-body').append(info[key]+'<br>');
					else if (key == 'batt_level')
						BatteryLevel(info[key]);
					else
						$('#ModalDialog .modal-body').append('<span class="text-muted">'+key.replace('_',' ')+':</span> '+info[key]+'<br>');
				}
			}
			catch(e){}
		return;
	}

	if(MeasurementType == 'MenuBarTest'){
		if ($('#ModalDialog .modal-body').is(':empty')){
		  	$('#ModalDialog .modal-body').append('<div class="text-primary text-center"><i class="fa fa-spinner fa-spin fa-3x"></i></div>');
			$('#ModalDialog .modal-footer').hide();
		}
		if(str.match(/(^5\r\n)/gim) && !str.match(/(5\r\n0)/gi)){
			$('#ModalDialog').modal('hide');
			$('#ModalDialog .modal-footer').show();
		}
		return;
	}

	if(dataRead.match(/({\"pwr_off":"HIGH\"}\r\n)/gi)){
		dataRead = '';
		MeasurementType = 'BackgroundBatteryCheck';
		chrome.serial.send(connectionId, str2ab('1004+'), function(){});
		return;
	}


	if(MeasurementType == 'consoleraw'){
		try{
			$('#PlotsContainer').append(str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'));
			return
		}
		catch(e){}
	}

	/** Add str to local memory **/
	SaveOutputToStorage(dataRead);
		
	$('#RawOutputTextarea').text(dataRead);
		
	if(str.match(/(\r\n)/gi) && dataRead.length > 0 && (MeasurementType == 'database' || MeasurementType == 'quick' || MeasurementType == 'console') && MeasurementType != null){

		$('#ProgressBarQuick').attr('data-step',(parseInt($('#ProgressBarQuick').attr('data-step'))+1));
		var progress = ProgressBar($('#ProgressBarQuick').attr('data-step'), $('#ProgressBarQuick').attr('data-total'));
		$('#PlotsContainer').html(progress);

		try{
			var pos = dataRead.lastIndexOf('{');
			var testeded = dataRead.slice(pos);
			testeded = testeded.split("\r\n");
			if($('#ProgressBarQuick').attr('data-total') > 5 && ShowTansientgraph){
				plottransient(testeded[0]);
				
			}
		}
		catch(e){}


		if(_terminate){
			dataReadterm = dataRead.trim();
			if(dataRead.slice(-1) == ',')
				dataReadterm = dataRead.slice(0, (dataRead.length-2));
			dataReadterm += ']]}';
		
			try {
			  dataReadterm = JSON.parse(dataReadterm);
			} catch (e) {
				WriteMessage('Invalid results received from device.','danger');
				return;
			}			
			dataSave = dataReadterm;				
			
			if(MeasurementType == 'quick'){
				EnableInputs();
				$('#QuickMeasurementMenu').show();
				MeasurementType = null;
				ResultString = dataReadterm;
				WriteMessage('Protocol done.','success');
				$('#DeviceConnectionState').removeClass('fa-blink')
			}
			if(MeasurementType == 'console'){
				EnableInputs();
				$('#ConsoleMeasurementMenu').show();
				MeasurementType = null;
				ResultString = dataReadterm;
				//ResultString['ConsoleInput'] = ConsoleProtocol.value.trim();
				WriteMessage('Protocol done.','success');
				$('#DeviceConnectionState').removeClass('fa-blink')
			}
			$('#PlotsContainer').empty();
			plot(dataReadterm);
			setStatus('MultiSpeQ Ready','success');
			dataRead = '';
			dataReadterm = '';
		}
		
	}

	if(str.match(/(\r\n\r\n)/gi) && dataRead.length > 0 && (MeasurementType == 'database' || MeasurementType == 'quick' || MeasurementType == 'console') && MeasurementType != null && !_terminate){
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
		$('#DeviceConnectionState').removeClass('fa-blink')
		WriteMessage('Protocol done.','success');

		if(MeasurementType == 'database'){
			$('#DatabaseMeasurementMenu').show();
			ResultString['user_answers'] = _given_answers;
			ResultString['location'] = [_geolocation.latitude, _geolocation.longitude];
			if($('#CheckBoxRememberAnswers').is(':checked'))
				console.log('keep');
			else{
				$('#collapseFour select').each(
					function() {
						$(this).attr('value','');
					}
				);
			}
		}

		if(MeasurementType == 'quick'){
			$('#QuickMeasurementMenu').show();
		}

		if(MeasurementType == 'console'){
			$('#ConsoleMeasurementMenu').show();
			ResultString['ConsoleInput'] = ConsoleProtocol.value.trim();
		}

		$('#PlotsContainer').empty();
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
    $('#DeviceConnectionState').removeClass('fa-link').removeClass('fa-inverse').addClass('text-muted').addClass('fa-chain-broken').attr('title','Could not open port');
    return;
  }
  connectionId = connectionInfo.connectionId;
  console.log(connectionInfo);
  setStatus('Unknown Device','warning');
  $('#DeviceConnectionState').removeClass('fa-link').removeClass('fa-inverse').addClass('text-muted').addClass('fa-chain-broken').attr('title','Unknown Device');
  chrome.serial.send(connectionId, str2ab("1000+"), function(e){ });	// send 1000+ to get the answer 'MultiSpeQ Ready'
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

  var portPicker = document.getElementById('port-picker');
  removeOptions(portPicker);

  ports.forEach(function(port) {
    var portOption = document.createElement('option');
    portOption.value = portOption.innerText = port.path;
    portPicker.appendChild(portOption);
  });
  
  portPicker.onchange = function() {
    if (connectionId != -1) {
      chrome.serial.disconnect(connectionId, openSelectedPort);
      return;
    }
    openSelectedPort();
  };
}

// ===============================================================================================
// 					Serial connection error handling
// ===============================================================================================
chrome.serial.onReceiveError.addListener(function(e){
	console.log(e);
	if(e.error == 'device_lost'){ //{connectionId: 602, error: "device_lost"} 
		connectionId = -1;
		deviceConnected = false;
     	$('#DeviceConnectionState').removeClass('fa-link').removeClass('fa-inverse').addClass('text-muted').addClass('fa-chain-broken').attr('title','Unknown Device');
		setStatus('Unknown Device','warning');
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
// 					Initialized, when app is loaded
// ===============================================================================================
onload = function() {
	// Events when measurement started
	// ===============================================================================================
	document.getElementById('DatabaseMeasurement').addEventListener('click', DatabaseMeasurement);
	document.getElementById('QuickMeasurement').addEventListener('click', QuickMeasurement);
	document.getElementById('ConsoleMeasurement').addEventListener('click', ConsoleMeasurement);
	document.getElementById('TerminateMeasurement').addEventListener('click', TerminateMeasurement);
	document.getElementById('ShowOutputBtn').addEventListener('click', function(e){ $('#ShowOutputBtn').blur(); $('#RawOutputTextarea').toggle(); });

	// Events when port is changed
	// ===============================================================================================
	document.getElementById('refetchPorts').addEventListener('click', fetchPorts);
	$('.preventClose').click(function(event){
		 event.stopPropagation();
	 });

	// Events for sign in/off
	// ===============================================================================================
	document.getElementById('DatabaseSignIn').addEventListener('click', function(e){DatabaseSignIn(); e.preventDefault();});
	document.getElementById('DatabaseSignOff').addEventListener('click', function(e){DatabaseSignOff(); e.preventDefault();});

	// Events saving measurements to db/file
	// ===============================================================================================
	document.getElementById('SaveDatabaseMeasurement').addEventListener('click', DatabaseAddDataToProject);
	document.getElementById('SaveQuickMeasurementToFile').addEventListener('click', SaveDataToFile);
	document.getElementById('SaveConsoleMeasurementToFile').addEventListener('click', SaveDataToFile);
	
	document.getElementById('DiscardDatabaseMeasurement').addEventListener('click', function(){
		DiscardMeasurement();
		SelectProject(SelectedProject);
	});
	document.getElementById('DiscardQuickMeasurement').addEventListener('click', function(){
		DiscardMeasurement();
	});
	document.getElementById('DiscardConsoleMeasurement').addEventListener('click', function(){
		DiscardMeasurement();
	});

	// Nav bar events
	// ===============================================================================================
	document.getElementById('DataViewBtn').addEventListener('click', function(e){
		var accepts = [{
			mimeTypes: ['text/*'],
			extensions: ['txt']
		  }];
		  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
			if (!theEntry) {
			  WriteMessage('No file selected.','info');
			  return;
			}
			// use local storage to retain access to this file
			chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
			loadFileEntry(theEntry);
		  });
	});

	// Cache Update events
	// ===============================================================================================
	document.getElementById('ExperimentSelectionUpdateButton').addEventListener('click', function(e){
		$('#ExperimentSelectionUpdateButton').blur();
		if(_authentication != null && navigator.onLine){
			GetProjectsFromDB(_authentication.auth_token,_authentication.email);
			GetProtocolsFromDB(_authentication.auth_token,_authentication.email);
			GetMacrosFromDB(_authentication.auth_token,_authentication.email);
		}
		else
			WriteMessage('You have to be signed in and have an internet connection to update your projects and protocols.','warning');
		e.preventDefault();
	});

	// Experiment selection event - > change short description
	// ===============================================================================================
	document.getElementById('ExperimentSelection').addEventListener('change', function(e){
		var shorttext = $('#ExperimentSelection option:selected').attr('title');
		if(shorttext.length > 250){
			shorttext = shorttext.slice(0,250).split(' ');
			shorttext.pop();
			shorttext = shorttext.join(' ')+'...';
		}
		$('#ExperimentSelectionDescription').html(shorttext);
	});

	
	// Quickmeasurement selection event - > change short description
	// ===============================================================================================
	document.getElementById('QuickMeasurementProtocol').addEventListener('change', function(e){
		var shorttext = "Select a protocol to measure."
		if(_protocols[$('#QuickMeasurementProtocol option:selected').attr('value')] !== undefined){
			shorttext = _protocols[$('#QuickMeasurementProtocol option:selected').attr('value')].description;
			if(shorttext === "")
				shorttext = "No description..."
			if(shorttext.length > 250){
				shorttext = shorttext.slice(0,250).split(' ');
				shorttext.pop();
				shorttext = shorttext.join(' ')+'...';
			}
		}
		$('#QuickMeasurementSelectionDescription').html(shorttext);
	});


	// Experiment selection event - > show instructions
	// ===============================================================================================
	document.getElementById('ExperimentSelectionButton').addEventListener('click', function(e){
		DiscardMeasurement();
		if($('#ExperimentSelection').attr('value') == ""){
			$('#UserAnswers').html('<div class="alert alert-warning">Select a project first</div>');
			WriteMessage('Please select a project','danger');
		}
		else{
			SelectedProject = null;
			SelectProject($('#ExperimentSelection').attr('value'));
			$( 'a[href="#collapseFour"]').trigger( "click" );
		}
		$('#ExperimentSelectionButton').blur();
		e.preventDefault();
	});

	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-92
	$("#MainDisplayContainer").height(bodyheight);
	$("#MainDisplayContainer .panel-body").height(bodyheight-40);
	$(window).resize(function() {
		bodyheight = $(window).height()-92;
		$("#MainDisplayContainer").height(bodyheight);
		$("#MainDisplayContainer > .panel-body").height(bodyheight-40);
	});

	// Menu toggle events
	// ===============================================================================================
	$('#accordion').on('show.bs.collapse', function (e) {
		$(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-down fa-chevron-right');
	});
	$('#accordion').on('hide.bs.collapse', function (e) {
	  $(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-right fa-chevron-down');
	});

	// Initial port fetching
	// ===============================================================================================
	fetchPorts();

	// Check if internet connection exists
	// ===============================================================================================
	if (navigator.onLine) {
		$('#CurrentInternetConnectionIndicator').toggleClass('text-muted fa-inverse').attr('title','online');
	} else {
		WriteMessage('Offline','warning');
	}

	// Built drop down menus
	// ===============================================================================================
	var menu_i = 0;
	var html = '';
	for(fn in MenuItems){
		html += '<li class="dropdown">'
			+ '<a href="#" class="dropdown-toggle" data-toggle="dropdown">' + fn + ' <b class="caret"></b></a>'
			+ '<ul class="dropdown-menu">'
			for(btn in MenuItems[fn]){
				if(MenuItems[fn][btn].type == 'button'){
					html += '<li><a href="#" id="' + MenuItems[fn][btn].id + '" data-command="' + MenuItems[fn][btn].command + '" data-dialog="' + MenuItems[fn][btn].dialog + '"><i class="' + MenuItems[fn][btn].icon + '"></i> ' + MenuItems[fn][btn].title + '</a></li>'
				}
				else if(MenuItems[fn][btn].type == 'spacer')
					html += '<li class="divider"></li>'
			}
			html += '</ul>'
			+ '</li>'
	}
	$('#PhotosynqNavBar ul li:first').after(html);

	// Add click events for dropdown menus
	// ===============================================================================================	
	for(fn in MenuItems){
		for(btn in MenuItems[fn]){
			if(MenuItems[fn][btn].type == 'button'){
				document.getElementById(MenuItems[fn][btn].id).addEventListener('click', function(e){
					MenubarFunction($(this).attr('data-command'), $(this).attr('id'), $(this).html(), $(this).attr('data-dialog'));
				});			
			}
		}
	}



	
	// Get updates from database/file, auto login
	// ===============================================================================================
	LoadAuthentificationFromStorage();
	GetMacrosFromCache();
	GetProtocolsFromCache();
	GetProjectsFromCache()
	GetLocation();
	LoadPortNameFromStorage();
	getVersion(function (ver) { 
		$('#AppVersion').text('v '+ver);
	});

	// Info message window test
	// ===============================================================================================
	document.getElementById('ShowHelpBtn').addEventListener('click', function(e){
		chrome.app.window.create('Help.html', {
			id: "help",
			bounds: {
				top: 0,
				left: 0,
				width: 1024,
				height: 720
			},
			minHeight: 650,
			minWidth: 1000
		}, function (ProtocolWindow){

		});
	});

	// Info message window test
	// ===============================================================================================
	document.getElementById('BuiltYourQuickMeasurement').addEventListener('click', function(e){
		$('#BuiltYourQuickMeasurement').blur();
		chrome.app.window.create('ProtocolCreator.html', {
			id: "protocolcreate",
			bounds: {
				top: 0,
				left: 0,
				width: 1024,
				height: 720
			},
			minHeight: 650,
			minWidth: 1000
		}, function (ProtocolWindow){
			ProtocolWindow.contentWindow.addEventListener('load', function(e) {
				ProtocolWindow.contentWindow.postMessage(_protocols, '*');
			});
		});
	});

	window.addEventListener('message', function(event) {
		if(event.data.protocol_to_console !== undefined){
			$('#ConsoleProtocolContent').text(event.data.protocol_to_console);
		}
		if(event.data.protocol_run !== undefined){
			$('#ConsoleProtocolContent').text(event.data.protocol_run);
			ConsoleMeasurement();
		}
		if(event.data.protocol_save !== undefined){

		}			
	});

};

// ===============================================================================================
// 						Fetch available Ports and built list
// ===============================================================================================
function fetchPorts(){
	chrome.serial.getDevices(function(devices) {
		buildPortPicker(devices);
		openSelectedPort();
	});
}


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
// 						Run functions from the menu bar
// ===============================================================================================
function MenubarFunction(command,text,title,dialog) {
	DiscardMeasurement();

	$('#ModalDialog').modal({
		backdrop: 'static',
		keyboard: false,
		show:false
	});	

	
	if(dialog == 'static'){
		MeasurementType = "MenuBarTest";
	}
	
	
	if(dialog == 'prompt'){
	}
	
	
	if(dialog == 'close'){
		MeasurementType = "MenuBarMeasurement";
	}
	
	
	if(dialog == 'info'){
		MeasurementType = "MenuBarInfo";
	}
	
	
	$('#ModalDialog .modal-dialog').addClass('modal-sm')
	$('#ModalDialog .modal-body').empty();
	$('#ModalDialogLabel').html(title);

	if (connectionId != -1 && deviceConnected){
		$('#DeviceConnectionState').addClass('fa-blink');
		$('#ModalDialog').modal('show');
		chrome.serial.send(connectionId, str2ab(command), function(){});
	}
	else
		WriteMessage('MultispeQ device not connected','danger');
	

	$('#ModalDialog').on('hide.bs.modal', function (e) {
		chrome.serial.send(connectionId, str2ab('0'), function(){});
		MeasurementType = false;
		$('#DeviceConnectionState').removeClass('fa-blink')
	});

};



// ===============================================================================================
//						 Logic run if Regular Measurement is started
// ===============================================================================================
function DatabaseMeasurement() {
	if (connectionId != -1 && deviceConnected) {
		DiscardMeasurement();
		$('#MainDisplayContainer .panel-body').css('background-image', 'none');
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
			WriteMessage('<i class="fa fa-exclamation-triangle"></i> Please answer all questions first','danger');
			return false;
		}
		var protocol = [];
		_used_protocols = [];
		if(_experiments[SelectedProject].protocols_ids !== undefined){
			_used_protocols = _experiments[SelectedProject].protocols_ids;
			for(pIds in _experiments[SelectedProject].protocols_ids){
				var pID = _experiments[SelectedProject].protocols_ids[pIds];
				if(_protocols[pID].protocol_json !== undefined){
					if(_protocols[pID].protocol_json !== ''){
						try {
							var tmp = JSON.parse(_protocols[pID].protocol_json);
							protocol.push(tmp[0]);
						} catch (e) {
							WriteMessage('Protocol has invalid format.','danger');
							return;
						}
					}
					else
						protocol.push({});
				}
			}
		}

		if(protocol.length == 0){
			WriteMessage('<i class="fa fa-exclamation-triangle"></i> Project has no measuring protocol','danger');
			return;
		}
		
		if(protocol.length > 0){
			setStatus('MultiSpeQ Busy','danger');
			$('#DeviceConnectionState').addClass('fa-blink')
			MeasurementType = 'database';
			ResultString = null;
			//ProtocolArray = [3];
			MacroArray = null;
			DisableInputs();
			chrome.serial.send(connectionId, str2ab(JSON.stringify(protocol) + '!'), function(){
				dataRead = '';
				$('#TransientPlotsContainer').css('min-height','55%');
			});
			var protocol_total = 0;
			ShowTansientgraph = true;
			for(m in protocol){
				console.log(protocol[m]);
				if(protocol[m].measurements !== undefined)
					protocol_total += protocol[m].measurements;
				else
					protocol_total += 1
				if(protocol[m].measurements_delay !== undefined && protocol[m].measurements_delay < 1)
					ShowTansientgraph = false;
			}
			if(protocol_total === 0)
				protocol_total = protocol.length
			var progress = ProgressBar(1, protocol_total);
			$('#PlotsContainer').html(progress);
		}
		else{
			WriteMessage('No measurements in protocol','danger');
		}
		return;
	}
	else{
		WriteMessage('MultispeQ device not connected','danger');
	}
};

// ===============================================================================================
// 						Logic run if Quick Measurement is started
// ===============================================================================================
function QuickMeasurement() {
	if (connectionId != -1 && deviceConnected) {
		DiscardMeasurement();
		$('#MainDisplayContainer .panel-body').css('background-image', 'none');
		$('#QuickMeasurement').blur();
		QuickMeasurementProtocol = document.getElementById('QuickMeasurementProtocol');
		if(QuickMeasurementProtocol.value == ''){
			WriteMessage('Select a protocol first','info');
			return;
		}
		protocol = false;
		if(_protocols[QuickMeasurementProtocol.value] !== undefined)
			protocol = _protocols[QuickMeasurementProtocol.value].protocol_json;

		if(protocol == false){
			WriteMessage('Protocol not found.','danger');
			return;
		}
		try {
		  protocol = JSON.parse(protocol)
		} catch (e) {
			WriteMessage('Protocol has invalid format.','danger');
			return;
		}
		if(protocol.length > 0){
			setStatus('MultiSpeQ Busy','danger');
			$('#DeviceConnectionState').addClass('fa-blink')
			MeasurementType = 'quick';
			ResultString = null;
			ProtocolArray = [];
			_used_protocols = [];
			_used_protocols.push(QuickMeasurementProtocol.value);
			MacroArray = null;
			DisableInputs();
			chrome.serial.send(connectionId, str2ab(JSON.stringify(protocol) + '!'), function(){
				dataRead = '';
				$('#TransientPlotsContainer').css('min-height','55%');
			});
			var protocol_total = 0;
			ShowTansientgraph = true;
			for(m in protocol){
				if(protocol[m].measurements !== undefined)
					protocol_total = protocol[m].measurements;
				else
					protocol_total += 1
				if(protocol[m].measurements_delay !== undefined && protocol[m].measurements_delay < 1)
					ShowTansientgraph = false;
			}
			if(protocol_total === 0)
				protocol_total = protocol.length
			var progress = ProgressBar(1, protocol_total);
			$('#PlotsContainer').html(progress);
		}
		else{
			WriteMessage('No measurements in protocol','danger');
		}
		return;
	}
	else{
		WriteMessage('MultispeQ device not connected','danger');
	}
};


// ===============================================================================================
// 						Logic run if Console Measurement is started
// ===============================================================================================
function ConsoleMeasurement() {
	if (connectionId != -1 && deviceConnected) {
		DiscardMeasurement();
		$('#MainDisplayContainer .panel-body').css('background-image', 'none');
		$('#ConsoleProtocol').blur();
		ConsoleProtocol = document.getElementById('ConsoleProtocolContent');
		if(ConsoleProtocol.value == ''){
			WriteMessage('Console is empty...','danger');
			return;
		}
		if($('#ConsoleProtocolRaw').is(':checked')){
			MeasurementType = 'consoleraw';
			chrome.serial.send(connectionId, str2ab(ConsoleProtocol.value), function(){dataRead = '';});
			return;
		}
		try {
		  protocol = JSON.parse(ConsoleProtocol.value.trim())
		} catch (e) {
			WriteMessage('Protocol has invalid format.','danger');
			return;
		}
		if(protocol.length > 0){
			setStatus('MultiSpeQ Busy','danger');
			$('#DeviceConnectionState').addClass('fa-blink');
			MeasurementType = 'console';
			ResultString = null;
			MacroArray = null;
			DisableInputs();
			chrome.serial.send(connectionId, str2ab(ConsoleProtocol.value.trim()), function(){
				dataRead = '';
				$('#TransientPlotsContainer').css('min-height','55%');
			});
			var protocol_total = 0;
			ShowTansientgraph = true;
			for(m in protocol){
				if(protocol[m].measurements !== undefined)
					protocol_total = protocol[m].measurements;
				else
					protocol_total += 1
				if(protocol[m].measurements_delay !== undefined && protocol[m].measurements_delay < 1)
					ShowTansientgraph = false;
			}
			if(protocol_total === 0)
				protocol_total = protocol.length
			var progress = ProgressBar(1, protocol_total);
			$('#PlotsContainer').html(progress);
		}
		else{
			WriteMessage('No measurements in protocol','danger');
		}
		return;
	}
	else{
		WriteMessage('MultispeQ device not connected','danger');
	}
};


// ===============================================================================================
// 									Terminate or Rescue Measurement
// ===============================================================================================
function TerminateMeasurement(){
	$('#TerminateMeasurement').blur();
	$('#DeviceConnectionState').removeClass('fa-blink');
	_terminate = true;
	EnableInputs();
}

// ===============================================================================================
// 									Display Message on screen
// ===============================================================================================
function WriteMessage(text,type){
	toastr.options = {
	  "closeButton": false,
	  "debug": false,
	  "positionClass": "toast-bottom-full-width",
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
	if(type == 'info')
		toastr.info(text)
	if(type == 'warning')
		toastr.warning(text)
	if(type == 'danger')
		toastr.error(text)
	if(type == 'success')
		toastr.success(text)
}


// ===============================================================================================
//						Display ProgressBar
// ===============================================================================================
function ProgressBar(step, total){
	var percent = (parseInt(step)/parseInt(total))*100;
	var progress ='<div class="text-center" style="margin-top:10px; padding-right:20%;padding-left:20%" id="ProgressBarQuick" data-step="'+step+'" data-total="'+total+'">';
	progress += '<div class="progress active">';
	progress +='<div class="progress-bar progress-bar-primary"  role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" style="width: '+percent+'%">';
	progress +='</div>';
	progress +='</div>';
	progress +='<small class="text-muted">Measurement '+step+' of '+total+'</small>';
	progress +='</div>';
	return progress;
}

// ===============================================================================================
//						Disable all buttons and input fields
// ===============================================================================================
function DisableInputs(){
	$( "button, input[type='button'], select, input[type='checkbox'], textarea" ).prop( "disabled", true );
	$('#TerminateMeasurement, #ShowOutputBtn, #RawOutputTextarea').prop( "disabled", false );
	$('#RawOutputTextarea').hide();
	$('#TerminateMeasurementMenu').show();
}

// ===============================================================================================
//						Enable all buttons and input fields
// ===============================================================================================
function EnableInputs(){
	$( "button, input[type='button'], select, input[type='checkbox'], textarea" ).prop( "disabled", false );
	$('#TerminateMeasurementMenu').hide();
}

// ===============================================================================================
//						Show App Version
// ===============================================================================================
function getVersion(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'manifest.json');
	xhr.onreadystatechange = function (e) {
		if (xhr.readyState == 4){
			var manifest = JSON.parse(xhr.responseText);
			callback(manifest.version);
		}
	}
	xhr.send(null);
}


function remove(arr, item) {
      for(var i = arr.length; i--;) {
          if(arr[i] === item) {
              arr.splice(i, 1);
          }
      }
  }


function BatteryLevel(batt_level){
	var state = '';
	$("#BatteryStatusIndicator").removeClass();
	if((batt_level[0] - batt_level[1]) < 0.1){
		state = 'USB Power Only'
		$('#BatteryStatusIndicator').addClass('text-info').addClass('icon-bat4').attr('title',state);
	}
	else if(batt_level[1] < 5 && batt_level[0] > 7){
		state = 'Low quality batteries, replace with NiMh or Li'
		$('#BatteryStatusIndicator').addClass('text-danger').addClass('icon-bat1').attr('title',state);
	}
	else if(batt_level[1] < 5){
		state = 'Replace batteries'
		$('#BatteryStatusIndicator').addClass('text-danger').addClass('icon-bat1').attr('title',state);
	}
	else if((batt_level[0] - batt_level[1]) > 0.1){
		if(batt_level[0] <= 6.6){
			state = 'Replace batteries'
			$('#BatteryStatusIndicator').addClass('text-danger').addClass('icon-bat1').attr('title',state);
		}
		if(batt_level[0] > 6.6 && batt_level[0] < 7.1){
			state = 'Batteries are low'
			$('#BatteryStatusIndicator').addClass('text-danger').addClass('icon-bat2').attr('title',state);
		}
		if(batt_level[0] >= 7.1 && batt_level[0] < 7.6){
			state = 'Batteries are OK'
			$('#BatteryStatusIndicator').addClass('text-success').addClass('icon-bat3').attr('title',state);
		}
		if(batt_level[0] >= 7.6){
			state = 'Batteries are good'
			$('#BatteryStatusIndicator').addClass('text-success').addClass('icon-bat4').attr('title',state);
		}
	}
	$('#ModalDialog .modal-body').append('<div class="text-primary text-center">'+state+'<br><small class="text-muted">'+batt_level[0]+', '+batt_level[1]+', '+batt_level[2]+'</small></div>');
}

