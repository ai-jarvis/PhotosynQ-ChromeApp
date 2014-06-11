onload = function() {

	// Initial call for empty JSON
	// =====================================================================
	GenerateParameterList(parameters);
	window.addEventListener('message', function(event) {
		GeneratePresetList(event.data);
		_presets = event.data;
		_event = event;
	});
	GenerateScriptPlot([]);
	

	// Collapsable Icon Toggle
	// =====================================================================  
	$('#accordion,#accordion_second').on('show.bs.collapse', function (e) {
		$(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-down fa-chevron-right');
	});
	$('#accordion,#accordion_second').on('hide.bs.collapse', function (e) {
	  $(e.target).prev('.panel-heading').find('i').toggleClass('fa-chevron-right fa-chevron-down');
	});

	// Connection Lists Environmental Parameters
	// =====================================================================
	$( "#environmental_params" ).sortable({
		connectWith: "#environmental",
		start: function( event, ui ) {
			$( "#measurement, #detection" ).parent().css('opacity',0.4)
		},
		stop: function( event, ui ) {
			$( "#measurement, #detection" ).parent().css('opacity',1)
		}
	}).disableSelection();

	$( "#environmental" ).sortable({
		connectWith: "#environmental_params"
	}).disableSelection();

	// Connection Lists Measurement Parameters
	// =====================================================================
	$( "#measurement_params" ).sortable({
		connectWith: "#measurement",
		start: function( event, ui ) {
			$( "#environmental, #detection" ).parent().css('opacity',0.4)
		},
		stop: function( event, ui ) {
			$( "#environmental, #detection" ).parent().css('opacity',1)
		}
	}).disableSelection();

	$( "#measurement" ).sortable({
		connectWith: "#measurement_params"
	}).disableSelection();

	// Connection Lists Detection Parameters
	// =====================================================================
	$( "#detection_params" ).sortable({
		connectWith: "#detection",
		start: function( event, ui ) {
			$( "#environmental, #measurement" ).parent().css('opacity',0.4)
		},
		stop: function( event, ui ) {
			$( "#environmental, #measurement" ).parent().css('opacity',1)
		}
	}).disableSelection();

	$( "#detection" ).sortable({
		connectWith: "#detection_params"
	}).disableSelection();

	// JSON building triggers
	// =====================================================================
	$( "#environmental_params,#environmental,#measurement,#measurement_params,#detection,#detection_params" ).on( "sortstop", function( event, ui ) {
		$('#'+$(this).attr('id')+' li').each(function(i,value){
			if($(value).children('div').children('div').children('input').attr('data-group') == ui.item.children('div').children('div').children('input').attr('data-group') && $(value).children('div').children('div').children('input').attr('data-group') !== undefined && $(value).children('div').children('div').children('input').attr('data-group') !== "")
				$(value).appendTo('#'+ui.item.parent().attr('id'));
		});
		GenerateAndValidateScript();
		SortParameterList();
	});
	
	$('input').on('change',function(){
		GenerateAndValidateScript();
	});

	$('body').on('keyup',function(){
		GenerateAndValidateScript();
	});

	// Clear Protocol Fields 
	// =====================================================================
	$('#environmental_clear').on('click', function(){
		$('#environmental li').appendTo("#environmental_params");
		GenerateAndValidateScript();
	});

	$('#measurement_clear').on('click', function(){
		$('#measurement li').appendTo("#measurement_params");
		GenerateAndValidateScript();
	});

	$('#detection_clear').on('click', function(){
		$('#detection li').appendTo("#detection_params");
		GenerateAndValidateScript();
	});


	// JSON building function
	// =====================================================================
	function GenerateAndValidateScript(){
		var json = {}
		var validity = true;
		$('#RawProtocol').removeClass('panel-danger');
		$('li').removeClass('has-error');
		$('#valid_label').hide();

		// Environmental parameter control
		$('#environmental li').each(function(i,k){
			if(json['environmental'] === undefined)
				json['environmental'] = []
			json['environmental'].push([$(k).children('span').children('label').children( "input:checked").attr('name'), parseInt($(k).children('span').children('label').children( "input:checked").attr('value'))]);
		});

		// Measurement parameter control
		$('#measurement li').each(function(i,k){
			var datatype = $(k).children( "div").children( "div").children( "input").attr('data-type');
			var dataname = $(k).children( "div").children( "div").children( "input").attr('name');
			var datainput = $(k).children( "div").children( "div").children( "input").val();
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
			else
				json[dataname] = datainput;
		});

		// Detection parameter controll
		$('#detection li').each(function(i,k){
			var datatype = $(k).children( "div").children( "div").children( "input").attr('data-type');
			var dataname = $(k).children( "div").children( "div").children( "input").attr('name');
			var datainput = $(k).children( "div").children( "div").children( "input").val();
			
			if(datatype == 'array'){
				var values = datainput.split(',');
				json[dataname] = [];
				for(i in values){
					json[dataname].push(parseFloat(values[i]));
					if(isNaN(values[i]))
						validity = false;
				}
			}
			if(datatype == 'arrayarray'){
				var values = datainput.split(';');
				json[dataname] = [];
				for(i in values){
					var value = values[i].split(',');
					for(ii in value){
						if(json[dataname][i] === undefined)
							json[dataname][i] = [];
						json[dataname][i].push(parseFloat(value[ii]))
						if(isNaN(parseFloat(value[ii])))
							validity = false;
					}
				}
			}

		});
		json = [json];
		$('#RawProtocol').html(JSON.stringify(json, null, 3).replace(/null|\"\"/g, '<i class="fa fa-exclamation-triangle text-danger"></i>'));
		GenerateScriptPlot(json);
		if(!validity){
			$('#RawProtocol').addClass('panel-danger');
			$('#valid_label').show();
		}
	}

	// Build parameter list
	// =====================================================================
	function GenerateParameterList(json){
		for(param_id in json){
			for(param in json[param_id]){
				if(param_id == 'environmental_params')
					$('#'+param_id).append('<li class="list-group-item " title="'+json[param_id][param].title+'" id="'+json[param_id][param].name+'">'+json[param_id][param].label+' <span class="pull-right"><label><input type="radio" name="'+json[param_id][param].name+'" data-type="'+json[param_id][param].type+'" value="0" checked> before</label> <label><input type="radio" name="'+json[param_id][param].name+'" data-type="'+json[param_id][param].type+'" value="1"> after</label></span></li>')
				else
					$('#'+param_id).append('<li class="list-group-item" title="'+json[param_id][param].title+'" id="'+json[param_id][param].name+'"><div class="form-group"><label class="col-sm-6 control-label" style="font-weight:normal">'+json[param_id][param].label+'</label> <div class="col-sm-6"><input type="text" class="form-control" name="'+json[param_id][param].name+'" data-type="'+json[param_id][param].type+'" data-group="'+json[param_id][param].group+'" value="'+json[param_id][param].value+'"></div></div></li>')
			}
		}
	}

	// Add presets
	// =====================================================================
	function GeneratePresetList(json){
		for(param_id in json){
			$('#presets,#presets_second').append('<li class="list-group-item" data-link="'+param_id+'" style="cursor:pointer" title="'+json[param_id].description+'">'+json[param_id].name+'</li>')
		}
	}

	// JSON visualize function
	// =====================================================================
	function GenerateScriptPlot(json){
		$('#SingleScriptGraph').highcharts({
			chart: {
				zoomType: 'xy',
				animation: false
			},
			title: {
				text: 'Your Script'
			},
			xAxis: [{
				//type: 'datetime' //ensures that xAxis is treated as datetime values
				title: {
					text: 'time'
				}
			}],
			yAxis: [{
				id:"inital",
				title: {
					text: false
				}
			}],
			tooltip: {
				shared: true
			},
			legend: {
				layout: 'horizontal',
				align: 'center',
				verticalAlign: 'bottom'
			},
			series: [1],
			credits: {
				enabled: false
			}
		});
		//TransientChart.redraw()
	}

	// Resort parameters
	// =====================================================================
	function SortParameterList(){
		$( "#environmental_params,#environmental,#measurement,#measurement_params,#detection,#detection_params" ).each(function(i,k){
			var listitems = $('li', $(k));
			listitems.sort(function (a, b) {
				if($(a).parent().attr('id') == 'environmental' || $(a).parent().attr('id') == 'environmental_params')
					return ($(a).text().toUpperCase() > $(b).text().toUpperCase())
				else
					return ($(a).children('div').children('label').text().toUpperCase() > $(b).children('div').children('label').text().toUpperCase())
			});
			$(this).append(listitems);
    	});
	};

	// JSON import function
	// =====================================================================
	function ImportScriptFromJSON(json){
		try {
			json = JSON.parse(json);
		}
		catch(e){
			console.log('false');
		}
		json = json[0];
		$('#environmental li').appendTo("#environmental_params");
		$('#measurement li').appendTo("#measurement_params");
		$('#detection li').appendTo("#detection_params");
		for(param_id in json){
			if($('#'+param_id).parent('ul').attr('id') !== undefined){
				$('#'+param_id).appendTo('#'+$('#'+param_id).parent('ul').attr('id').replace('_params',''));
				$('#'+param_id+' input').attr('value',json[param_id])
			}
			else if(param_id == 'environmental'){
				for(envValue in json[param_id]){
					$('#'+json[param_id][envValue][0]).appendTo('#'+$('#'+json[param_id][envValue][0]).parent('ul').attr('id').replace('_params',''));
					$('#'+json[param_id][envValue][0]+ ' input[value='+json[param_id][envValue][1]+']').prop('checked', true);
				}
			}
		}
	}

	// Initial call for empty JSON
	// =====================================================================
	GenerateAndValidateScript();
	SortParameterList();

	$('body').on('click', '#presets li',function(){
		var link = $(this).attr('data-link');
		ImportScriptFromJSON(_presets[link].protocol_json)
		GenerateAndValidateScript();
	});
	
	$('#ProtocoltoConsoleBtn').on('click', function(){
		_event.source.postMessage({'protocol_to_console':$('#RawProtocol').text()}, _event.origin);
	});

	$('#ProtocoltoConsoleRunBtn').on('click', function(){
		_event.source.postMessage({'protocol_run':$('#RawProtocol').text()}, _event.origin);
	});
	
}