var HighchartColors = [
	'#428bca', 
	'#5cb85c', 
	'#f0ad4e', 
	'#5bc0de', 
	'#d9534f', 
	'#492970',
	'#f28f43', 
	'#77a1e5', 
	'#c42525', 
	'#a6c96a'
];

function GeneratePanelClasses(HighchartColors){
	var css= '';
	for(i in HighchartColors){
		var color = HighchartColors[i];
		var color1 = 'rgba('+parseInt(color.substr(1,2), 16)+','+parseInt(color.substr(3,2), 16)+','+parseInt(color.substr(5,2), 16)+',0.80)'
		var color2 = 'rgba('+parseInt(color.substr(1,2), 16)+','+parseInt(color.substr(3,2), 16)+','+parseInt(color.substr(5,2), 16)+',0.45)'
		var color3 = '#101010'
		css += '.panel-custom'+i+' { border-color: '+color+';}'
	
		css += '.panel-custom'+i+' > .panel-heading {'
		css += 'color: '+color3+';'
		css += 'background-color: '+color2+';'
		css += 'border-color: '+color+';'
		css += '}'

		css += '.panel-custom'+i+' > .panel-footer {'
		css += 'color: '+color3+';'
		css += 'background-color: '+color2+';'
		css += '}'
	
		css += '.panel-custom'+i+' > .panel-heading + .panel-collapse > .panel-body {'
		css += 'border-color: '+color+';'
		css += '}'
	
		css += '.panel-custom'+i+' > .panel-heading .badge {'
		css += 'color: '+color3+';'
		css += 'background-color: '+color2+';'
		css += '}'
	
		css += '.panel-custom'+i+' > .panel-footer + .panel-collapse > .panel-body {'
		css += 'border-bottom-color: '+color+';'
		css += '}'

		css += '.panel-custom'+i+' > .panel-heading {'
		css += 'background-image: -webkit-linear-gradient(top, '+color2+' 0%, '+color+' 100%);'
		css += 'background-image: -o-linear-gradient(top, '+color2+' 0%, '+color+' 100%);'
		css += 'background-image: linear-gradient(to bottom, '+color2+' 0%, '+color+' 100%);'
		css += 'background-repeat: repeat-x;'
		css += '}'
		
		css += '.panel-custom'+i+' > .panel-footer {'
		css += 'background-color: '+color1+';';
		css += '}'		
		
	}
	$('head style').append(css);
}

