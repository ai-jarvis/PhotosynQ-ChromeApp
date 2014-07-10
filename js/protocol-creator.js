onload = function() {
	// Initial call for empty JSON
	// =====================================================================
	GenerateParameterList(parameters);
	window.addEventListener('message', function(event) {
		GeneratePresetList(event.data.db);
		GenerateSavedProtocolList(event.data.user)
		_presets = event.data.db;
		_userprotocols = event.data.user
		_event = event;
	});
	GenerateAndValidateScript();

	// Collapsable Icon Toggle
	// =====================================================================  
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		if($(e.target).attr('href') == '#parameter_list'){
			$('#parameter_used').parent().show();
			$('#presets_info').hide();
		}
		if($(e.target).attr('href') == '#presets_list'){
			$('#parameter_used').parent().hide();
			$('#presets_info').show();
		}
	});

	// Connection Lists Environmental Parameters
	// =====================================================================
	$( "#parameter_unused" ).sortable({
		connectWith: "#parameter_used",
 		revert: 200,
 		tolerance: "pointer",
		start: function( event, ui ) {
			$( "#parameter_used" ).addClass('bg-warning')
		},
		stop: function( event, ui ) {
			$('#parameter_used li .form-group div').show();
			$('#parameter_used li .control-label').removeClass('col-sm-12').addClass('col-sm-5');
			$('#parameter_used').removeClass('bg-warning');
			$('#parameter_used li').sort(SortParameterList).appendTo('#parameter_used');
		}
	}).disableSelection();

	$( "#parameter_used" ).sortable({
		connectWith: "#parameter_unused",
		revert: 200,
		tolerance: "pointer" ,
		stop: function( event, ui ) {
			$('#parameter_unused li .form-group div').hide();
			$('#parameter_unused li .control-label').removeClass('col-sm-5').addClass('col-sm-12');
			$('#parameter_unused li').sort(SortParameterList).appendTo('#parameter_unused');
		}
	}).disableSelection();
	
    $( "#preset_sort" ).sortable({
    	stop: function( event, ui ) {
    		GenerateMultiScriptPlot();
    	}
    });
    $( "#preset_sort" ).disableSelection();

	// JSON building triggers
	// =====================================================================
	$( "#parameter_unused,#parameter_used" ).on( "sortstop", function( event, ui ) {
		$('#'+$(this).attr('id')+' li').each(function(i,value){
			if($(value).find('input, select').attr('data-group') == ui.item.find('input, select').attr('data-group') && $(value).find('input, select').attr('data-group') !== undefined && $(value).find('input, select').attr('data-group') !== "")
				$(value).appendTo('#'+ui.item.parent().attr('id'));
		});
		GenerateAndValidateScript();
	});
	
	$('#parameter_used').on('input','input, select', function(){
		GenerateAndValidateScript();
	});
	
	$('#parameter_used').on('change','input[type="radio"]',function(){
		GenerateAndValidateScript();
	});	

	// Clear Protocol Fields 
	// =====================================================================
	$('#parameter_clear').on('click', function(){
		$('#parameter_used li').appendTo("#parameter_unused");
		$('#parameter_unused li .form-group div').hide()
		$('#parameter_unused li .control-label').removeClass('col-sm-5').addClass('col-sm-12')
		GenerateAndValidateScript();
	});

	// JSON building function
	// =====================================================================
	function GenerateAndValidateScript(){
		var json = {}
		var validity = true;
		$('#RawProtocol').removeClass('panel-danger');
		$('#ScriptGraphContainer').removeClass('panel-danger panel-success').addClass('panel-success');
		$('#ScriptGraphContainer .panel-title button').removeClass('disabled');
		$('li').removeClass('has-error');

		// Environmental parameter control
		$('#parameter_used li').each(function(i,k){
			if($(k).attr('id') == 'light_intensity' || $(k).attr('id') == 'relative_humidity'|| $(k).attr('id') == 'co2' || $(k).attr('id') == 'temperature' || $(k).attr('id') == 'contactless_temperature'){
				if(json['environmental'] === undefined)
					json['environmental'] = []
				json['environmental'].push([$(k).find( "input:checked").attr('name'),parseInt($(k).find( "input:checked").attr('value'))]);
			}
		});

		// Pulse parameter control
		var arrpulseblocks = $('#parameter_used li input[name="pulses"]').val();
		var pulseblocks = 0;
		var pulsenum = 0;
		if(arrpulseblocks !== undefined){
			arrpulseblocks = arrpulseblocks.split(',');
			pulseblocks = arrpulseblocks.length;
			json['pulses'] = [];
			for(i in arrpulseblocks){
				var pulseval = parseInt(arrpulseblocks[i].trim());
				
				if(isNaN(pulseval)){
					validity = false;
					$('#parameter_used li input[name="pulses"]').parent().parent().parent().addClass('has-error');
				}
				
				json['pulses'].push(pulseval);
				pulsenum += parseInt(arrpulseblocks[i]);
			}
		
			if(pulsenum > 5000){
				json['pulses'] = null
				validity = false;
				$('#parameter_used li input[name="pulses"]').parent().parent().parent().addClass('has-error');
			}			
			
		}
		
		// Check and validate all other parameters
		$('#parameter_used li').each(function(i,k){
			var datatype = $(k).find( "input, select").attr('data-type');
			var dataname = $(k).find( "input, select").attr('name');
			var datainput = $(k).find( "input, select").val();
			var datagroup = $(k).find( "input, select").attr('data-group');
			var datamin = parseFloat($(k).find( "input, select").attr('min'));
			var datamax = parseFloat($(k).find( "input, select").attr('max'));

			if(datatype == 'int'){
				json[dataname] = parseInt(datainput);
				if(isNaN(json[dataname]) || datainput % 1 !== 0 || json[dataname] > datamax || json[dataname] < datamin){
					validity = false;
					json[dataname] = null;
					$(k).addClass('has-error');
				}
			}
			else if(datatype == 'float'){
				json[dataname] = parseFloat(datainput);
				if(isNaN(json[dataname]) || json[dataname] > datamax || json[dataname] < datamin){
					validity = false;
					$(k).addClass('has-error');
				}
			}
			else if(datatype == 'string'){
				json[dataname] = datainput;
				if(typeof json[dataname] !== 'string' || json[dataname].length === 0){
					validity = false;
					$(k).addClass('has-error');
				}
			}
			else if(datatype == 'array_def'){
				var arr = datainput.split(',');
				if(arr.length > 0)
					json[dataname] = [];
				for(i in arr){
					var intval = parseInt(arr[i].trim());
					json[dataname].push(intval);
					if(isNaN(intval)){
						validity = false;
						$(k).addClass('has-error');
					}	
				}
				if(json[dataname].length === 0 || json[dataname].length != pulseblocks){
					validity = false;
					$(k).addClass('has-error');
				}
			}
			else if(datatype == 'arrayarray_def'){

				var blocks =  function(){

					if($(k).find('input').length < pulseblocks){
						
							html = '<div class="col-sm-3">'
							html +=  '<input type="text" class="form-control"'
							html +=  'name="'+dataname+'" '
							html +=  'data-type="'+$(k).find('input:eq(0)').attr('data-type')+'" '
							if($(k).find('input:eq(0)').attr('data-group') !== undefined)
								html +=  'data-group="'+$(k).find('input:eq(0)').attr('data-group')+'" '
							html +=  'value="'+$(k).find('input:eq(0)').val()+'" '
							html +=  'placeholder="'+$(k).find('input:eq(0)').attr('placeholder')+'" '
							html +=  'title="'+$(k).find('input:eq(0)').attr('title')+'">'
							html +=  '</div>'

							$(k).find('input').parent().parent().append(html);
							blocks();
					}
				
					if($(k).find('input').length > pulseblocks){
						$(k).find('input').last().parent().remove();
						blocks();
					}
				
				}

				blocks();				

				json[dataname] = []
				$(k).find('input').each(function(vk,vv){
					
					var arr = $(vv).val().split(',');

					
					if(json[dataname][vk] === undefined)
						json[dataname][vk] = [];
					for(i in arr){
						var intval = parseInt(arr[i].trim());
						json[dataname][vk].push(intval);
						if(isNaN(intval)){
							validity = false;
							$(k).addClass('has-error');
						}	
					}
				});
				
				
				if(json[dataname].length === 0 || json[dataname].length != pulseblocks || $(k).find('input').length != pulseblocks){
					validity = false;
					$(k).addClass('has-error');
				}
				
			}

		});

		json = [json];
		$('#RawProtocol').html(JSON.stringify(json, null, 3).replace(/null|\"\"/g, '<i class="fa fa-exclamation-triangle text-danger"></i>'));
		if(!validity){
			$('#RawProtocol').addClass('panel-danger');
			$('#ScriptGraphContainer').removeClass('panel-danger panel-success').addClass('panel-danger');
			$('#ScriptGraphContainer .panel-title button').addClass('disabled');
		}
		GenerateScriptPlot(json);
	}

	// Build parameter list
	// =====================================================================
	function GenerateParameterList(json){
		for(param in json){

			var html = '<li class="list-group-item " title="'+json[param].title+'" id="'+json[param].name+'"';
				if(json[param].color !== undefined)
					html += ' style="border-left:3px solid '+ json[param].color+'"';
				else
					html += ' style="border-left:3px solid #e1e1e1"';
				html += '>'				
				html +=  '<div class="form-group">'

				// Label
				html +=  '<label class="col-sm-5 control-label" style="font-weight:normal">'
				html +=  json[param].label
				html +=  '</label>'
				
				// input
				if(json[param].input_type == 'radio'){
					html += '<div class="col-sm-7">'
					for(i=0; i< json[param].range.length; i++){
						html += '<label class="radio-inline">'
						html +=  '<input type="radio"'
						if(json[param].group !== '')
							html +=  'data-group="'+json[param].group+'" '
						html +=  'name="'+json[param].name+'" '
						html +=  'data-type="'+json[param].type+'" '
						html +=  'value="'+json[param].range[i]+'" '
						if(json[param].range[i] == json[param].value)
							html += 'checked '
						html +=  'title="'+json[param].input_title[i]+'">'
						html +=  ' ' + json[param].input_label[i]
						html +=  '</label>'
					}
					html +=  '</div>'
				}
				
				if(json[param].input_type == 'text'){
					if(json[param].input_label !== false){
						html += '<div class="col-sm-5">'
						html += '<div class="input-group">'
					}
					else
						html += '<div class="col-sm-7">'
					if(json[param].type == 'int'){
						html +=  '<input type="number" class="form-control" '
						html +=  'min="'+json[param].range[0]+'" '
						html +=  'max="'+json[param].range[1]+'" '
					}
					if(json[param].type == 'float'){
						html +=  '<input type="number" class="form-control" '
						html +=  'min="'+json[param].range[0]+'" '
						html +=  'max="'+json[param].range[1]+'" '
						html +=  'step=".1" '
					}
					else
						html +=  '<input type="text" class="form-control"'
					html +=  'name="'+json[param].name+'" '
					html +=  'data-type="'+json[param].type+'" '
					if(json[param].group !== '')
						html +=  'data-group="'+json[param].group+'" '
					html +=  'value="'+json[param].value+'" '
					html +=  'placeholder="'+json[param].input_title+'" '
					html +=  'title="'+json[param].input_title+'">'
					if(json[param].input_label !== false){
						html +=  '<span class="input-group-addon">'+json[param].input_label+'</span>'
						html +=  '</div>'
					}
					html +=  '</div>'
				}

				if(json[param].input_type == 'select'){
					html += '<div class="col-sm-7">'
					html += '<select class="form-control"'
					html +=  'name="'+json[param].name+'" '
					html +=  'data-type="'+json[param].type+'" '
					if(json[param].group !== '')
						html +=  'data-group="'+json[param].group+'" '
					html += '>'

					for(i=0; i< json[param].range.length; i++){
						html +=  '<option '
						html +=  'value="'+json[param].range[i]+'" '
						if(json[param].range[i] == json[param].value)
							html += 'selected '
						if(json[param].input_label !== false)
							html +=  'title="'+json[param].input_label + ' ' +json[param].range[i]+'">'
						else
							html +=  'title="' +json[param].range[i]+'">'
						if(json[param].input_label !== false)
							html +=  json[param].input_label + ' ' +json[param].range[i]
						else
						html +=  json[param].range[i]
						html +=  '</option>'
					}
					html += '</select>'
					html +=  '</div>'
				}

				if(json[param].input_type == 'array_text'){
					html += '<div class="col-sm-7">'
					for(i in json[param].value){
						html += '<div class="col-sm-3">'
						html +=  '<input type="text" class="form-control"'
						html +=  'name="'+json[param].name+'" '
						html +=  'data-type="'+json[param].type+'" '
						if(json[param].group !== '')
							html +=  'data-group="'+json[param].group+'" '
						html +=  'value="'+json[param].value[i].join(',')+'" '
						html +=  'placeholder="'+json[param].range+'" '
						html +=  'title="'+json[param].input_title+'">'
						html +=  '</div>'
					}
					html +=  '</div>'
					
				}
				
				html +=  '</div>'
				html +=  '</li>'
			
			$('#parameter_unused').append(html);
		
			$('#'+json[param].name+' .form-group div').hide()
			$('#'+json[param].name+' .control-label').removeClass('col-sm-5').addClass('col-sm-12')
		}
		$('#parameter_unused li').sort(SortParameterList).appendTo('#parameter_unused');
	}

	// Build presets list
	// =====================================================================
	function GeneratePresetList(json){
		for(param_id in json){
			var html = '<a class="list-group-item" '
			html += 'data-link="'+param_id+'" '
			html += 'style="cursor:pointer" '
			html += 'title="'+json[param_id].description+'">'
			html += '<i class="fa fa-file-text"></i> '
			html += json[param_id].name+'</a>'
			$('#presets,#presets_second').append(html);
		}
	}

	// Build presets list
	// =====================================================================
	function GenerateSavedProtocolList(json){
		$('.saveduserprotocols').remove();
		console.log(json);
		for(param_id in json){
			var html = '<a class="list-group-item saveduserprotocols" '
			html += 'data-link="user_'+param_id+'" '
			html += 'style="cursor:pointer" '
			html += 'title="'+json[param_id].description+'">'
			html += '<i class="fa fa-user"></i> '
			html += json[param_id].name+'</a>'
			if(json[param_id].protocol_json.length > 1)
				$('#presets_second').prepend(html);
			else
				$('#presets,#presets_second').prepend(html);
		}
	}

	// JSON visualize function
	// =====================================================================
	function GenerateScriptPlot(json){
	
		/** 
		Steps to do:
		Get measuring pulses
		Get all measuring lights
		Get measuring light intensities
		Get their intensities
		Get actinic lights
		Build traces
		**/
		
		var series = []
		var series_environment =[];
		if(json.length > 0){
			protocols_json = json;
			var time = 0
			var measurements = 1
			var measurements_delay = 0
			
			for(prot in protocols_json){
				if(protocols_json[prot].measurements !== undefined && protocols_json[prot].measurements_delay !== undefined){
					if(protocols_json[prot].measurements > measurements)
						measurements = protocols_json[prot].measurements;
					if(protocols_json[prot].measurements_delay > measurements_delay)
						measurements_delay = protocols_json[prot].measurements_delay * 1000000;
				}
			}
			
			for(m=0;m<measurements;m++){
				for(prot in protocols_json){
					json = protocols_json[prot];
					
					if(json.environmental !== undefined && json.environmental){
						var env_str = []
						for(env in json.environmental){
							if(json.environmental[env][1] == 0)
								env_str.push(json.environmental[env][0])
							
						}
						if(env_str.length > 0){
							series_environment.push({
								value : time,
								color : 'grey',
								dashStyle : 'shortdash',
								width : 1,
								label : {
									text : env_str.join('<br>'),
									rotation: 0,
									align:'center',
									style: {
										fontSize:10
									}
								}
							});
						}
					}
					
					for(i in json.pulses){
	
						if(json.act_intensities !== undefined && (json.act1_lights !== undefined || json.act2_lights !== undefined)){
					
							var act_lights = [];
							if(json.act1_lights[i] !== undefined && json.act1_lights[i] !== undefined)
								act_lights.push(json.act1_lights[i]);
							if(json.act2_lights !== undefined && json.act2_lights[i] !== undefined)
								act_lights.push(json.act2_lights[i]);					
					
							for(act_light in act_lights){
								if(act_lights[act_light] == 0)
									continue;
								if(series[act_lights[act_light]] === undefined){
									series[act_lights[act_light]] ={}
									series[act_lights[act_light]]['name'] =  'Actinic light ('+act_lights[act_light]+')'
									series[act_lights[act_light]]['type'] =  'scatter'
									series[act_lights[act_light]]['color'] = light_colors[act_lights[act_light]].hex
									series[act_lights[act_light]]['data'] = []								
								}				
								series[act_lights[act_light]]['data'].push([time,0]);
								series[act_lights[act_light]]['data'].push([time,json.act_intensities[i]]);
							}
						}

				
						for(j=0;j< json.pulses[i]; j++){

							if(json.meas_intensities !== undefined && json.meas_lights !== undefined){
								var lights = json.meas_lights[i];
								for(light in lights){
									if(lights[light] == 0)
										continue;
									if(series[lights[light]] === undefined){
										series[lights[light]] ={}
										series[lights[light]]['name'] =  'Measuring light ('+lights[light]+')'
										series[lights[light]]['type'] =  'scatter'
										series[lights[light]]['color'] = light_colors[lights[light]].hex
										series[lights[light]]['data'] = []								
									}
									series[lights[light]]['data'].push([time,0]);
									series[lights[light]]['data'].push([time,json.meas_intensities[i]]);
									time += json.pulsesize;	
									series[lights[light]]['data'].push([time,json.meas_intensities[i]]);
									series[lights[light]]['data'].push([time,0]);
									time += json.pulsedistance;
								}
							}
						}

						if(json.act_intensities !== undefined && (json.act1_lights !== undefined || json.act2_lights !== undefined)){
							for(act_light in act_lights){
								if(act_lights[act_light] == 0)
									continue;
								series[act_lights[act_light]]['data'].push([time,json.act_intensities[i]]);
								series[act_lights[act_light]]['data'].push([time,0]);
							}
						}

					}
					
					if(json.environmental !== undefined && json.environmental){
						var env_str = []
						for(env in json.environmental){
							if(json.environmental[env][1] == 1)
								env_str.push(json.environmental[env][0])
							
						}
						if(env_str.length > 0){
							series_environment.push({
								value : time,
								color : 'grey',
								dashStyle : 'shortdash',
								width : 1,
								label : {
									text : env_str.join('<br>'),
									rotation: 0,
									align:'center',
									style: {
										fontSize:10
									}
								}
							});
						}
					}
					
					
				}
				time += measurements_delay;
			}
		}

		var series_final = [];
		for(i in series)
			series_final.push(series[i])

		if(series_environment.length > 0 && series_final.length == 0){
			series = []
			series['name'] =  series_environment[0].label.text.replace(/<br>/g,', ')
			series['type'] =  'scatter'
			series['data'] = [];
			for(i in series_environment)
				series['data'].push([series_environment[i].value,1])
			series_environment = [];
			series['marker'] = {}
			series['marker']['enabled'] = true;
			series_final.push(series);
		}
			
		$('#SingleScriptGraph').highcharts({
			chart: {
				zoomType: 'x',
				animation: true
			},
			title: {
				text: false
			},
			xAxis: [{
				labels: {
					formatter: function() {
						if(this.value <= 1000)
							return this.value + ' us';
						if(this.value <= 1e+6)
							return MathROUND((this.value / 1000),2) + ' ms';
						if(this.value <= 6e+7)
							return MathROUND((this.value / 1e+6),2) + ' s';
						if(this.value <= 3.6e+9)
							return MathROUND((this.value / 6e+7),2) + ' min';
						if(this.value <= 8.64e+10)
							return MathROUND((this.value / 3.6+9),2) + ' h';
					}
				},
				title: {
					text: false
				},
				plotLines : series_environment
			}],
			yAxis: [{
				id:"inital",
				title: {
					text: false
				},
				min:0
			}],
			tooltip: {
				shared: true,
				enabled: false
			},
			legend: {
				layout: 'horizontal',
				align: 'center',
				verticalAlign: 'bottom'
			},
			plotOptions: {
				scatter:{
					animation:true,
					marker: {
						enabled:false
					},
					lineWidth: 1
				}
			},
			series: series_final,
			credits: {
				enabled: false
			}
		});
	}

	// JSON import function
	// =====================================================================
	function ImportScriptFromJSON(json){
		/* Move all parameters back to the left */
		$('#parameter_used li').appendTo("#parameter_unused");
		$('#parameter_unused li .form-group div').hide()
		$('#parameter_unused li .control-label').removeClass('col-sm-5').addClass('col-sm-12')

		/* Add parameters according to the json */
		for(param_id in json){
			if($('#'+param_id) !== undefined){

				/* Apply settings */
				if(param_id == 'detectors' || param_id == 'meas_lights'){
					for(i in param_id)
						$('#'+param_id+' input[name="'+param_id+'"]:eq('+i+')').attr('value',json[param_id][i])
				}
				else if(param_id == 'environmental'){
					for(envValue in json[param_id]){
						/* Apply settings */
						$('#'+json[param_id][envValue][0]+ ' input[value='+json[param_id][envValue][1]+']').prop('checked', true);


						/* Move parameter to the left */
						$('#'+json[param_id][envValue][0]).appendTo('#parameter_used');
					
						/* Change layout */
						$('#'+json[param_id][envValue][0]+ ' .form-group div').show();
						$('#'+json[param_id][envValue][0] + ' .control-label').removeClass('col-sm-12').addClass('col-sm-5');
					}
					continue;
				}
				else
					$('#'+param_id+' input').attr('value',json[param_id])

				/* Move parameter to the left */
				$('#'+param_id).appendTo('#parameter_used');
				
				/* Change layout */
				$('#'+param_id+' .form-group div').show();
				$('#'+param_id+' .control-label').removeClass('col-sm-12').addClass('col-sm-5');
			}
		}
	}

	// Visualize multiple protocols
	// =====================================================================
	function GenerateMultiScriptPlot(){
		var MultiProtocol = []
		$('#preset_sort li ').each(function(k,v){
			var link = $(v).attr('data-link');
			if(link.match(/user_/g)){
				MultiProtocol.push(_userprotocols[link.substr(5)].protocol_json)
			}
			else
				MultiProtocol.push(_presets[link].protocol_json)
		});
		$('#RawProtocol').html(JSON.stringify(MultiProtocol, null, 3));
		GenerateScriptPlot(MultiProtocol);
	};

	// Sort Parameter List
	// =====================================================================
	function SortParameterList(a,b){
		var aval = $(a).find('input').attr('data-group') || "";
		var bval = $(b).find('input').attr('data-group') || "";
		return (bval < aval) ? 1 : -1;    
	}

	// Build click / hover events
	// =====================================================================
	$('#presets').on('click', 'a',function(){
		$('a[href="#parameter_list"]').tab('show');
		var link = $(this).attr('data-link');
		if($(this).hasClass('saveduserprotocols'))
			ImportScriptFromJSON(_userprotocols[link.substr(5)].protocol_json);
		else
			ImportScriptFromJSON(_presets[link].protocol_json);
		$('#parameter_used li').sort(SortParameterList).appendTo('#parameter_used');
		GenerateAndValidateScript();
	});

	$('#presets').on('hover', 'a',function(){
		var link = $(this).attr('data-link');
		$('#presets_info').empty();
		if($(this).hasClass('saveduserprotocols')){
			$('#presets_info').append('<legend>'+_userprotocols[link.substr(5)].name+'</legend>');
			$('#presets_info').append(_userprotocols[link.substr(5)].description);
			$('#presets_info').append('<p><button value="'+link.substr(5)+'" class="btn btn-danger" id="BtnDeleteUserScript">Delete</button><p>');
		}else{
			$('#presets_info').append('<legend>'+_presets[link].name+'</legend>');
			$('#presets_info').append(_presets[link].description);
		}
	});	
	
	$('#ProtocoltoConsoleBtn').on('click', function(){
		_event.source.postMessage({'protocol_to_console':$('#RawProtocol').text()}, _event.origin);
		chrome.app.window.get('mainwindow').focus();
	});

	$('#ProtocoltoConsoleRunBtn').on('click', function(){
		_event.source.postMessage({'protocol_run':$('#RawProtocol').text()}, _event.origin);
		chrome.app.window.get('mainwindow').focus();
	});

	$('#presets_info').on('click', '#BtnDeleteUserScript', function(){
		var protocol_id = $(this).val();
		_event.source.postMessage({'protocol_delete':protocol_id}, _event.origin);
		delete _userprotocols[protocol_id]
		GenerateSavedProtocolList(_userprotocols);
		$('#presets_info').empty();
	});
	
	$('#BtnSaveProtocol').on('click', function(){
		var protocol_id = -1;
		for(k in _userprotocols){
			if(k > protocol_id)
				protocol_id = k;
		}
		protocol_id++;
		try {
			var protocol_json = JSON.parse($('#RawProtocol').text());
			var protocol_save = {
				'description': $('#DescriptionSaveProtocol').val(),
				'id': protocol_id,
				'macro_id': false,
				'name': $('#NameSaveProtocol').val(),
				'protocol_json': protocol_json[0]
			}
			_userprotocols[protocol_id] = protocol_save;
			GenerateSavedProtocolList(_userprotocols);
			_event.source.postMessage({'protocol_save':protocol_save}, _event.origin);
			$('#saveModal').modal('hide');
		}
		catch(e){}
	});	
	
	$('body').on('click', '.dismiss-preset',function(){
		var link = $(this).parent().attr('data-link');
		if($('#presets_second a[data-link="'+link+'"] > span').length == 1){
			var count = parseInt($('#presets_second a[data-link="'+link+'"] > span').text()) - 1
			if(count == 0){
				$('#presets_second a[data-link="'+link+'"] > span').remove();
				$('#presets_second a[data-link="'+link+'"]').removeClass('active')
			}
			else
				$('#presets_second a[data-link="'+link+'"] > span').text(count);
		}
		$(this).parent().remove();
		if($('#preset_sort li').length == 0)
			$('#preset_sort').next('div').show();
		GenerateMultiScriptPlot();
	});

	$('body').on('click', '#presets_second a',function(){
		$('#ScriptGraphContainer').removeClass('panel-danger panel-success').addClass('panel-success');
		var link = $(this).attr('data-link');
		var html = '<li class="list-group-item" '
		html += 'data-link="'+link+'">'
		html += '<i class="fa fa-file-text"></i> '
		html += $(this).contents(':not(span)').text()
		html += '<button type="button" class="close dismiss-preset">&times;</button>'
		html += '</li>'
		$('#preset_sort').append(html)
		if($('#presets_second a[data-link="'+link+'"] > span').length == 0){
			$('#presets_second a[data-link="'+link+'"]').append('<span class="badge">1</span>')
			$('#presets_second a[data-link="'+link+'"]').addClass('active')
		}
		else if($('#presets_second a[data-link="'+link+'"] > span').length == 1){
			var count = parseInt($('#presets_second a[data-link="'+link+'"] > span').text()) + 1
			$('#presets_second a[data-link="'+link+'"] > span').text(count);
		}
		if($('#preset_sort li').length > 0)
			$('#preset_sort').next('div').hide();
		GenerateMultiScriptPlot();
	});

	// Window resize events
	// =====================================================================
	var bodyheight =$(window).height()-52
	$("#MainDisplayContainer").height(bodyheight);
	$("#parameter_used,#presets,#parameter_unused,#presets_second").height(bodyheight-400);
	$("#RawProtocol,#preset_sort").height(bodyheight-369);
	$(window).resize(function() {
		bodyheight = $(window).height()-52;
		$("#MainDisplayContainer").height(bodyheight);
		$("#parameter_used,#presets,#parameter_unused,#presets_second").height(bodyheight-400);
		$("#RawProtocol,#preset_sort").height(bodyheight-369);
	});

}