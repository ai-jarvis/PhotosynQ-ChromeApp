// ===============================================================================================
// 					Initial Parameters
// ===============================================================================================
var connectionId = -1;
var QuickMeasurementProtocol, QuickMeasurement, ResultString, MacroArray, ProtocolArray, protocol;
var _deviceConnected = false;
var _port_os;
var _port_path;
var _MeasurementType = null;
var _ShowTansientgraph = true;
var _dataRead = '';
var _SelectedProject = null;
var _authentication;
var _geolocation = false;
var _protocols = {};
var _userprotocols = {};
var _projects = [];
var _macros = [];
var _media = {};
var _given_answers = [];
var _consolemacros = false;
var _muteMessages = false;
var _apiURL = "http://photosynq.venturit.org/api/v1/";

// ===============================================================================================
// 					Logic to read and process incoming data
// ===============================================================================================
function onCharRead(readInfo) {
    if (!connectionId)
		return;

    if (readInfo.connectionId !== connectionId)
    	return;
    	
	var str = ab2str(readInfo.data);

	if(_MeasurementType == 'database' || _MeasurementType == 'quick' || _MeasurementType == 'console'){
		try{
			str = str.replace(new RegExp('{', 'gi'), '{"time": '+ new Date().getTime() +', ');
			str = str.replace(new RegExp('^{', 'gi'), '{"time_offset": '+ new Date().getTimezoneOffset() +', ');
		}
		catch(e){
			console.log(e);
		}
	}

	console.log(str);
	_dataRead += str;

	if(_dataRead.match(/(MultispeQ Ready\r\n)/gi)){
		setStatus("MultispeQ Ready",'success');
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success').parent().attr('title','Device connected to port '+_port_path);
		var SaveConnection = {}
		SaveConnection["os"] = _port_os;
		SaveConnection["path"] = _port_path;
		SaveToStorage('com_port',SaveConnection, function(){});
		_deviceConnected = true;
		_dataRead = '';
		_MeasurementType = 'BackgroundBatteryCheck';
		chrome.serial.send(connectionId, str2ab('1004+'), function(){});
		$('#ConnectBtn').button('complete');
		return;
	}

	if(_MeasurementType == 'BackgroundBatteryCheck'){
			try{
				var info = JSON.parse(_dataRead);
				for(key in info){
					if (key == 'batt_level')
						BatteryLevel(info[key], false);
						_MeasurementType = false;
						_dataRead = '';
				}
			}
			catch(e){}
		return;
	}

	
	if(_MeasurementType == 'MenuBarMeasurement'){
		if(_dataRead.match(/(\s?{[\d\w\s\":]*\[)([\d\.]*)(\,)/g) !== null){
			var passedValue = _dataRead.replace(/(\s?{[\d\w\s\":]*\[)/g, '');
			passedValue = passedValue.replace(/\,/g, '');
			_dataRead = '';
		}
		else if(_dataRead.match(/(\,)/g)){
			var passedValue = _dataRead.replace(/\,/g, '');
			_dataRead = '';
		}
		$("#ModalDialogValue").fadeOut(100, function() {
		  $(this).text(passedValue).fadeIn();
		});
		if(passedValue !== undefined){
			if($('#ModalDialogSparkline span').attr('values') == "")
				$('#ModalDialogSparkline span').attr('values', passedValue);
			else{
				var values = $('#ModalDialogSparkline span').attr('values').split(',');
				if(values.length == 30)
					values = values.slice(1,30).join(',');
				$('#ModalDialogSparkline span').attr('values', values+','+passedValue);
			}
			$('#ModalDialogSparkline span').sparkline('html', { 
				width: 296,
				height: 45,
				lineColor:'#357EBD',
				fillColor:'#E6EFF8',
				lineWidth:1,
				minSpotColor: false,
				maxSpotColor:false,
				spotColor:'#aaaaaa',
				disableTooltips: true,
				disableHighlight: true
			});
		}
		return;
	}

	if(_MeasurementType == 'MenuBarInfo'){
			try{
				var info = JSON.parse(_dataRead);
				for(key in info){
					if(key == 'response')
						$('#ModalDialogMsg').show().append(info[key]+'<br>');
					else if (key == 'batt_level')
						BatteryLevel(info[key],true);
					else if(key == 'pwr_off'){
						$('#ModalDialogMsg').show().append('<span class="text-primary">Device powered off</span>');
						_dataRead = '';
						_MeasurementType = 'BackgroundBatteryCheck';
						chrome.serial.send(connectionId, str2ab('1004+'), function(){});
					}
					else
						$('#ModalDialogMsg').show().append('<span class="text-muted">'+key.replace('_',' ')+':</span> '+info[key]+'<br>');
				}
			}
			catch(e){}
		return;
	}

	if(_MeasurementType == 'MenuBarRead'){
		if(_dataRead.match(/\,/g)){
			$('#ModalDialogMsg').hide();
			var passedValue = _dataRead.replace(/(\d*\.?\d*\]})|(\,)/g, '');
			$('#ModalDialogMsg').html('<p><span class="text-muted">Last read:</span> '+ passedValue+'</p>').fadeIn();
			chrome.serial.send(connectionId, str2ab('-1+'), function(){
				_dataRead = '';
			});
		}
		return;
	}

	if(_dataRead.match(/({\"pwr_off":"HIGH\"}\r\n)/gi)){
		_dataRead = '';
		_MeasurementType = 'BackgroundBatteryCheck';
		chrome.serial.send(connectionId, str2ab('1004+'), function(){});
		return;
	}


	if(_MeasurementType == 'consoleraw'){
		try{
			$('#PlotsContainer').append(str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2'));
			return
		}
		catch(e){}
	}

	/** Add str to local memory **/
	SaveOutputToStorage(_dataRead);
		
	$('#RawOutputTextarea').text(_dataRead);
		
	if(str.match(/(\r\n)/gi) && _dataRead.length > 0 && (_MeasurementType == 'database' || _MeasurementType == 'quick' || _MeasurementType == 'console') && _MeasurementType != null){

		ProgressBar((parseInt($('#MeasurementProgress').attr('data-step'))+1), $('#MeasurementProgress').attr('data-total'));
		try{
			var pos = _dataRead.lastIndexOf('{');
			var testeded = _dataRead.slice(pos);
			testeded = testeded.split("\r\n");
			if($('#MeasurementProgress').attr('data-total') > 5 && _ShowTansientgraph){
				plottransient(testeded[0]);
				
			}
		}
		catch(e){}	
	}

	if(_dataRead.match(/(\r\n\r\n)$/gi) && _dataRead.length > 0 && (_MeasurementType == 'database' || _MeasurementType == 'quick' || _MeasurementType == 'console') && _MeasurementType != null){
		_dataRead = _dataRead.trim();
		try {
		  _dataRead = JSON.parse(_dataRead);
		} catch (e) {
			WriteMessage('Invalid results received from device.','danger');
			return;
		}			
		EnableInputs();
		ResultString = _dataRead;
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
		WriteMessage('Protocol done.','success');

		if(_MeasurementType == 'database'){
			$('#SaveMeasurementToDB').show();
			ResultString['user_answers'] = _given_answers;
			if(_geolocation)
				ResultString['location'] = [_geolocation.latitude, _geolocation.longitude];
		}
		
		if(_MeasurementType == 'console' || (_MeasurementType == 'quick')){
			$('#SaveMeasurementToFile').show();
			_SelectedProject = null;
		}

		if(_MeasurementType == 'console'){
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
		plot(_dataRead);
		setStatus('MultiSpeQ Ready','success');
		_dataRead = '';
		_MeasurementType = null;
	}	
} 
  
// ===============================================================================================
// 					Set Port info 
// ===============================================================================================
chrome.serial.onReceive.addListener(onCharRead);
chrome.runtime.getPlatformInfo(function(info) {
		_port_os = info.os;
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

  var portPicker = document.getElementById('port-picker');
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
    _deviceConnected = false;
  };
  
  
}

// ===============================================================================================
// 					Serial connection error handling
// ===============================================================================================
chrome.serial.onReceiveError.addListener(function(e){
	if(e.error == 'device_lost'){
		connectionId = -1;
		_deviceConnected = false;
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
	_port_path = selectedPort;
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
	// Events when measurement started
	// ===============================================================================================
	document.getElementById('DatabaseMeasurement').addEventListener('click', DatabaseMeasurement);
	document.getElementById('QuickMeasurement').addEventListener('click', QuickMeasurement);
	document.getElementById('ConsoleMeasurement').addEventListener('click', ConsoleMeasurement);
	document.getElementById('TerminateMeasurement').addEventListener('click', TerminateMeasurement);
	document.getElementById('ShowOutputBtn').addEventListener('click', function(e){ 
		$('#ShowOutputBtn').blur();
		$('#RawOutputTextarea').toggle(); 
	});

	document.getElementById('BtnToggleAllGraphs').addEventListener('click', function(){
		$('#BtnToggleAllGraphs i').toggleClass('fa-chevron-down fa-chevron-up');
		if($('#BtnToggleAllGraphs i').hasClass('fa-chevron-down'))
			$('#PlotsContainer [id^="plotRawDatabody"]').collapse('show');
		else
			$('#PlotsContainer [id^="plotRawDatabody"]').collapse('hide');
		$('#BtnToggleAllGraphs').blur();
	});

	document.getElementById('BtnToggleSimpleAdvanced').addEventListener('click', function(){
		$('#PlotsContainer [id^="plotRawDataHeader"], #PlotsContainer [id^="plotRawDataTable"], #PlotsContainer [id^="plotRawDataFooter"]').toggle();
		$('#BtnToggleSimpleAdvanced i').toggleClass('fa-toggle-left fa-toggle-right');
	
		if($('#BtnToggleSimpleAdvanced i').hasClass('fa-toggle-right')){
			$('#PlotsContainer [id^="plotRawDatabody"]').collapse('hide');
			if($('#BtnToggleAllGraphs i').hasClass('fa-chevron-down'))
				$('#BtnToggleAllGraphs i').toggleClass('fa-chevron-down fa-chevron-up');
		}
		else{
			$('#PlotsContainer [id^="plotRawDatabody"]').collapse('show');
			if($('#BtnToggleAllGraphs i').hasClass('fa-chevron-up'))
				$('#BtnToggleAllGraphs i').toggleClass('fa-chevron-down fa-chevron-up');
		}
		
		$('#BtnToggleSimpleAdvanced').blur();
	});

	$('#ProjectList').on('click','a',function(){
		if(!$(this).hasClass('active')){
			SelectProject($(this).attr('data-value'));
			$('#SubNavigation a[href="#ProjectMeasurementTab"]').tab('show');
		}
		else{
			DiscardMeasurement();
			_SelectedProject = null;
		}
	});
	
	$('#BtnBackToProjects').on('click',function(){
		$(this).blur();
		$('#ProjectList a').removeClass('active');
		DiscardMeasurement();
		_SelectedProject = null;
		$('#CheckBoxRememberAnswers').prop('checked', false); 
		$('#SubNavigation a[href="#ProjectTab"]').tab('show');
	});
	
	$('#SubNavigation a[href="#ProjectTab"]').on('click',function(){
		$('#ProjectList a').removeClass('active');
		DiscardMeasurement();
		_SelectedProject = null;
		$('#CheckBoxRememberAnswers').prop('checked', false); 
	});

	$('#MuteAllNotifications').on('click', function(){
		var store = {}
		if(!_muteMessages){
			$('#MuteAllNotifications small').html('<i class="fa fa-toggle-off"></i> Show popup notifications');
			_muteMessages = true;
			store['MuteNotifications'] = _muteMessages;
			chrome.storage.local.set(store);
		}
		else if(_muteMessages){
			$('#MuteAllNotifications small').html('<i class="fa fa-toggle-on"></i> Show popup notifications');
			_muteMessages = false
			store['MuteNotifications'] = _muteMessages;
			chrome.storage.local.set(store);
		}
	});

	// Events when port is changed
	// ===============================================================================================
	$('.preventClose').click(function(event){
		 event.stopPropagation();
	 });
	document.getElementById('refetchPorts').addEventListener('click', fetchPorts);
	document.getElementById('ConnectBtn').addEventListener('click', function(e){
		if($('#port-picker option').length == 0){
			WriteMessage('No ports available to connect to.','warning');
			return;
		}
		if($('#ConnectBtn').text() == "Connect"){
			$('#ConnectBtn').blur().button('loading');
			if (connectionId != -1) {
				chrome.serial.disconnect(connectionId, openSelectedPort);
				return;
			}
			openSelectedPort();
		}
		if($('#ConnectBtn').text() == "Disconnect"){
			if (connectionId != -1) {
				chrome.serial.disconnect(connectionId, function(){
			    	$('#DeviceConnectionState').removeClass().addClass('fa fa-times text-danger').parent().attr('title','Not connected');
					setStatus('Not connected','info');
					$('#ConnectBtn').blur().button('reset');
					_deviceConnected = false;
				});
				return;
			}
		}
	});
	
	document.getElementById('BtnProtocolAssembly').addEventListener('click', function(e){
		$(this).blur();
		OpenProtocolCreator();
	});

	// Events for sign in/off
	// ===============================================================================================
	document.getElementById('DatabaseSignIn').addEventListener('click', function(e){DatabaseSignIn(); e.preventDefault();});
	document.getElementById('DatabaseSignOff').addEventListener('click', function(e){DatabaseSignOff(); e.preventDefault();});

	document.getElementById('DiscardAllNotifications').addEventListener('click', function(e){
		$('#NotificationHistory li ul li').remove();
		$('#NotificationHistory').prev().find('.fa-bell').removeClass('fa-inverse');
	});
	
	document.getElementById('BtnLocationUpdate').addEventListener('click', function(e){
		GetLocation();
	});
	

	// Events saving measurements to db/file
	// ===============================================================================================
	document.getElementById('SaveMeasurementToDB').addEventListener('click', DatabaseAddDataToProject);
	document.getElementById('SaveMeasurementToFile').addEventListener('click', SaveDataToFile);
	
	document.getElementById('DiscardMeasurement').addEventListener('click', function(){
		DiscardMeasurement();
		if(_SelectedProject)
			SelectProject(_SelectedProject);
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
			loadFileEntry(theEntry);
		  });
	});

	// Cache Update events
	// ===============================================================================================
	document.getElementById('AppUpdateButton').addEventListener('click', function(e){
		if(e.shiftKey) {
       		chrome.storage.local.clear(function(){
 				DatabaseSignOff();
 				chrome.storage.local.getBytesInUse('cached_projects', function(response){
					$('#ProjectStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
				});
 				chrome.storage.local.getBytesInUse(['cached_protocols','cached_userprotocols'], function(response){
					$('#ProtocolStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
				});
 				chrome.storage.local.getBytesInUse('cached_macros', function(response){
					$('#MacroStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
				});
 				chrome.storage.local.getBytesInUse('media', function(response){
					$('#MediaStorageQuota').text((response/Math.pow(2,20)).toFixed(2)+' MB')
				});
						
       		});
       		e.preventDefault();
       		return;
    	} 
		if(_authentication != null && navigator.onLine){
			GetProjectsFromDB(_authentication.auth_token,_authentication.email);
			GetProtocolsFromDB(_authentication.auth_token,_authentication.email);
			GetMacrosFromDB(_authentication.auth_token,_authentication.email);
		}
		else
			WriteMessage('You have to be signed in and have an internet connection to update your projects and protocols.','warning');
		e.preventDefault();
	});


	// Check for updates
	// =====================================================================
	chrome.runtime.onUpdateAvailable.addListener(function(update){
		UpdateNotification();
	});
	
	chrome.runtime.requestUpdateCheck(function(status) {
		if (status == "update_available")
			UpdateNotification();
	});

	$('#NotificationHistory li ul').on('click', '#ClickToUpdate', function(){
		chrome.runtime.reload();
	});	
	
	// Update Info routine
	// =====================================================================
	chrome.runtime.onInstalled.addListener(function(update){
		//"install", "update", "chrome_update", or "shared_module_update"
		//update.previousVersion only with "update"
		
		if(update.reason == 'update')
			WriteMessage('PhotosynQ App was updated','info');
			
		if(update.reason == 'chrome_update')
			WriteMessage('Google Chrome was updated','info');
		
		if(update.reason == 'install')
			WriteMessage('Welcome to PhotosynQ','warning');

	});

	// Update notification generation
	// =====================================================================	
	function UpdateNotification(){
		if($('#ClickToUpdate').length > 0)
			return;
		toastr.options = {
		  "closeButton": false,
		  "debug": false,
		  "positionClass": "toast-top-right",
		  "onclick": function () {
			chrome.runtime.reload();
		  },
		  "showDuration": "300",
		  "hideDuration": "1000",
		  "timeOut": "10000",
		  "extendedTimeOut": "1000",
		  "showEasing": "swing",
		  "hideEasing": "linear",
		  "showMethod": "fadeIn",
		  "hideMethod": "fadeOut"
		}
		var text = 'Update available, click to update app';
		toastr.warning(text);
		
		html = '<li style="padding:2px 15px 2px 15px; cursor:pointer;" id="ClickToUpdate">'
		html += '<i class="fa fa-exclamation-circle text-warning" style="margin-right:10px;"></i>'
		html += '<span class="text-muted">'+text+'</span>'
		html += '<small class="text-muted pull-right" style="" data-timestamp="'+ Date.now() +'">0 sec ago</small>'
		html += '</li>'
		html += '<li class="divider"></li>'
		$('#NotificationHistory li ul').prepend(html);
		$('.toast-top-right').css('top','55px');	
	}

	// Filter Parameter
	// =====================================================================
	jQuery.expr[':'].contains = function(a, i, m) { 
		return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0; 
	};

	$('#FilterProtocolList').on('keyup', function(){
		if($(this).val() != ""){
			$("#PhotosynQProtocolsList a, #UserProtocolsList a").hide();
			$("#PhotosynQProtocolsList a:contains('"+$(this).val()+"'), #UserProtocolsList a:contains('"+$(this).val()+"')").show();
		}
		else
			$("#PhotosynQProtocolsList a, #UserProtocolsList a").show();
		
		$('#QuickMeasurementTab .panel-heading .badge').text(
			$('#QuickMeasurementTab .list-group a:visible').length
		);
		return false;
	});

	$('#FilterProjectList').on('keyup', function(){
		if($(this).val() != ""){
			$("#ProjectTab .list-group a").hide();
			$("#ProjectTab .list-group a:contains('"+$(this).val()+"')").show();
		}
		else
			$("#ProjectTab .list-group a").show();
		
		$('#ProjectTab .panel-heading .badge').text(
			$('#ProjectTab .list-group a:visible').length
		);
		return false;
	});


	$('#QuickMeasurementTab .list-group, #ProjectTab .list-group').on('click', 'a', function(){
		if($(this).hasClass('active'))
			$(this).removeClass('active');
		else{
			$('#QuickMeasurementTab .list-group a, #ProjectTab .list-group a').removeClass('active');
			$(this).addClass('active');
		}
		return false;
	});
	
	$('#SubNavigation').on('click', ' li, a', function(){
		if($(this).hasClass('disabled'))
			return false;
	});	

	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-84
	$("#MainDisplayContainer").height(bodyheight);
	$("#MainDisplayContainer .panel-body").height(bodyheight-40);
	$('#ProjectList, #QuickMeasurementProtocol, #ProjectMeasurementTab .panel-body').height(bodyheight-185);
	$('#ConsoleProtocolContent').height(bodyheight-213);
	$(window).resize(function() {
		bodyheight = $(window).height()-84;
		$("#MainDisplayContainer").height(bodyheight);
		$("#MainDisplayContainer > .panel-body").height(bodyheight-40);
		if($("#MainDisplayContainer .panel-footer").is(":visible"))
			$("#MainDisplayContainer > .panel-body").height(bodyheight-85);
		$('[id^="plotRawDataFooter"] canvas').width($('[id^="plotRawDataFooter"]').parent().width())
		$('#ProjectList, #QuickMeasurementProtocol, #ProjectMeasurementTab .panel-body').height(bodyheight-185);
		$('#ConsoleProtocolContent').height(bodyheight-213);
	});

	// Menu toggle events
	// ===============================================================================================
	$('#accordion,#PlotsContainer').on('show.bs.collapse hide.bs.collapse', function (e) {
		$(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-down fa-chevron-up');
	});

	// Graphs toggle events
	// ===============================================================================================
	$('#PlotsContainer').on('shown.bs.collapse', function (e) {
		$(e.target).children('div[id^=plotRawData]').highcharts().reflow();
	});

	$('#NotificationHistory').parent().on('show.bs.dropdown', function () {
		$('#NotificationHistory').prev().find('.fa-circle').remove();
	  	$('#NotificationHistory li ul li').each(function(k,v){
	  		var notetime = $(v).find('small');
	  		if(notetime.attr('data-timestamp') !== undefined){
	  			var timediff = Date.now() - notetime.attr('data-timestamp')
	  			if(timediff < 1000)
	  				notetime.text('1 sec ago')
	  			else if(timediff < 60000)
	  				notetime.text( Math.floor(timediff % 60000 / 1000) +' sec ago')
	  			else if(timediff < 36e5)
	  				notetime.text( Math.floor(timediff % 36e5 / 60000) +' min ago')
	  			else if(timediff < 864e5)
	  				notetime.text( Math.floor(timediff % 864e5 / 36e5) +' h ago')
	  			else if(timediff >= 864e5)
	  				notetime.text( Math.floor(timediff / 864e5) +' d ago')
	  		}
	  	});
	});


	// Initial app settings
	// ===============================================================================================
	LoadMuteNotificationFromStorage();
	fetchPorts();

	// Check if internet connection exists
	// ===============================================================================================
	if (navigator.onLine) {
		$('#CurrentInternetConnectionIndicator').toggleClass('text-muted fa-inverse').attr('title','online');
	} else {
		WriteMessage('Offline','warning');
	}
	
	$(window).on('offline', function(){
		$('#CurrentInternetConnectionIndicator').removeClass('text-muted fa-inverse').addClass('text-muted').attr('title','offline');
		WriteMessage('Offline','warning');
	});
	
	$(window).on('online', function(){
		$('#CurrentInternetConnectionIndicator').removeClass('text-muted fa-inverse').addClass('fa-inverse').attr('title','online');
		GetLocation();
		WriteMessage('Online','info');
	});	

	// Built drop down menus
	// ===============================================================================================
	var menu_i = 0;
	var html = '';
	for(fn in MenuItems){
		html += '<li class="dropdown">'
			+ '<a href="#" class="dropdown-toggle" data-toggle="dropdown" '
			if(fn == 'Device')
				html += 'title = "Get device information"'
			else
				html +=  'title = "Quick access to sensors and lights"'
			html +=  '>' 
			+ fn + ' <b class="caret"></b></a>'
			+ '<ul class="dropdown-menu">'
			for(btn in MenuItems[fn]){
				if(MenuItems[fn][btn].type == 'button'){
					html += '<li><a href="#" id="' + MenuItems[fn][btn].id + '" '
					html += 'data-item="' + fn + '" '
					html += 'data-itemID="' + btn + '" >'
					html += '<i class="' + MenuItems[fn][btn].icon + '"></i> '
					html += MenuItems[fn][btn].title + '</a></li>'
				}
				else if(MenuItems[fn][btn].type == 'spacer'){
					if(MenuItems[fn][btn].title !== undefined)
						html += '<li class="dropdown-header">'+MenuItems[fn][btn].title+'</li>'
					else
						html += '<li class="divider"></li>'
				}
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
					MenubarFunction($(this).attr('data-item'), $(this).attr('data-itemID'));
				});			
			}
		}
	}

	
	// Get updates from database/file, auto login
	// ===============================================================================================
	LoadMediaFromStorage();
	LoadAuthentificationFromStorage();
	GetMacrosFromCache();
	GetProtocolsFromCache();
	GetProjectsFromCache();
	GetLocation();
	LoadPortNameFromStorage();

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
		});
	});

	// Info message window test
	// ===============================================================================================
	document.getElementById('BuiltYourMacro').addEventListener('click', function(e){
		chrome.app.window.create('MacroCreator.html', {
			id: "macro",
			bounds: {
				top: 0,
				left: 0,
				width: 1024,
				height: 720
			},
			minHeight: 680,
			minWidth: 1000
		}, function (MacroWindow){
			MacroWindow.contentWindow.addEventListener('load', function(e) {
				MacroWindow.contentWindow.postMessage({'macros':_macros}, '*');
			});
		});
	});

	// Info message window test
	// ===============================================================================================
	document.getElementById('BuiltYourQuickMeasurement').addEventListener('click', function(e){
		$(this).blur();
		OpenProtocolCreator();
	});


	function OpenProtocolCreator(){
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
				ProtocolWindow.contentWindow.postMessage({'db':_protocols,'macros':_macros}, '*');
			});
		});	
	}

	window.addEventListener('message', function(event) {
		if(event.data.protocol_to_console !== undefined){
			$('#ConsoleProtocolContent').val(event.data.protocol_to_console);
			$('#SubNavigation a[href="#ConsoleTab"]').tab('show');
		}
		if(event.data.protocol_run !== undefined){
			$('#ConsoleProtocolContent').val(event.data.protocol_run);
			$('#SubNavigation a[href="#ConsoleTab"]').tab('show');
			try{
				var protocol = JSON.parse(event.data.protocol_run.trim());
				_consolemacros = event.data.protocol_macro;
				RunMeasurement(protocol,'console');
			}
			catch(e){
				WriteMessage('Protocol has wrong format.','danger')
			}
		}
		if(event.data.protocol_save !== undefined){
			try {
				//event.data.protocol_save;
				//if(DatabaseAddEditProtocol(token,email,protocol)){
				//	GetProtocolsFromDB(token,email)
				//}
			}
			catch(e){
				WriteMessage('Protocol has format','danger');
			}
		}
	});
	
	GeneratePanelClasses(HighchartColors);
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
// 						Run functions from the menu bar
// ===============================================================================================
function MenubarFunction(item,itemid) {
	if(connectionId == -1 || !_deviceConnected){
		WriteMessage('MultispeQ device not connected', 'danger');
		return;
	}
	DiscardMeasurement();

	$('#ModalDialog').modal({
		backdrop: 'static',
		keyboard: true,
		show:false
	});	

	var title = MenuItems[item][itemid].title;
	var dialog = MenuItems[item][itemid].dialog;
	var command = MenuItems[item][itemid].command;
	var dialogsize = MenuItems[item][itemid].size;

	$('#ModalDialogLabel').html(title);
	$('#ModalDialogValue, #ModalDialogMsg, #ModalDialogSparkline,#ModalDialogForm').empty().hide();
	$('#ModalDialog .modal-dialog').removeClass('modal-sm modal-lg')

	if(dialogsize == 'sm')
		$('#ModalDialog .modal-dialog').addClass('modal-sm')

	if(dialogsize == 'lg')
		$('#ModalDialog .modal-dialog').addClass('modal-lg')

	
	if(dialog == 'static'){
		_MeasurementType = "MenuBarTest";
	}
	
	
	if(dialog == 'prompt'){

		html = '<div class="form-group">'
		html += '<select class="form-control" id="MenuPromtDialogSelect">'
		for(i in command)
			html += '<option value="'+command[i].command+'">'+command[i].title+'</option>'
		html += '</select>'
		html += '</div>'
		
		html += '<div class="form-group">'
		html += '<label class="control-label">'+MenuItems[item][itemid].prompt_label+'</label>'
		html += '<div class="input-group">'
		html += '<input type="number" class="form-control" id="MenuPromtDialogInput" placeholder="20">'
		html += '<span class="input-group-btn">'
		if(MenuItems[item][itemid].button_behavior == 'toggle')
			html += '<button type="button" class="btn btn-default" data-toggle="button" id="MenuPromtDialogBtn">'+MenuItems[item][itemid].button_label+'</button>'
		if(MenuItems[item][itemid].button_behavior == 'click')
			html += '<button type="button" class="btn btn-default" id="MenuPromtDialogBtn">'+MenuItems[item][itemid].button_label+'</button>'		
		html += '</span>'
		html += '</div>'
		html += '<p class="help-block">'+MenuItems[item][itemid].prompt_help+'</p>'
		html += '</div>'
		
		$('#ModalDialogForm').append(html).show();
	
		$('#MenuPromtDialogBtn').on('click', function(){
			$('#MenuPromtDialogBtn').blur();
			if(MenuItems[item][itemid].button_behavior == 'toggle'){
				if($(this).hasClass('active')){
					chrome.serial.send(connectionId, str2ab('-1+'), function(){});
				}
				if(!$(this).hasClass('active')){
					chrome.serial.send(connectionId, str2ab($('#MenuPromtDialogSelect').val()+'+'), function(){
						chrome.serial.send(connectionId, str2ab($('#MenuPromtDialogInput').val()+'+'), function(){});	
					});	
				}
			}
			if(MenuItems[item][itemid].button_behavior == 'click'){
				_MeasurementType = "MenuBarRead";
				chrome.serial.send(connectionId, str2ab($('#MenuPromtDialogSelect').val()+'+'), function(){
					chrome.serial.send(connectionId, str2ab($('#MenuPromtDialogInput').val()+'+'), function(){
						chrome.serial.send(connectionId, str2ab($('-1+')), function(){});	
					});	
				});
			}
		});
		
		$('#MenuPromtDialogSelect').on('change', function(){
			if($('#MenuPromtDialogBtn').hasClass('active'))
				$('#MenuPromtDialogBtn').click();
		});
		
		var idle;
		$('#MenuPromtDialogInput').on('change keyup', function(){
			if($('#MenuPromtDialogBtn').hasClass('active')){
				clearTimeout(idle);
				idle = setTimeout(function() {
					console.log($('#MenuPromtDialogInput').val());
					chrome.serial.send(connectionId, str2ab($('#MenuPromtDialogInput').val()+'+'), function(){});
				}, 1000);
			}
		});
		
	}
	
	
	if(dialog == 'close'){
		_MeasurementType = "MenuBarMeasurement";
		$('#ModalDialogSparkline').append('<span values="" style="margin-bottom:-20px;"></span>').show();
	}
	
	
	if(dialog == 'info'){
		_MeasurementType = "MenuBarInfo";
	}
	

	if (connectionId != -1 && _deviceConnected){
		$('#DeviceConnectionState').removeClass().addClass('fa fa-refresh fa-spin text-success');
		$('#ModalDialog').modal('show');
		if(dialog !== 'prompt'){
			chrome.serial.send(connectionId, str2ab(command), function(){});
		}
	}
	else
		WriteMessage('MultispeQ device not connected','danger');
	
	$('#ModalDialog').on('show.bs.modal', function () {
		chrome.power.requestKeepAwake('system');
	});

	$('#ModalDialog').on('hide.bs.modal', function (e) {
		chrome.serial.send(connectionId, str2ab('-1+'), function(){});
		_MeasurementType = false;
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
		chrome.power.releaseKeepAwake();
	});

};


// ===============================================================================================
//						 Logic run if Regular Measurement is started
// ===============================================================================================
function DatabaseMeasurement() {
	$('#DatabaseMeasurement').blur();
	if(_SelectedProject === null){
		WriteMessage('Please select a project first','warning');
		return;
	}
	
	var no_answers = false;
	_given_answers = [];
	$('#UserAnswers [id^="answer_"]').each(function(i,k){
		_given_answers.push($(k).val());
		if($(k).val() === ""){
			no_answers = true;
		}
	});
	if(no_answers){
		WriteMessage('Please answer all questions first','danger');
		return false;
	}
	var protocol = [];
	if(_projects[_SelectedProject].protocols_ids !== undefined){
		for(pIds in _projects[_SelectedProject].protocols_ids){
			var pID = _projects[_SelectedProject].protocols_ids[pIds];
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
// 						Logic run if Console Measurement is started
// ===============================================================================================
function ConsoleMeasurement() {
	ConsoleProtocol = $('#ConsoleProtocolContent').val();
	if(ConsoleProtocol == ''){
		WriteMessage('Console is empty...','danger');
		return;
	}
	if($('#ConsoleProtocolRaw').is(':checked')){
		DiscardMeasurement();
		$('#MainDisplayContainer .panel-body').css('background-image', 'none');
		_MeasurementType = 'consoleraw';
		SendLongStrings(ConsoleProtocol+'!');
		_dataRead = '';
		return;
	}
	
	try{
		ConsoleProtocol = JSON.parse(ConsoleProtocol.trim());
	}
	catch(e){
		WriteMessage('Protocol has wrong format','danger');
		return;
	}
	RunMeasurement(ConsoleProtocol,'console');
	return;
};

// ===============================================================================================
// 									Run Measurement
// ===============================================================================================
function RunMeasurement(protocol,mtype){
	// Check Connection
	if (connectionId == -1 || !_deviceConnected){
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
	_MeasurementType = mtype;
	_dataRead = '';
	DisableInputs();
	chrome.power.requestKeepAwake('system');
	SendLongStrings(protocol_string+'!');
	$('#TransientPlotsContainer').css('min-height','55%');
	var protocol_total = protocol.length;
	var protocol_measurements = 1;
	_ShowTansientgraph = true;
	for(m in protocol){
		if(protocol[m].measurements !== undefined){
			if(protocol[m].measurements > protocol_measurements)
				protocol_measurements = protocol[m].measurements;
		}
		if(protocol[m].measurements_delay !== undefined && protocol[m].measurements_delay < 1 && _ShowTansientgraph)
			_ShowTansientgraph = false;
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
	chrome.serial.send(connectionId, str2ab("-1+-1+"), function(){
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
	$( "button, input[type='button'], select, input[type='checkbox'], textarea, #UserAnswers input" ).prop( "disabled", true );
	$('#SubNavigation li').addClass('disabled');
	$('#TerminateMeasurement, #ShowOutputBtn, #RawOutputTextarea').prop( "disabled", false );
	$('#RawOutputTextarea').hide();
	$('#TerminateMeasurementMenu').show();
}

// ===============================================================================================
//						Enable all buttons and input fields
// ===============================================================================================
function EnableInputs(){
	$( "button, input[type='button'], select, input[type='checkbox'], textarea, #UserAnswers input" ).prop( "disabled", false );
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



// ===============================================================================================
//							Discard measurement and remove all plots
// ===============================================================================================
function DiscardMeasurement(){
	chrome.power.releaseKeepAwake();
	EnableInputs();
	$('#MeasurementMenu, #SaveMeasurementToFile, #SaveMeasurementToDB').hide();
	$('#PlotsContainer,#TransientPlotsContainer').empty();
	$('#TransientPlotsContainer').css('min-height','0px');
	$('#MainDisplayContainer .panel-body').css('background-image', 'url(\'img/containerbackground.png\')');
	if(connectionId != -1 && _deviceConnected)
		$('#DeviceConnectionState').removeClass().addClass('fa fa-exchange text-success');
	ProgressBar(0, 0);
	$(window).trigger('resize');
	_MeasurementType = null;
	ProtocolArray = null;
	QuickMeasurementProtocol = null;
	QuickMeasurement = null;
	ResultString = null;
	MacroArray = null;
	serialBuffer = '';
	_dataRead = '';
	RemoveFromStorage('measurement_tmp');
}


function BatteryLevel(batt_level,dialog){
	var state = '';
	$("#BatteryStatusIndicator").removeClass();
	if((batt_level[0] - batt_level[1]) < 0.1){
		state = 'USB Power Only'
		$('#BatteryStatusIndicator').addClass('fa-inverse').addClass('icon-bat-charge').attr('title',state);
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
			$('#BatteryStatusIndicator').addClass('fa-inverse').addClass('icon-bat2').attr('title',state);
		}
		if(batt_level[0] >= 7.1 && batt_level[0] < 7.6){
			state = 'Batteries are OK'
			$('#BatteryStatusIndicator').addClass('fa-inverse').addClass('icon-bat3').attr('title',state);
		}
		if(batt_level[0] >= 7.6){
			state = 'Batteries are good'
			$('#BatteryStatusIndicator').addClass('fa-inverse').addClass('icon-bat4').attr('title',state);
		}
	}
	if(dialog)
		$('#ModalDialogMsg').show().append('<div class="text-primary">'+state+'<br><small class="text-muted">'+batt_level[0]+', '+batt_level[1]+', '+batt_level[2]+'</small></div>');
}

