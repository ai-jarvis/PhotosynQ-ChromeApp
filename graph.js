function plot(data){
	$('#MainDisplayContainer .panel-body').css('background-image', 'none');
	if($('#TransientPlotsContainer').html() == ""){
		$('#TransientPlotsContainer').css('min-height','0px');
	}

	// Initial variables
	// ===============================================================================================
	var postData = {}
	postData['macros'] = [];
	postData['devicedata'] = data;
	postData['protocols'] = [];
	
	for(i in _used_protocols){
		postData['protocols'].push({'id':_used_protocols[i],'macro_id':_protocols[_used_protocols[i]].macro_id});
		if(_protocols[_used_protocols[i]].macro_id !== '' && _macros[_protocols[_used_protocols[i]].macro_id] !== undefined)
			postData['macros'][_protocols[_used_protocols[i]].macro_id] = _macros[_protocols[_used_protocols[i]].macro_id];
	}

	MacroArray = [];

	var cal = data;
	data = data['sample'];


	// Loop through array from data.js
	// ===============================================================================================
	for(repeat in data){

		for(protocolID in data[repeat]){

		// initial variables in loop
			var macro = {'HTML':'<span id="MacroOutput'+repeat+''+protocolID+'">No macro available</span>'};
			var protocolname = "";
			if( postData['protocols'].length > 0){
				protocolname = _protocols[postData['protocols'][protocolID].id].name;
				if(replacements[protocolname] !== undefined)
					protocolname = replacements[protocolname];
			}
			
			var HTML = macro.HTML;
			
			// Build graph with container
			var container = '<div class="panel panel-info">';
			if(protocolname !== ""){
				container += '<div class="panel-heading">';
				container += '<h3 class="panel-title">'+protocolname+'</h3>';
				container += '</div>';
			}
			if(data[repeat][protocolID].data_raw.length > 0){
				container += '<div class="panel-body">';
				container += '<div id="plotRawData'+repeat+''+protocolID+'"></div>';
				container += '</div>';
			}
			
			MacroArray[protocolID] = macro;

			// add environmental data
			for(values in data[repeat][protocolID]){
				if($.inArray(values, variablehidephone) == -1){
					if(replacements[values] != undefined)
						HTML += ' | <b>'+replacements[values]+':</b> <i>'+data[repeat][protocolID][values]+'</i>';
					else
						HTML += ' | <b>'+values+':</b> <i>'+data[repeat][protocolID][values]+'</i>';
				}
			}

			container += '<ul class="list-group"><li class="list-group-item list-group-item-success">'+HTML+'</li></ul>';
			container += '</div>';
		

			// Add container
			$('#PlotsContainer').append(container);

			// add data to graph and built graph
			if(data[repeat][protocolID].data_raw.length > 0){
				plotoptionschromeextension['series'][0]['data'] = data[repeat][protocolID].data_raw;
				$('#plotRawData'+repeat+''+protocolID).highcharts(plotoptionschromeextension);
			}
		}
	}

	// Send data to sandbox
	// ===============================================================================================
	if( postData['protocols'].length > 0){
		document.getElementById('MacroSandbox').contentWindow.postMessage({'sandbox':postData}, '*');
	}

	// Reset Measurement Protocols
	// ===============================================================================================
	_used_protocols = []

	// Apply changes from macros to plots
	// ===============================================================================================
	window.addEventListener('message', function(event) {
		if(event.data.graph === undefined)
			return false;
		
		for(repeat in event.data.graph){
	
			for(protocolID in event.data.graph[repeat]){
				
				if(event.data.graph[repeat][protocolID] !== undefined){
					
					// Add macro html output to graph info container
					$('#MacroOutput'+repeat+''+protocolID).html(event.data.graph[repeat][protocolID].HTML);

					MacroArray[protocolID] = event.data.graph[repeat][protocolID];
				
					if(event.data.graph[repeat][protocolID].GraphType == 'line'){
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							 marker: { enabled: false}
						});
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							lineWidth: 4
						});
					}
					if(event.data.graph[repeat][protocolID].GraphType == 'points'){
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							 marker: { enabled: true}
						});
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							lineWidth: 0
						});
					}
					if(event.data.graph[repeat][protocolID].GraphType == 'pointline'){
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							 marker: { enabled: true}
						});
						$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
							lineWidth: 4
						});
					}
				}
			}
			
		}
	});

	if(chrome.app.window.current().isMinimized()){
		chrome.notifications.create("measurement", {
			type: "basic",
			title: "PhotosynQ",
			message: "Measurement done.",
			iconUrl: "img/PhotosynQ-128.png"
		}, function(){
			setTimeout(function() {
			chrome.notifications.clear("measurement", function(){});
			}, 3000);
		});
	}
}