function plot(data){
	$('#MainDisplayContainer .panel-body').css('background-image', 'none');
	if($('#TransientPlotsContainer').html() == ""){
		$('#TransientPlotsContainer').css('min-height','0px');
	}
	$(window).trigger('resize');

	// Initial variables
	// ===============================================================================================
	var postData = {}
	postData['macros'] = [];
	postData['devicedata'] = data;
	postData['protocols'] = [];

	for(i in _used_protocols){
		if(_protocols[_used_protocols[i]] === undefined)
			continue;
		postData['protocols'][_used_protocols[i]] = {'macro_id': _protocols[_used_protocols[i]].macro_id};
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
			var protocolname = 'Unknown protocol';
			if(data[repeat][protocolID].protocol_id !== undefined){
				if(data[repeat][protocolID].protocol_id.match(/(user_)/g)){
					try{
						protocolname = _userprotocols[data[repeat][protocolID].protocol_id].name;
					}
					catch(e){}
				}
				else{
					try{
						protocolname = _protocols[data[repeat][protocolID].protocol_id].name;
					}
					catch(e){}
				}
			}
			
			// replace protocol names here
			if(replacements[protocolname] !== undefined)
				protocolname = replacements[protocolname];
			
			var HTML = '';
			
			// Build graph with container
			if($('#PlotsContainer').attr('data-source') == "file")
				var container = '<div class="col-xs-12 col-sm-6 col-md-6 col-lg-4">';
			else
				var container = '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-6">';
			
			container += '<div class="panel panel-custom'+protocolID+'">';
			
			if(protocolname !== ""){
				container += '<div class="panel-heading" id="plotRawDataHeader'+repeat+''+protocolID+'">';
				container += '<h3 class="panel-title">'
				container += protocolname
				container += '<a type="button" href="#plotRawDatabody'+repeat+''+protocolID+'" title="Show/hide graph" class="btn btn-default btn-xs pull-right" data-toggle="collapse" data-parent="#PlotsContainer"><i class="fa fa-chevron-down"></i></a>'
				container += '</h3>';
				container += '</div>';
			}

			// add graph
			if(data[repeat][protocolID].data_raw.length > 0){
				container += '<div class="panel-body collapse in" id="plotRawDatabody'+repeat+''+protocolID+'">';
				container += '<div id="plotRawData'+repeat+''+protocolID+'" style="padding:0px;"></div>';
				container += '</div>';
			}

			// add environmental data
			var col = 1;
			HTML += '<tr>';
			for(values in data[repeat][protocolID]){
				if($.inArray(values, variablehidephone) == -1){
					if(col % 2 && col !== 1)
						HTML += '</tr><tr>';
					HTML += '<td style="width:50%">';
					HTML += '<em class="text-muted">';
					if(replacements[values] != undefined)
						HTML += replacements[values]
					else
						HTML += values
					
					HTML += ':</em> ';
					HTML += '<span style="margin-left:10px">'+data[repeat][protocolID][values]+'</span>';
					HTML += '</td>';
					col++;
				}
			}
			HTML += '</tr>'
				
			container += '<table class="table table-condensed table-bordered" id="plotRawDataTable'+repeat+''+protocolID+'">'+HTML+'</table>';

			//build footer
			container += '<div class="panel-footer" id="plotRawDataFooter'+repeat+''+protocolID+'" style="display:none;margin-top:-1px">';
			container += '<div class="backgroundgraph" style="position:absolute;margin-left:-15px; margin-top:10px;"></div>';
			container += '<div class="row" style="z-index:2;min-height:90px;">';
			container += '<div class="col-md-12 text-right"><em>'+protocolname+'</em></div>';
			container += '<div class="col-md-12 simplecontent"></div>';
			container += '</div>';
			container += '</div>';

			//close panel container
			container += '</div>';
			container += '</div>';

		
			MacroArray[protocolID] = macro;

			// Add container
			$('#PlotsContainer').append(container);

			// add data to graph and built graph
			if(data[repeat][protocolID].data_raw.length > 0){
				plotoptionschromeextension['series'][0]['data'] = data[repeat][protocolID].data_raw;
				plotoptionschromeextension.exporting = {
					buttons: {
						contextButton: {
							menuItems: [{
								text: 'Print',
								onclick: function() {
									this.print();
								}
							}, {
								text: 'Save as png image',
								onclick: function() {
									SaveGraphToFile(this.getSVG(),'png','Photosynq');
								},
								separator: false
							},
							{
								text: 'Save as jpeg image',
								onclick: function() {
									SaveGraphToFile(this.getSVG(),'jpeg','Photosynq');
								},
								separator: false
							},
							{
								text: 'Save as pdf image',
								onclick: function() {
									SaveGraphToFile(this.getSVG(),'pdf','Photosynq');
								},
								separator: false
							}]
						}
					}
				}
					
				$('#plotRawData'+repeat+''+protocolID).highcharts(plotoptionschromeextension);
				$('#plotRawData'+repeat+''+protocolID).highcharts().series[0].update({
					 color: HighchartColors[protocolID]
				});
				
				$('#plotRawDataFooter'+repeat+''+protocolID+' .backgroundgraph').sparkline(
					plotoptionschromeextension.series[0].data, {
						width: $('#plotRawDataHeader'+repeat+''+protocolID).parent().width()+'px',
						height: '90px',
						type: 'line',
						lineColor: $('#plotRawDataHeader'+repeat+''+protocolID).css('border-color'),
						lineWidth: 3,
						fillColor: $('#plotRawDataHeader'+repeat+''+protocolID).css('background-color'),
						minSpotColor: false,
						maxSpotColor: false,
						spotColor: false,
						disableTooltips: true,
						disableHighlight: true
					});
			}
		}
	}

	// Send data to sandbox or clean up no macro message
	// ===============================================================================================
	if( postData['protocols'].length > 0){
		document.getElementById('MacroSandbox').contentWindow.postMessage({'sandbox':postData}, '*');
	}

	// Reset Measurement Protocols
	// ===============================================================================================
	_used_protocols = []
}

