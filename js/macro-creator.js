onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$("#MainDisplayContainer").height(bodyheight);
		$('[id^="plotRawDataFooter"] canvas').width($('[id^="plotRawDataFooter"]').parent().width())
	});

	//-----------------------------------------------------------------------------------------------------------------------------------
	// Initial variables
	//-----------------------------------------------------------------------------------------------------------------------------------
	var startcode = "var output = false;\nvar variable = json.data_raw;\n\nif (variable){\n  //Your code goes here...\n\n  //Show protocol name in output\n  output = {baseline_sample:json.baseline_sample};\n}\nreturn output;";
	
	// Capture errors and send them to the MacroReturnContent div
	window.javascript_errors = [];
	window.onerror = function(ErrMsg) {
		window.javascript_errors [window.javascript_errors.length] = ErrMsg;
		$('#MacroReturnContent .panel-body').html('<strong>Error:</strong> '+ErrMsg);	// Add error message
		$('#MacroReturnContent').removeClass('panel-default').addClass('panel-danger');	// Change panel color to red
		$('#TestMacroButton').attr('disabled', false);									// Enable Run button again
		return false;
	}
	
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
		$('#TestMacroButton').attr('disabled', true);		// Disable buttons to avoid multiple clicks
		$('#MacroReturnContent .panel-body').empty();		// Empty MacroReturnContent if macro was tested before
		var iterations = $('#MacroTestIterations').val();	// Get number of iterations from form
		var json = $.parseJSON($('#JSONString').val());		// Parse content from text-area as JSON
		var MacroOutHtml = ''								// Define Macro out variable
		var code = MacroCodeContainer.getValue()
		window['TestMacro'] = Function('json', code);
		var start = new Date();
		for(z=0;z<iterations;z++){	
			var MacroOut = window['TestMacro'].apply(null, new Array(json)); // Run macro on dataset
		}
		var end = new Date();
		$.each(MacroOut, function(key, value){
			MacroOutHtml += '<em>'+key +'</em>: '+value+'<br>';  // Get macro output and transform to key value pairs in html
		});
		$('#MacroReturnContent .panel-body').append(MacroOutHtml+'<hr>');
		var exectime = end-start;
		if(isNaN(exectime))
			exectime = 0;
		$('#MacroReturnContent').removeClass('panel-default, panel-danger').addClass('panel-success');		// Color MacroReturnContent green for success
		$('#MacroReturnContent .panel-body').append('<small><em>Execution: '+exectime+' ms</em></small>');	// Add execution time
		$('#TestMacroButton').attr('disabled', false);														// Enable Run button again
		return false;																						// return to avoid page reload.
	});
}