var _json;

onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$('#CodeMirrorContainer').height(bodyheight-100);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$('#MainDisplayContainer').height(bodyheight);
		$('#CodeMirrorContainer').height(bodyheight-100);
		$('[id^="plotRawDataFooter"] canvas').width($('[id^="plotRawDataFooter"]').parent().width())
	});

	//-----------------------------------------------------------------------------------------------------------------------------------
	// Initial variables
	//-----------------------------------------------------------------------------------------------------------------------------------
	var startcode = "//Define your variables here...\nvar output = false;\n\n//Check if the value exists in json\nif (json.time !== undefined){\n\n\t//Show value and name in output\n\toutput = {'time':json.time};\n}\n\n//Return data\nreturn output;";
		
	// Settings and initializing CodeMirror for the CodeMirrorContainer
	MacroCodeContainer = CodeMirror(document.getElementById('CodeMirrorContainer'),{
		value: startcode,
		mode:  "javascript",
		lineWrapping: true,
		lineNumbers: true
	});

	//-----------------------------------------------------------------------------------------------------------------------------------
	// Action performed when script is run
	//-----------------------------------------------------------------------------------------------------------------------------------
	$('#TestMacroButton').on('click', function(){
		$(this).blur();
		$('#MacroReturnContent .panel-body').empty();		// Empty MacroReturnContent if macro was tested before
		var MacroOutHtml = ''								// Define Macro out variable
		var code = MacroCodeContainer.getValue();
		var protocol = $('#ProtocolToTest').val();
		if(_json.sample[0][protocol].protocol_id !== undefined)
			_json.sample[0][protocol].protocol_id = 0;
		else
			_json.sample[0][protocol]['protocol_id'] = 0;
		
		var postData = {}
		postData['macros'] = {}
		postData['protocols'] = {};
		postData['macros'][0] = {'id':0,'javascript_code':code,'name':'Test Macro','slug':'test_macro'};
		postData['devicedata'] = {'sample':[[_json.sample[0][protocol]]]};
		postData['protocols'][0] = {'macro_id':0};
		
		document.getElementById('MacroSandbox').contentWindow.postMessage({'sandbox':postData}, '*');
		return false;
	});
	
	$('#ProtocolToTest').on('change', function(){
		var variables = []
		for(i in _json.sample[0][$('#ProtocolToTest').val()]){
			variables.push(i);
		}
		$('#ProtocolVariables').empty().append(variables.join(' | '));
	});
	
	document.getElementById('BtnOpenFile').addEventListener('click', function(e){
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
			loadFileData(theEntry);
		  });
	});	

	function loadFileData(_chosenEntry) {
		chosenEntry = _chosenEntry;
		chosenEntry.file(function(file) {
			readAsText(chosenEntry, function(result) {
				var FileRows = result.split('\n');
				for(i in FileRows){
					try{
						var filedata = JSON.parse(FileRows[i]);
						_json = filedata;
						$('#ProtocolToTest').empty();
						for(i in _json.sample[0]){
							$('#ProtocolToTest').append('<option value="'+i+'">'+i+'</option>');
						}
						$('#ProtocolVariables').empty();
						var variables = []
						for(i in filedata.sample[0][0]){
							variables.push(i);
						}
						$('#ProtocolVariables').append(variables.join(' | '));
					}
					catch(e){
						//console.log(e);
					}
				}
			});
		});
	}

	window.addEventListener('message', function(event) {
		if(event.data.graph.error !== undefined){
			$('#MacroReturnContent .panel-body').html('<strong>Error:</strong> '+event.data.graph.error);	// Add error message
			$('#MacroReturnContent').removeClass('panel-default').addClass('panel-danger');	// Change panel color to red
		}
		var MacroOut = event.data.graph[0][0];
		var MacroOutHtml = '';
		if(event.data.graph !== undefined){
			$.each(MacroOut, function(key, value){
				MacroOutHtml += '<em>'+key +'</em>: '+value+'<br>';  // Get macro output and transform to key value pairs in html
			});
			$('#MacroReturnContent .panel-body').append(MacroOutHtml);
			$('#MacroReturnContent').removeClass('panel-default, panel-danger').addClass('panel-success');		// Color MacroReturnContent green for success	
		}
	});
}