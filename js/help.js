onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$("#MainDisplayContainer").height(bodyheight);
	});
	var version = chrome.runtime.getManifest().version;
	$('#AppVersion').text('Version: '+version);
	
	// Filter Parameter
	// =====================================================================
	jQuery.expr[':'].contains = function(a, i, m) { 
		return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0; 
	};

	$('#SearchHelpContent').on('keyup', function(){
		if($(this).val() != "" && $(this).val().length > 1){
			$('div [id^="Help"], hr').hide();
			$('div [id^="Help"]:contains("'+$(this).val()+'")').show();
		}
		else{
			$('div [id^="Help"],hr').show();
		}	
		return false;
	});
	
}