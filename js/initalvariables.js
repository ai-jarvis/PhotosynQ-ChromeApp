﻿/*
Define initial variables and files holding settings
*/

//-----------------------------------------------------------------------------------------------------------------------------------
// Array for tooltips
//-----------------------------------------------------------------------------------------------------------------------------------
var tooltips = {
'LEF':'(L)inear (e)lectron (t)ransfer. Defines how fast electrons flow through the photosynthetic machinery. Depends on the light intensity and Photosystem II activity (ΦII)',
'Phi2':'ΦII (phi - 2) reflects the activity of Photosystem II. Value is between 0 for no activity and about 0.85 for maximum activity.',
'Spad':'This value reflects the amount of chlorophyll in the sample. Higher value means higher chlorophyll content.',
'FmP':'Maximal variable fluorecence',
'Fs':'Minimal variable fluorescence',
'ecst':'Total change of the ECS signal upon rapidly switching of the light.',
'vHplus':'Proton flux - inital rate of the decay of the ECS signal',
'gHplus':'Proportional to the aggregat conductivity of the thylakoid membrane - inverse lifetime of the rapid decay of ECS',
'tau':'τ - half life of the rapid decay of the ECS signal',
'light_intensity':'Light intensity in lumen.',
'co2_content':'CO2 concentration in ppm (parts per millions)',
'relative_humidity':'Relative humidity in percent [%]',
'temperature':'Temperature in degrees celcius [°C]'
}

//-----------------------------------------------------------------------------------------------------------------------------------
// Array for json variable replacements
//-----------------------------------------------------------------------------------------------------------------------------------
var replacements = {
'light_intensity':'Light intensity [lumen]',
'co2_content':'CO2 content [ppm]',
'relative_humidity':'Relative humidity [%]',
'temperature':'Temperature [°C]',
'fluorescence':'<i class="icon-fluorescence" title="Fluorescence"></i> Chlorophyll fluorescence',
'810_dirk':'<i class="icon-absorbance" title="Absorbance"></i> 810 nm DIRK',
'chlorophyll_spad':'<i class="icon-reflectance" title="Reflectance"></i> SPAD',
'940_dirk':'<i class="icon-absorbance" title="Absorbance"></i> 940 nm DIRK',
'dirk':'<i class="icon-absorbance" title="Absorbance"></i> 520 nm DIRK',
'tau':'τ',
'Phi2':'ΦII',
'FmP':'Fm\'',
'gHplus':'gH+',
'vHplus':'vH+',
'ecst':'ECSt'
}

// ==================================================================================================================================
// Key value pairs to exclude
// ==================================================================================================================================
var ToExclude = [
	'protocol_number',
	'protocol_id',
	'id',
	'protocol_name',
	'baseline_values',
	'chlorophyll_spad_calibration',
	'averages',
	'data_raw',
	'baseline_sample',
	'HTML',
	'Macro',
	'GraphType',
	'time',
	'time_offset',
	'get_ir_baseline',
	'get_blank_cal'
];

//-----------------------------------------------------------------------------------------------------------------------------------
// Array with variables to hide from user in cellphone app
//-----------------------------------------------------------------------------------------------------------------------------------
var variablehidephone = [ 'userinput_1_question',
	'userinput_1_answer',
	'userinput_2_question',
	'userinput_2_answer',
	'device_id',
	'firmware_version',
	"time",
	"time_offset",
	'protocol_number',
	'protocol_name',
	'baseline_sample',
	'baseline_values',
	'chlorophyll_spad_calibration',
	'calibration_spad_blank',
	//'light_intensity',
	'red',
	'green',
	'blue',
	'macro_id',
	//'relative_humidity',
	//'temperature',
	//'co2_content',
	'protocol_id',
	'light_slope',
	'light_y_intercept',
	'board_temperature',
	'averages',
	'repeats',
	'data_raw',
	'end'
];

//-----------------------------------------------------------------------------------------------------------------------------------
// Initial data for plot in chrome extension
//-----------------------------------------------------------------------------------------------------------------------------------
var plotoptionschromeextension = {
	chart: {
		zoomType: 'xy',
		pinchType : 'none',
		type: 'line',
		animation: false,
		height:200
	},
	title: {
		text: false
	},
	subtitle: {
		text: false
	},
	xAxis: {
		title: {
			text: 'Measuring pulses'
		}
	},
	yAxis: {
		title: {
			text: 'Intensitity'
		},
		plotLines: [{
			value: 0,
			width: 1,
			color: '#808080'
		}]
	},
	plotOptions: {
		series: {
			animation: false
		}
	},
	tooltip: false,
	legend: false,
	credits: false,
	series: [{
		marker: {
			enabled: false
		},
		lineWidth: 4,
		data: []
	}]
};