function plottransient(data){

	var timeOffset = new Date();
	timeOffset = timeOffset.getTimezoneOffset();

	initalTime = dataRead.match(/(\"time\": )(\d{13})/i);
	initalTime = parseInt(initalTime[2]);


	// Initial graph
	// ===============================================================================================
	if($('#TransientPlotsContainer').html() == ""){
		$('#TransientPlotsContainer').highcharts({
			global: {
				timezoneOffset: timeOffset
			},
			chart: {
				zoomType: 'xy',
				animation: false
			},
			title: {
				text: 'Environmental Parameters'
			},
			xAxis: [{
				type: 'datetime', //ensures that xAxis is treated as datetime values
				dateTimeLabelFormats: { 
					millisecond: '%S.%L',
					second: '%M:%S',
					minute: '%H:%M',
					hour: '%H:%M',
					day: '%e. %b',
					week: '%e. %b',
					month: '%b \'%y',
					year: '%Y'
				},
				startOnTick: false,
				showFirstLabel: false
			}],
			yAxis: [{
				id:"inital"
			}],
			tooltip: {
				shared: true,
				useHTML: true,
				headerFormat: '<table>',
				pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
				'<td style="text-align: right"><b>{point.y}</b></td></tr>',
				footerFormat: '</table>'
			},
			legend: {
				layout: 'horizontal',
				align: 'center',
				verticalAlign: 'bottom'
			},
			series: [],
			credits: {
				enabled: false
			}
		});
	}
	
	var TransientChart = $('#TransientPlotsContainer').highcharts()

	// Loop through array from data
	// ===============================================================================================
	jsondata = JSON.parse(data);
	var iii =0;
	if(TransientChart.series.length === 0){
		TransientChart.get('inital').remove();
		for(evkey in jsondata){
			if(evkey == 'temperature' || evkey == 'relative_humidity' || evkey == 'light_intensity' || evkey == 'co2'){
				var yAxis = { // Secondary yAxis
					id: evkey,
					title: {
						text: evkey
					}
				}
				if(iii % 2)
					yAxis['opposite'] = true;
					
				TransientChart.addAxis(yAxis);
				TransientChart.addSeries({
					name: evkey,
					type: 'line',
					yAxis: evkey,
					data: [[(jsondata['time']-jsondata['time']),jsondata[evkey]]]
				});
			iii++;
			}
		}
	}
	else{
		var lookupSeries = {}
		for(i in TransientChart.series)
			lookupSeries[TransientChart.series[i].name] = parseInt(i);
			
		for(evkey in jsondata){
			if(evkey == 'temperature' || evkey == 'relative_humidity' || evkey == 'light_intensity' || evkey == 'co2'){
				if(lookupSeries[evkey] !== undefined && jsondata[evkey] !== undefined)
					TransientChart.series[lookupSeries[evkey]].addPoint([(jsondata['time']-initalTime),jsondata[evkey]],false);
			}
		}
	}
	TransientChart.redraw();
}


function plottransientFast(data){

	var iniTime = data.time;
	var timeOffset = 0;
	var marker = true;
	
	if(data.time_offset !== undefined)
		timeOffset = data.time_offset
	
	data = data['sample'];
	
	if(data.length > 300)
		marker = false;

	console.log(marker);
	
	// Initial graph
	// ===============================================================================================
	var TransientFastPlotOptions = {
		global: {
            timezoneOffset: timeOffset
        },
		chart: {
			zoomType: 'xy',
			animation: false
		},
		title: {
			text: 'Environmental Parameters'
		},
		xAxis: [{
			type: 'datetime', //ensures that xAxis is treated as datetime values
			dateTimeLabelFormats: { 
				millisecond: '%S.%L',
				second: '%M:%S',
				minute: '%H:%M',
				hour: '%H:%M',
				day: '%e. %b',
				week: '%e. %b',
				month: '%b \'%y',
				year: '%Y'
			},
			startOnTick: false,
			showFirstLabel: false
		}],
		yAxis: [{
			id:"inital"
		}],
		tooltip: {
            shared: true,
            useHTML: true,
            headerFormat: '<table>',
            pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
            '<td style="text-align: right"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>'
		},
		legend: {
			layout: 'horizontal',
			align: 'center',
			verticalAlign: 'bottom'
		},
		plotOptions: {
            series: {
                marker: {
                    enabled: marker
                }
            }
        },
		series: [],
		credits: {
			enabled: false
		},
		exporting: {
			buttons: {
				contextButton: {
					menuItems: [{
						text: 'Print',
						onclick: function() {
							this.print();
						}
					}, {
						text: 'Save as PNG',
						onclick: function() {
							SaveGraphAs(TransientFastPlotOptions,'png');
						},
						separator: false
					}]
				}
			}
		}
	};
	
	//var TransientChart = $('#TransientPlotsContainer').highcharts();
	
	// Loop through array from data
	// ===============================================================================================
	var iii =0;
	for(repeat in data){

		for(protocolID in data[repeat]){
		
			jsondata = data[repeat][protocolID]

			if(TransientFastPlotOptions.series.length === 0){
				for(evkey in jsondata){
					if(evkey == 'temperature' || evkey == 'relative_humidity' || evkey == 'light_intensity' || evkey == 'co2'){
						var yAxis = { // Secondary yAxis
							id: evkey,
							title: {
								text: evkey
							}
						}
						if(iii % 2)
							yAxis['opposite'] = true;
					
						TransientFastPlotOptions.yAxis[iii] = yAxis;
						TransientFastPlotOptions.series[iii] = {
							name: evkey,
							type: 'line',
							yAxis: evkey,
							data: [[(jsondata['time']-iniTime),jsondata[evkey]]]
						};
					iii++;
					}
				}
				console.log(TransientFastPlotOptions);
			}
			else{
				var lookupSeries = {}
				for(i in TransientFastPlotOptions.series)
					lookupSeries[TransientFastPlotOptions.series[i].name] = parseInt(i);
			
				for(evkey in jsondata){
					if(evkey == 'temperature' || evkey == 'relative_humidity' || evkey == 'light_intensity' || evkey == 'co2'){
						if(lookupSeries[evkey] !== undefined && jsondata[evkey] !== undefined)
							TransientFastPlotOptions.series[lookupSeries[evkey]].data.push([(jsondata['time']-iniTime),jsondata[evkey]]);
					}
				}
			}
		}
	}
	//TransientChart.redraw();
	$('#TransientPlotsContainer').highcharts(TransientFastPlotOptions);
}