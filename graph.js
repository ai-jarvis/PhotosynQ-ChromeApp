// ===============================================================================================
// Define colors for plots
// ===============================================================================================
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

// ===============================================================================================
// Key value pairs to be excluded from plotting
// ===============================================================================================
var ExcludeFromTransientPlot = [
	'time',
	'protocol_id',
	'data_raw',
	'r',
	'g',
	'b',
	'message',
	'macro_id',
	'slope_34',
	'yintercept_34',
	'slope_35',
	'yintercept_35',
	'get_ir_baseline',
	'GraphType',
	'HTML',
	'Macro'
]

// ===============================================================================================
// Generate classes for plot containers
// ===============================================================================================
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

// ===============================================================================================
// Plot Protocols after measurement
// ===============================================================================================
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
	postData['plottype'] = "post"
	
	MacroArray = [];
	
	var cal = data;
	var containercount = 0;
	
	data = data['sample'];

	// Loop through array from data.js
	// ===============================================================================================
	for(repeat in data){

		for(protocolID in data[repeat]){
			
			containercount++;	
				
			// Add macros according to macro_id from console measurement
			if(data[repeat][protocolID].macro_id !== undefined){
				if(_macros[data[repeat][protocolID].macro_id] !== undefined)
					postData['macros'][data[repeat][protocolID].macro_id] = _macros[data[repeat][protocolID].macro_id]
			}

			// Add macros according to macro_id from console measurement
			if(data[repeat][protocolID].protocol_id !== undefined){
				if(data[repeat][protocolID].protocol_id !== "" && _protocols[data[repeat][protocolID].protocol_id] !== undefined){
					if(_protocols[data[repeat][protocolID].protocol_id].macro_id !== undefined){
						postData['protocols'][data[repeat][protocolID].protocol_id] = {'macro_id': _protocols[data[repeat][protocolID].protocol_id].macro_id};
						if(_macros[_protocols[data[repeat][protocolID].protocol_id].macro_id] !== undefined)
							postData['macros'][_protocols[data[repeat][protocolID].protocol_id].macro_id] = _macros[_protocols[data[repeat][protocolID].protocol_id].macro_id]
					}
				}
			}

			// initial variables in loop
			var macro = {'HTML':'<span id="MacroOutput'+repeat+''+protocolID+'">No macro available</span>'};
			var protocolname = 'Unknown protocol';
			if(data[repeat][protocolID].protocol_id !== undefined){
				try{
					protocolname = _protocols[data[repeat][protocolID].protocol_id].name;
				}
				catch(e){}
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
				if(ToExclude.indexOf(values) == -1){
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
									SaveGraphToFile(this.getSVG(),'png','Photosynq_Graph.png');
								},
								separator: false
							},
							{
								text: 'Save as jpeg image',
								onclick: function() {
									SaveGraphToFile(this.getSVG(),'jpeg','Photosynq_Graph.jpg');
								},
								separator: false
							},
							{
								text: 'Save as pdf image',
								onclick: function() {
									SaveGraphToFile(this.getSVG(),'pdf','Photosynq_Graph.pdf');
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

	if(containercount == 1){
		$('#PlotsContainer > div').removeClass().addClass('col-xs-12 col-sm-12 col-md-12 col-lg-12');
		$(window).resize();
	}

	// Send data to sandbox or clean up no macro message
	// ===============================================================================================
	if( postData['macros'].length > 0){
		document.getElementById('MacroSandbox').contentWindow.postMessage({'sandbox':postData}, '*');
	}

	// Reset Measurement Protocols
	// ===============================================================================================
	_used_protocols = []
}

// ===============================================================================================
// Set up the transient plot
// ===============================================================================================
function SetupTransientRealtimePlot(){

	var timeOffset = new Date();
	timeOffset = timeOffset.getTimezoneOffset();

	$('#TransientPlotsContainer').highcharts({
		global: {
			timezoneOffset: timeOffset
		},
		chart: {
			zoomType: 'xy',
			animation: false
		},
		title: {
			text: 'Realtime Plot'
		},
		xAxis: [{
			type: 'datetime', //ensures that xAxis is treated as datetime values
			dateTimeLabelFormats: { 
				millisecond: '%S.%L ms',
				second: '%M:%S s',
				minute: '%H:%M m',
				hour: '%H:%M h',
				day: '%e. %b d',
				week: '%e. %b weeks',
				month: '%b \'%y months',
				year: '%Y a'
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
				states: {
					hover: {
						enabled: true,
						halo: {
							size: 0
						}
					}
				}
			}
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
							SaveGraphToFile(this.getSVG(),'png','PhotosynQ_Graph.png');
						},
						separator: false
					},
					{
						text: 'Save as jpeg image',
						onclick: function() {
							SaveGraphToFile(this.getSVG(),'jpeg','PhotosynQ_Graph.jpg');
						},
						separator: false
					},
					{
						text: 'Save as pdf image',
						onclick: function() {
							SaveGraphToFile(this.getSVG(),'pdf','PhotosynQ_Graph.pdf');
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

// ===============================================================================================
// Plot current dataset
// ===============================================================================================
function PlotDataRealTime(data){

	// Get transient graph
	// ===============================================================================================
	var TransientChart = $('#TransientPlotsContainer').highcharts();

	// Loop through array from data
	// ===============================================================================================
	var lookupSeries = {}
	// remove initial yAxis
	if(TransientChart.series.length == 0)
		TransientChart.get('inital').remove(false);

	for(i in TransientChart.series)
		lookupSeries[TransientChart.series[i].userOptions.id] = parseInt(i);
	
	for(evkey in data){
		if(ExcludeFromTransientPlot.indexOf(evkey) > -1)
			continue;
		
		if(lookupSeries[evkey] === undefined){

			var yaxis_label = evkey;
			
			if(replacements[evkey] !== undefined)
				yaxis_label = replacements[evkey];

			var yAxis = { // Secondary yAxis
				id: evkey,
				title: {
					text: yaxis_label
				}
			}
			if(TransientChart.yAxis.length % 2)
				yAxis['opposite'] = true;
		
			TransientChart.addAxis(yAxis);
			TransientChart.addSeries({
				id: evkey,
				name: yaxis_label,
				type: 'line',
				animation: false,
				yAxis: evkey,
				data: [[(data['time']-_initialTime),parseFloat(data[evkey])]]
			},false);		
		}
		else{
			TransientChart.series[lookupSeries[evkey]].addPoint([(data['time']-_initialTime),parseFloat(data[evkey])],false);
		}
	}
	TransientChart.redraw();
	
	var postData = {}
	postData['macros'] = [];
	postData['devicedata'] = {"time":data['time'], "sample":[[data]]};
	postData['protocols'] = [];
	postData['plottype'] = "transient"
	postData['timestamp'] = data['time'];

	if(data.macro_id !== undefined){
		if(_macros[data.macro_id] !== undefined)
			postData['macros'][data.macro_id] = _macros[data.macro_id]
	}

	if(data.protocol_id !== undefined){
		if(_protocols[data.protocol_id] !== undefined){
			if(_protocols[data.protocol_id].macro_id !== undefined){
				postData['macros'].push(_macros[_protocols[data.protocol_id].macro_id]);
				postData['protocols'][_protocols[data.protocol_id].id] = _protocols[data.protocol_id];
			}
		}
	}

	if(postData.macros.length > 0)
		document.getElementById('MacroSandbox').contentWindow.postMessage({'sandbox':postData}, '*');

}

// ===============================================================================================
// Plot current data returned from macro
// ===============================================================================================
function PlotMacroDataRealTime(data){

	// Get transient graph
	// ===============================================================================================
	var TransientChart = $('#TransientPlotsContainer').highcharts();

	var lookupSeries = {}
	
	// remove initial yAxis
	if(TransientChart.series.length == 0)
		TransientChart.get('inital').remove(false);
					
	for(i in TransientChart.series)
		lookupSeries[TransientChart.series[i].userOptions.id] = i;

	for(i in data){
		for(r in data[i]){
			for(evkey in data[i][r]){
				if(ExcludeFromTransientPlot.indexOf(evkey) > -1)
					continue;

				if(lookupSeries[evkey] === undefined){

					var yaxis_label = evkey;
			
					if(replacements[evkey] !== undefined)
						yaxis_label = replacements[evkey];

					var yAxis = { // Secondary yAxis
						id: evkey,
						title: {
							text: yaxis_label
						}
					}
					if(TransientChart.yAxis.length % 2)
						yAxis['opposite'] = true;

					TransientChart.addAxis(yAxis);
					TransientChart.addSeries({
						id: evkey,
						name: yaxis_label,
						type: 'line',
						animation: false,
						yAxis: evkey,
						data: [[(data[i][r]['time']-_initialTime),parseFloat(data[i][r][evkey])]]
					},false);
					
					for(sID in TransientChart.series)
						lookupSeries[TransientChart.series[sID].userOptions.id] = sID;
				}
				else{
					TransientChart.series[lookupSeries[evkey]].addPoint([(data[i][r]['time']-_initialTime),parseFloat(data[i][r][evkey])],false);
				}
			}
		}		
	}		
	TransientChart.redraw();
}

// ===============================================================================================
// Plot data in transient plot
// ===============================================================================================
function plottransientFast(data){

	// Initialize parameters
	// ===============================================================================================
	
	var _initialTime = data.time;
	var timeOffset = 0;
	
	if(data.time_offset !== undefined)
		timeOffset = data.time_offset
	
	data = data['sample'];
	
	var TransientChart = $('#TransientPlotsContainer').highcharts();
	
	/*TransientChart.setOptions({
        global: {
            timezoneOffset: timeOffset
        }
    });*/

	// Loop through array from data
	// ===============================================================================================
	var lookupSeries = {}
	TransientChart.get('inital').remove(false);

	for(repeat in data){

		for(protocolID in data[repeat]){
			
			for(evkey in data[repeat][protocolID]){
				
				if(ExcludeFromTransientPlot.indexOf(evkey) > -1)
					continue;
				
				if(lookupSeries[evkey] === undefined){

					var yaxis_label = evkey;
		
					if(replacements[evkey] !== undefined)
						yaxis_label = replacements[evkey];

					var yAxis = { // Secondary yAxis
						id: evkey,
						title: {
							text: yaxis_label
						}
					}
					
					if(TransientChart.yAxis.length % 2)
						yAxis['opposite'] = true;
	
					TransientChart.addAxis(yAxis);
					TransientChart.addSeries({
						id: evkey,
						name: yaxis_label,
						animation: false,
						type: 'line',
						yAxis: evkey,
						data: [[(data[repeat][protocolID].time-_initialTime),parseFloat(data[repeat][protocolID][evkey])]]
					},false);
					
					for(i in TransientChart.series){
						if(TransientChart.series[i].userOptions.id == evkey)
							lookupSeries[evkey] = parseInt(i);
					}

				}
				else{
					TransientChart.series[lookupSeries[evkey]].addPoint([(data[repeat][protocolID].time-_initialTime),parseFloat(data[repeat][protocolID][evkey])],false);
				}
			}
		}
	}

	TransientChart.redraw();
}

// ===============================================================================================
// Save graph to file
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
						var mimetype = 'image/png';
						var extension = 'png';
						if(type == 'jpeg'){
							mimetype = 'image/jpeg';
							extension = 'jpg';						
						}
						if(type == 'pdf'){
							mimetype = 'application/pdf';
							extension = 'pdf';					
						}
						chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: name, accepts: [{extensions: [extension]}] }, function(writableFileEntry) {
							if(!writableFileEntry)
								return;
							writableFileEntry.createWriter(function(writer) {
							  writer.onerror = function(e) {
								WriteMessage('Graph couldn\'t be saved', 'danger');
							  };
							  writer.onwrite = function(e) {
								writer.onwrite = null;
								writer.truncate(writer.position);
								WriteMessage('Graph saved as '+extension, 'success');
							  };
							  writer.write(xhr.response, {type: mimetype});
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


// ===============================================================================================
// Apply changes from macros to plots
// ===============================================================================================
window.addEventListener('message', function(event) {
	
	if(event.data.graph_transient !== undefined){
		PlotMacroDataRealTime(event.data.graph_transient);
		return false;
	}
		
	if(event.data.graph === undefined)
		return false;
	
	for(repeat in event.data.graph){

		for(protocolID in event.data.graph[repeat]){
			
			if(event.data.graph[repeat][protocolID] !== undefined){
				// Add macro html output to graph info container
				var simpleHTML ='';
				var HTML = '<tr class="macroout warning">';
				var col = 1;
				for(key in event.data.graph[repeat][protocolID]){
					if(key == 'GraphType' || key == 'HTML' || key == 'Macro')
						continue;
					else{
						simpleHTML +='<div class="col-md-3 text-center">'
						if(col % 2 && col !== 1)
							HTML += '</tr><tr class="macroout warning">';
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
				
				if($('#plotRawData'+repeat+''+protocolID).length > 0){
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
		
	}
	MacroArray = event.data.graph;
});

// ===============================================================================================
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