//-----------------------------------------------------------------------------------------------------------------------------------
// Menu items with commands for quick usage.
//-----------------------------------------------------------------------------------------------------------------------------------
var MenuItems = {
	'Device': [
		{
		'type': 'spacer',
		'title': 'Device Information'
		},
		{
		'type': 'button',
		'title': 'General',
		'icon': 'fa fa-info-circle',
		'id': 'DeviceInfoBtn',
		'command': '1007+',
		'dialog': 'info',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Battery level',
		'icon': 'icon-bat2',
		'id': 'DeviceBattLevelBtn',
		'command': '1004+',
		'dialog': 'info',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Calibrations',
		'icon': 'fa fa-bar-chart-o',
		'id': 'CalibrationInfoBtn',
		'command': '1005+',
		'dialog': 'info',
		'size':''
		},
		{
		'type': 'spacer'
		},
		{
		'type': 'spacer',
		'title': 'Power Control'
		},
		{
		'type': 'button',
		'title': 'Power off',
		'icon': 'fa fa-power-off',
		'id': 'DevicePowerOffBtn',
		'command': '1001+',
		'dialog': 'info',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Power off lights only',
		'icon': 'fa fa-toggle-off',
		'id': 'DeviceLightsOffBtn',
		'command': '1003+',
		'dialog': 'info',
		'size':'sm'
		}
	],
	'Manual Control': [
		{
		'type': 'spacer',
		'title': 'Sensors'
		},
		{
		'type': 'button',
		'title': 'Light [PAR]',
		'icon': 'fa fa-area-chart',
		'id': 'LightBtn',
		'command': '101+',
		'dialog': 'close',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Light [raw signal]',
		'icon': 'fa fa-area-chart',
		'id': 'LightRawBtn',
		'command': '105+',
		'dialog': 'close',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'CO<sub>2</sub> [ppm]',
		'icon': 'fa fa-area-chart',
		'id': 'CO2Btn',
		'command': '102+',
		'dialog': 'close',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Temperature [&deg;C]',
		'icon': 'fa fa-area-chart',
		'id': 'TempBtn',
		'command': '103+',
		'dialog': 'close',
		'size':'sm'
		},{
		'type': 'button',
		'title': 'Contactless temperature [&deg;C]',
		'icon': 'fa fa-area-chart',
		'id': 'CLessTempBtn',
		'command': '106+',
		'dialog': 'close',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Relative Humidity [%]',
		'icon': 'fa fa-area-chart',
		'id': 'RelHumBtn',
		'command': '104+',
		'dialog': 'close',
		'size':'sm'
		},
		{
		'type': 'spacer'
		},
		{
		'type': 'spacer',
		'title': 'Lights & Detectors'
		},
		{
		'type': 'button',
		'title': 'Switch lights on/off',
		'icon': 'fa fa-toggle-on',
		'id': 'ManualLights',
		'command': [
				{
				'title': 'Measuring light 15 (main board)',
				'command': '15+'
				},
				{
				'title': 'Measuring light 16 (main board)',
				'command': '16+'
				},
				{
				'title': 'Measuring light 11 (add-on board)',
				'command': '11+'
				},
				{
				'title': 'Measuring light 12 (add-on board)',
				'command': '12+'
				},
				{
				'title': 'Actinic light 20 (main board)',
				'command': '20+'
				},
				{
				'title': 'Actinic light 2 (add-on board)',
				'command': '2+'
				},
				{
				'title': 'Calibrating light 14 (main board)',
				'command': '14+'
				},
				{
				'title': 'Calibrating light 10 (add-on board)',
				'command': '10+'
				}
			],
		'prompt_label': 'Intensity',
		'prompt_help': 'Set light intensity from 0-4095',
		'button_label': 'On',
		'button_behavior': 'toggle',
		'dialog': 'prompt',
		'size':'sm'
		},
		{
		'type': 'button',
		'title': 'Get detector read',
		'icon': 'fa fa-area-chart',
		'id': 'ManualDetectors',
		'command': [{
			'title': 'Detector 34 (main bord)',
			'command': '34+'
			},
			{
			'title': 'Detector 35 (add on bord)',
			'command': '35+'
			}],
		'prompt_label': 'Detection duration',
		'prompt_help': 'Set detection duration 5-500 us',
		'button_label': 'Read',
		'button_behavior': 'click',
		'dialog': 'prompt',
		'size':'sm'
		}
	]
}