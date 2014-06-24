onload = function() {
	// Initial call for empty JSON
	// =====================================================================
	GenerateParameterList(parameters);
	window.addEventListener('message', function(event) {
		GeneratePresetList(event.data);
		_presets = event.data;
		_event = event;
	});
	GenerateAndValidateScript();

	// Collapsable Icon Toggle
	// =====================================================================  
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		if($(e.target).attr('href') == '#environmental_params_list'){
			$('#environmental').parent().show();
			$('#spectroscopic').parent().hide();
			$('#presets_info').hide();
		}
		if($(e.target).attr('href') == '#spectroscopic_params_list'){
			$('#environmental').parent().hide();
			$('#spectroscopic').parent().show();
			$('#presets_info').hide();
		}
		if($(e.target).attr('href') == '#presets_list'){
			$('#environmental').parent().hide();
			$('#spectroscopic').parent().hide();
			$('#presets_info').show();
		}
	});

	// Connection Lists Environmental Parameters
	// =====================================================================
	$( "#environmental_params" ).sortable({
		connectWith: "#environmental",
 		revert: 200,
 		tolerance: "pointer",
		start: function( event, ui ) {
			$( "#environmental" ).addClass('bg-warning')
		},
		stop: function( event, ui ) {
			$('#environmental li .form-group div').show()
			$('#environmental li .control-label').removeClass('col-sm-12').addClass('col-sm-5')
			$( "#environmental" ).removeClass('bg-warning')
		}
	}).disableSelection();

	$( "#environmental" ).sortable({
		connectWith: "#environmental_params",
		revert: 200,
		tolerance: "pointer" ,
		stop: function( event, ui ) {
			$('#environmental_params li .form-group div').hide()
			$('#environmental_params li .control-label').removeClass('col-sm-5').addClass('col-sm-12')
		}
	}).disableSelection();

	// Connection Lists Measurement Parameters
	// =====================================================================
	$( "#spectroscopic_params" ).sortable({
		connectWith: "#spectroscopic",
		revert: 200,
		tolerance: "pointer" ,
		start: function( event, ui ) {
			$( "#spectroscopic" ).addClass('bg-warning')
		},
		stop: function( event, ui ) {
			$('#spectroscopic li .form-group div').show()
			$('#spectroscopic li .control-label').removeClass('col-sm-12').addClass('col-sm-5')
			$( "#spectroscopic" ).removeClass('bg-warning')
		}
	}).disableSelection();

	$( "#spectroscopic" ).sortable({
		connectWith: "#spectroscopic_params",
		revert: 200,
		tolerance: "pointer" ,
		stop: function( event, ui ) {
			$('#spectroscopic_params li .form-group div').hide()
			$('#spectroscopic_params li .control-label').removeClass('col-sm-5').addClass('col-sm-12')
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
	$( "#environmental_params,#environmental,#spectroscopic,#spectroscopic_params" ).on( "sortstop", function( event, ui ) {
		$('#'+$(this).attr('id')+' li').each(function(i,value){
			if($(value).find('input, select').attr('data-group') == ui.item.find('input, select').attr('data-group') && $(value).find('input, select').attr('data-group') !== undefined && $(value).find('input, select').attr('data-group') !== "")
				$(value).appendTo('#'+ui.item.parent().attr('id'));
		});
		GenerateAndValidateScript();
	});
	
	$('input, select').on('input',function(){
		GenerateAndValidateScript();
	});
	
	$('input[type="radio"]').on('change',function(){
		GenerateAndValidateScript();
	});	

	// Clear Protocol Fields 
	// =====================================================================
	$('#environmental_clear').on('click', function(){
		$('#environmental li').appendTo("#environmental_params");
		$('#environmental_params li .form-group div').hide()
		$('#environmental_params li .control-label').removeClass('col-sm-5').addClass('col-sm-12')
		GenerateAndValidateScript();
	});

	$('#spectroscopic_clear').on('click', function(){
		$('#spectroscopic li').appendTo("#spectroscopic_params");
		$('#spectroscopic_params li .form-group div').hide()
		$('#spectroscopic_params li .control-label').removeClass('col-sm-5').addClass('col-sm-12')
		GenerateAndValidateScript();
	});


	// JSON building function
	// =====================================================================
	function GenerateAndValidateScript(){
		var json = {}
		var validity = true;
		$('#RawProtocol').removeClass('panel-danger');
		$('#ScriptGraphContainer').removeClass('panel-danger panel-success').addClass('panel-success');
		$('li').removeClass('has-error');

		// Environmental parameter control
		$('#environmental li').each(function(i,k){
			if(json['environmental'] === undefined)
				json['environmental'] = []
			json['environmental'].push([$(k).find( "input:checked").attr('name'),parseInt($(k).find( "input:checked").attr('value'))]);
		});

		// Pulse parameter control
		var arrpulseblocks = $('#spectroscopic li input[name="pulses"]').val();
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
					$('#spectroscopic li input[name="pulses"]').parent().parent().parent().addClass('has-error');
				}
				
				json['pulses'].push(pulseval);
				pulsenum += parseInt(arrpulseblocks[i]);
			}
		
			if(pulsenum > 5000){
				json['pulses'] = null
				validity = false;
				$('#spectroscopic li input[name="pulses"]').parent().parent().parent().addClass('has-error');
			}			
			
		}
		
		// Check and validate all other parameters
		$('#spectroscopic li').each(function(i,k){
			var datatype = $(k).find( "input, select").attr('data-type');
			var dataname = $(k).find( "input, select").attr('name');
			var datainput = $(k).find( "input, select").val();
			var datagroup = $(k).find( "input, select").attr('data-group');
			var datamin = $(k).find( "input, select").attr('min');
			var datamax = $(k).find( "input, select").attr('max');

			if(datatype == 'int'){
				json[dataname] = parseInt(datainput);
				if(isNaN(json[dataname]) || datainput % 1 !== 0){
					validity = false;
					json[dataname] = null;
					$(k).addClass('has-error');
				}
			}
			else if(datatype == 'float'){
				json[dataname] = parseFloat(datainput);
				if(isNaN(json[dataname])){
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
		GenerateScriptPlot(json);
		if(!validity){
			$('#RawProtocol').addClass('panel-danger');
			$('#ScriptGraphContainer').removeClass('panel-danger panel-success').addClass('panel-danger');
		}
	}

	// Build parameter list
	// =====================================================================
	function GenerateParameterList(json){
		for(param_id in json){
			for(param in json[param_id]){

				var html = '<li class="list-group-item " title="'+json[param_id][param].title+'" id="'+json[param_id][param].name+'">'				
					html +=  '<div class="form-group">'

					// Label
					html +=  '<label class="col-sm-5 control-label" style="font-weight:normal">'
					html +=  json[param_id][param].label
					html +=  '</label>'
					
					// input
					if(json[param_id][param].input_type == 'radio'){
						html += '<div class="col-sm-7">'
						for(i=0; i< json[param_id][param].range.length; i++){
							html += '<label class="radio-inline">'
							html +=  '<input type="radio"'
							if(json[param_id][param].group !== '')
								html +=  'data-group="'+json[param_id][param].group+'" '
							html +=  'name="'+json[param_id][param].name+'" '
							html +=  'data-type="'+json[param_id][param].type+'" '
							html +=  'value="'+json[param_id][param].range[i]+'" '
							if(json[param_id][param].range[i] == json[param_id][param].value)
								html += 'checked '
							html +=  'title="'+json[param_id][param].input_title[i]+'">'
							html +=  ' ' + json[param_id][param].input_label[i]
							html +=  '</label>'
						}
						html +=  '</div>'
					}
					
					if(json[param_id][param].input_type == 'text'){
						if(json[param_id][param].input_label !== false){
							html += '<div class="col-sm-5">'
							html += '<div class="input-group">'
						}
						else
							html += '<div class="col-sm-7">'
						if(json[param_id][param].type == 'int'){
							html +=  '<input type="number" class="form-control" '
							html +=  'min="'+json[param_id][param].range[0]+'" '
							html +=  'max="'+json[param_id][param].range[1]+'" '
						}
						if(json[param_id][param].type == 'float'){
							html +=  '<input type="number" class="form-control" '
							html +=  'min="'+json[param_id][param].range[0]+'" '
							html +=  'max="'+json[param_id][param].range[1]+'" '
							html +=  'step=".1" '
						}
						else
							html +=  '<input type="text" class="form-control"'
						html +=  'name="'+json[param_id][param].name+'" '
						html +=  'data-type="'+json[param_id][param].type+'" '
						if(json[param_id][param].group !== '')
							html +=  'data-group="'+json[param_id][param].group+'" '
						html +=  'value="'+json[param_id][param].value+'" '
						html +=  'placeholder="'+json[param_id][param].range+'" '
						html +=  'title="'+json[param_id][param].input_title+'">'
						if(json[param_id][param].input_label !== false){
							html +=  '<span class="input-group-addon">'+json[param_id][param].input_label+'</span>'
							html +=  '</div>'
						}
						html +=  '</div>'
					}

					if(json[param_id][param].input_type == 'select'){
						html += '<div class="col-sm-7">'
						html += '<select class="form-control"'
						html +=  'name="'+json[param_id][param].name+'" '
						html +=  'data-type="'+json[param_id][param].type+'" '
						if(json[param_id][param].group !== '')
							html +=  'data-group="'+json[param_id][param].group+'" '
						html += '>'

						for(i=0; i< json[param_id][param].range.length; i++){
							html +=  '<option '
							html +=  'value="'+json[param_id][param].range[i]+'" '
							if(json[param_id][param].range[i] == json[param_id][param].value)
								html += 'selected '
							if(json[param_id][param].input_label !== false)
								html +=  'title="'+json[param_id][param].input_label + ' ' +json[param_id][param].range[i]+'">'
							else
								html +=  'title="' +json[param_id][param].range[i]+'">'
							if(json[param_id][param].input_label !== false)
								html +=  json[param_id][param].input_label + ' ' +json[param_id][param].range[i]
							else
							html +=  json[param_id][param].range[i]
							html +=  '</option>'
						}
						html += '</select>'
						html +=  '</div>'
					}

					if(json[param_id][param].input_type == 'array_text'){
						html += '<div class="col-sm-7">'
						for(i in json[param_id][param].value){
							html += '<div class="col-sm-3">'
							html +=  '<input type="text" class="form-control"'
							html +=  'name="'+json[param_id][param].name+'" '
							html +=  'data-type="'+json[param_id][param].type+'" '
							if(json[param_id][param].group !== '')
								html +=  'data-group="'+json[param_id][param].group+'" '
							html +=  'value="'+json[param_id][param].value[i].join(',')+'" '
							html +=  'placeholder="'+json[param_id][param].range+'" '
							html +=  'title="'+json[param_id][param].input_title+'">'
							html +=  '</div>'
						}
						html +=  '</div>'
						
					}
					
					html +=  '</div>'
					html +=  '</li>'
				
				$('#'+param_id).append(html);
			
				$('#'+json[param_id][param].name+' .form-group div').hide()
				$('#'+json[param_id][param].name+' .control-label').removeClass('col-sm-5').addClass('col-sm-12')
				
			}
		}
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
			$('#presets,#presets_second').append(html)
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
		$('#environmental li').appendTo("#environmental_params");
		$('#spectroscopic li').appendTo("#spectroscopic_params");
		$('#environmental_params li .form-group div, #spectroscopic_params li .form-group div').hide()
		$('#environmental_params li .control-label, #spectroscopic_params li .control-label').removeClass('col-sm-5').addClass('col-sm-12')

		/* Add parameters according to the json */
		for(param_id in json){
			if($('#'+param_id).parent('ul').attr('id') !== undefined){

				/* Apply settings */
				if(param_id == 'detectors' || param_id == 'meas_lights'){
					for(i in param_id)
						$('#'+param_id+' input[name="'+param_id+'"]:eq('+i+')').attr('value',json[param_id][i])
				}
				else
					$('#'+param_id+' input').attr('value',json[param_id])

				/* Move parameter to the left */
				$('#'+param_id).appendTo('#'+$('#'+param_id).parent('ul').attr('id').replace('_params',''));
				
				/* Change layout */
				$('#'+$('#'+param_id).parent('ul').attr('id').replace('_params','') + ' li .form-group div').show();
				$('#'+$('#'+param_id).parent('ul').attr('id').replace('_params','') + ' li .control-label').removeClass('col-sm-12').addClass('col-sm-5');
			}
			else if(param_id == 'environmental'){
				for(envValue in json[param_id]){
					/* Apply settings */
					$('#'+json[param_id][envValue][0]+ ' input[value='+json[param_id][envValue][1]+']').prop('checked', true);


					/* Move parameter to the left */
					$('#'+json[param_id][envValue][0]).appendTo('#'+$('#'+json[param_id][envValue][0]).parent('ul').attr('id').replace('_params',''));
					
					/* Change layout */
					$('#'+$('#'+json[param_id][envValue][0]).parent('ul').attr('id').replace('_params','') + ' li .form-group div').show();
					$('#'+$('#'+json[param_id][envValue][0]).parent('ul').attr('id').replace('_params','') + ' li .control-label').removeClass('col-sm-12').addClass('col-sm-5');
				}
			}
		}
	}

	// Visualize multiple protocols
	// =====================================================================
	function GenerateMultiScriptPlot(){
		var MultiProtocol = []
		$('#preset_sort li ').each(function(k,v){
			var link = $(v).attr('data-link');
			MultiProtocol.push(_presets[link].protocol_json)
		});
		$('#RawProtocol').html(JSON.stringify(MultiProtocol, null, 3));
		GenerateScriptPlot(MultiProtocol);
	};


	// Build click / hover events
	// =====================================================================
	$('body').on('click', '#presets a',function(){
		$('a[href="#spectroscopic_params_list"]').tab('show');
		var link = $(this).attr('data-link');
		ImportScriptFromJSON(_presets[link].protocol_json)
		GenerateAndValidateScript();
	});

	$('body').on('hover', '#presets a',function(){
		var link = $(this).attr('data-link');
		$('#presets_info').empty();
		$('#presets_info').append('<legend>'+_presets[link].name+'</legend>');
		$('#presets_info').append(_presets[link].description);
	});	
	
	$('#ProtocoltoConsoleBtn').on('click', function(){
		_event.source.postMessage({'protocol_to_console':$('#RawProtocol').text()}, _event.origin);
		chrome.app.window.get('mainwindow').focus();
	});

	$('#ProtocoltoConsoleRunBtn').on('click', function(){
		_event.source.postMessage({'protocol_run':$('#RawProtocol').text()}, _event.origin);
		chrome.app.window.get('mainwindow').focus();
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
	$("#environmental_params,#presets,#spectroscopic_params,#environmental,#spectroscopic,#presets_second").height(bodyheight-400);
	$("#RawProtocol,#preset_sort").height(bodyheight-369);
	$(window).resize(function() {
		bodyheight = $(window).height()-52;
		$("#MainDisplayContainer").height(bodyheight);
		$("#environmental_params,#presets,#spectroscopic_params,#environmental,#spectroscopic,#presets_second").height(bodyheight-400);
		$("#RawProtocol,#preset_sort").height(bodyheight-369);
	});

}