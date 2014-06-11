onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-20
	$("#MainDisplayContainer").height(bodyheight);
	$("#MainDisplayContainer .panel-body").height(bodyheight-80);
	$(window).resize(function() {
		bodyheight = $(window).height()-20;
		$("#MainDisplayContainer").height(bodyheight);
		$("#MainDisplayContainer > .panel-body").height(bodyheight-80);
	});

	// Initial call for empty JSON
	// =====================================================================
	window.addEventListener('message', function(event) {
		var filedata = event.data['filedata'];
		_used_protocols = event.data['used_protocols'];
		_protocols = event.data['protocols'];
		$('#FileName').text(event.data['file']);
		plot(filedata);
		if(filedata.sample.length > 5){
			plottransientFast(filedata);
		}		
	});
}