// Apply changes from macros to plots
// ===============================================================================================
window.addEventListener('message', function(event) {
	if(event.data.graph === undefined)
		return false;
	
	for(repeat in event.data.graph){

		for(protocolID in event.data.graph[repeat]){
			
			if(event.data.graph[repeat][protocolID] !== undefined){
				// Add macro html output to graph info container
				var simpleHTML ='';
				var HTML = '<tr class="macroout">';
				var col = 1;
				for(key in event.data.graph[repeat][protocolID]){
					if(key == 'GraphType' || key == 'HTML' || key == 'Macro')
						continue;
					else{
						simpleHTML +='<div class="col-md-3 text-center">'
						if(col % 2 && col !== 1)
							HTML += '</tr><tr class="macroout">';
						HTML += '<td style="width:50%">';
						HTML += '<em class="text-muted">';
						if(replacements[key] != undefined){
							HTML += replacements[key]
							simpleHTML += '<h4>'+replacements[key]+'</h4>'
						}
						else{
							HTML += key
							simpleHTML += '<h4>'+key+'</h4>'
						}
						HTML += ':</em> ';
						HTML += '<span style="margin-left:10px">'+event.data.graph[repeat][protocolID][key]+'</span>';
						simpleHTML +=MathROUND(event.data.graph[repeat][protocolID][key],3)+'</div>';
						HTML += '</td>';
						col++;
					}
				}
				HTML += '</tr>'
				
				$('#plotRawDataTable'+repeat+''+protocolID+' tbody').prepend(HTML);
				
				$('#plotRawDataFooter'+repeat+''+protocolID+' .simplecontent').html(simpleHTML);

				$('#plotRawDataTable'+repeat+''+protocolID+' .macroout').each(function(k,v){
					if($(v).children('td').length == 1)
						$(v).children('td').attr('colspan','2');
				});
				
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

// Show alert, when measurement is done
// ===============================================================================================
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
			exporting: {
				buttons: {
					contextButton: {
						menuItems: [{
							text: 'Print',
							onclick: function() {
								this.print();
							}
						}, {
							text: 'Save as png image',
							onclick: function() {
								SaveGraphToFile(this.getSVG(),'png','Photosynq');
							},
							separator: false
						},
						{
							text: 'Save as jpeg image',
							onclick: function() {
								SaveGraphToFile(this.getSVG(),'jpeg','Photosynq');
							},
							separator: false
						},
						{
							text: 'Save as pdf image',
							onclick: function() {
								SaveGraphToFile(this.getSVG(),'pdf','Photosynq');
							},
							separator: false
						}]
					}
				}
			},
			series: [],
			credits: {
				enabled: false
			}
		});
	}
	
	var TransientChart = $('#TransientPlotsContainer').highcharts();

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
						text: 'Save as png image',
						onclick: function() {
							SaveGraphToFile(this.getSVG(),'png','Photosynq');
						},
						separator: false
					},
					{
						text: 'Save as jpeg image',
						onclick: function() {
							SaveGraphToFile(this.getSVG(),'jpeg','Photosynq');
						},
						separator: false
					},
					{
						text: 'Save as pdf image',
						onclick: function() {
							SaveGraphToFile(this.getSVG(),'pdf','Photosynq');
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


// ===============================================================================================
//						Save graph to file
// ===============================================================================================
function SaveGraphToFile(data, type, name){
	$.ajax({
		type: 'POST',
		data: 'async=true&type='+type+'&width=1024&options=' + data,
		url: 'http://export.highcharts.com',
		success: function (data) {
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'blob';
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4){
					if(xhr.response !== null && xhr.response !== undefined){					
						chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: name, accepts: [{extensions: [type]}] }, function(writableFileEntry) {
							if(!writableFileEntry)
								return;
							writableFileEntry.createWriter(function(writer) {
							  writer.onerror = errorHandler;
							  writer.onwriteend = function(e) {
								console.log('File saved.');
							  };
								writer.write(xhr.response);
							}, errorHandler);
						});
						
						
					}
				}
			}
			xhr.open('GET', 'http://export.highcharts.com/' + data, true);
			xhr.send();            	
		  }
	});
}

