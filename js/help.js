onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$("#MainDisplayContainer").height(bodyheight);
	});
}