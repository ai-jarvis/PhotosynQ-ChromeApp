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

	// Initial call for empty JSON
	// =====================================================================
	window.addEventListener('message', function(event) {
		if(event.data.filedata === undefined)
			return;
	
		var filedata = event.data['filedata'];
		_protocols = event.data['protocols'];
		_macros = event.data['macros'];
		$('#FileName,#FileNameMini').append(event.data['file']);

		if(typeof filedata['time'] !== undefined){
			var timestamp = filedata['time']
			if(filedata.time_offset !== undefined)
				timestamp += filedata.time_offset * 60000;
			var date = new Date(timestamp);
			$('#FileDate').append(date.toLocaleString());
		}
		plot(filedata);
		if(filedata.sample.length > 5){
			$('#TransientPlotsContainer').show();
			plottransientFast(filedata);
		}
		// ===============================================================================================
		$('#PlotsContainer').on('shown.bs.collapse', function (e) {
			$(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-down fa-chevron-up');
			$(e.target).children('div[id^=plotRawData]').highcharts().reflow();
		});
		$('#PlotsContainer').on('hide.bs.collapse', function (e) {
		  $(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-up fa-chevron-down');
		});	
	});
	
	GeneratePanelClasses(HighchartColors);
}

function errorHandler(e){
	console.log(e);
}