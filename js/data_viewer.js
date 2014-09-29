onload = function() {
	// =====================================================================
	// Resizing app events
	// ===============================================================================================
	var bodyheight = $(window).height()-$('.navbar').height()-10
	$("#MainDisplayContainer").height(bodyheight);
	$(window).resize(function() {
		bodyheight = $(window).height()-$('.navbar').height()-10;
		$("#MainDisplayContainer").height(bodyheight);
		$('[id^="plotRawDataFooter"] canvas').width($('[id^="plotRawDataFooter"]').parent().width())
	});
	
	_initialTime = 0;

	// =====================================================================
	// Build additional color schemes
	// =====================================================================
	GeneratePanelClasses(HighchartColors);

	// =====================================================================
	// Listen for the data from the file
	// =====================================================================
	window.addEventListener('message', function(event) {

		if(event.data.filedata !== undefined){
	
			filedata = event.data['filedata'];
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
			_initialTime = filedata.time;
			plot(filedata);
			if(filedata.sample.length > 5){
				$('#TransientPlotsContainer').show();
				SetupTransientRealtimePlot()
				plottransientFast(filedata);
			}
		
			$('#LoadingIndicator').hide();
		
			// ===============================================================================================
			$('#PlotsContainer').on('shown.bs.collapse', function (e) {
				$(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-down fa-chevron-up');
				$(e.target).children('div[id^=plotRawData]').highcharts().reflow();
			});
			$('#PlotsContainer').on('hide.bs.collapse', function (e) {
			  $(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-up fa-chevron-down');
			});
		}
		
		else if(event.data.graph !== undefined){
			// Add timestamps to macro output
			if(filedata.sample.length > 5){
				for(i in filedata.sample){
					for (r in filedata.sample[i]){
						if(MacroArray[i][r] !== undefined)
							MacroArray[i][r].time = filedata.sample[i][r].time;
					}
				}
				PlotMacroDataRealTime(MacroArray);
			}
		}
	});
}

function errorHandler(e){
	console.log(e);
}