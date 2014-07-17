var _json;

onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$('#CodePanel').height(bodyheight-25);
	$('#ProtocolVariables, #MacroReturnContent .panel-body').height((bodyheight-356)/2);
	$('#CodeMirrorContainer').height(bodyheight-100);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$("#MainDisplayContainer").height(bodyheight);
		$('#CodePanel').height(bodyheight-25);
		$('#ProtocolVariables, #MacroReturnContent .panel-body').height((bodyheight-356)/2);
		$('#CodeMirrorContainer').height(bodyheight-100);
		if(_json !== undefined && _json.sample !== undefined)
			Sparkline(_json.sample[0][0].data_raw);
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
		var protocol = $(this).val();
		$('#ProtocolVariables').empty();
		var variables = '<ul class="list-unstyled">'
		for(i in _json.sample[0][protocol]){
			variables += '<li title="json.'+i+'"><a href="#">'+i+'</a> <small class="text-muted">('+typeof _json.sample[0][0][i]+')</small></li>';
		}
		variables += '</ul>';
		$('#ProtocolVariables').append(variables);
		Sparkline(_json.sample[0][protocol].data_raw);
	});
	
	$('#BtnOpenFile, #ProtocolVariables .alert').on('click', function(e){
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
	
	$('[id^="BtnFunction"]').on('click',function(e){
        e.preventDefault();
        var FunctionCode = $(this).children('small').text();
		MacroCodeContainer.replaceSelection( FunctionCode );
	});
	
	
	$('#ProtocolVariables').on('click','li',function(e){
        e.preventDefault();
        var VariableCode = $(this).attr('title');
		MacroCodeContainer.replaceSelection( VariableCode );
	});


	$('#MacroList').on('click','a',function(e){
        e.preventDefault();
        var MacroID = $(this).attr('data-macro-id');
		MacroCodeContainer.setValue( _macros[MacroID].javascript_code );
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
							$('#ProtocolToTest').append('<option value="'+i+'">Protocol '+i+'</option>');
						}
						$('#ProtocolVariables').empty();
						var variables = '<ul class="list-unstyled">'
						for(i in _json.sample[0][0]){
							variables += '<li title="json.'+i+'"><a href="#">'+i+'</a> <small class="text-muted">('+typeof _json.sample[0][0][i]+')</small></li>';
						}
						variables += '</ul>';
						$('#ProtocolVariables').append(variables);
						Sparkline(_json.sample[0][0].data_raw);
					}
					catch(e){
						//console.log(e);
					}
				}
			});
		});
	}


	function Sparkline(data){
		$('#RawTrace').sparkline(data, { 
			type:'line', 
			lineWidth:2,
			lineColor: $('#RawTrace').prev().css('color'),
			fillColor: $('#RawTrace').prev().css('background-color'),
			height:$('#RawTrace').height()+'px',
			width: $('#RawTrace').width()+'px',
			minSpotColor: false,
			maxSpotColor: false,
			spotColor: false,
			tooltipFormat: '<span>x: {{x}}, y: {{y}}</span>'
		});
	}

	$('#RawTrace').bind('sparklineClick', function(ev) {
		var sparkline = ev.sparklines[0],
		region = sparkline.getCurrentRegionFields();
		MacroCodeContainer.replaceSelection('json.data_raw['+region.x+']');
	});

	window.addEventListener('message', function(event) {
		if(event.data.graph !== undefined){
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
		}
		if(event.data.macros !== undefined){
			_macros = event.data.macros;
			for(i in _macros){
				$('#MacroList').append('<li><a href="#" data-macro-id="'+i+'">'+_macros[i].name+'</a></li>');
			}
		}
	});
}