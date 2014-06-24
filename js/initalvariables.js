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
	'protocol_number',
	'protocol_name',
	'baseline_sample',
	'baseline_values',
	'chlorophyll_spad_calibration',
	//'light_intensity',
	'red',
	'green',
	'blue',
	//'relative_humidity',
	//'temperature',
	//'co2_content',
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
		'type': 'button',
		'title': 'Device Info',
		'icon': 'fa fa-info-circle',
		'id': 'DeviceInfoBtn',
		'command': '1007+',
		'dialog': 'info'
		},
		{
		'type': 'button',
		'title': 'Battery level',
		'icon': 'icon-bat2',
		'id': 'DeviceBattLevelBtn',
		'command': '1004+',
		'dialog': 'info'
		},
		{
		'type': 'button',
		'title': 'Calibration Info',
		'icon': 'fa fa-bar-chart-o',
		'id': 'CalibrationInfoBtn',
		'command': '1005+',
		'dialog': 'info'
		},
		{
		'type': 'spacer'
		},
		{
		'type': 'button',
		'title': 'Power off',
		'icon': 'fa fa-power-off',
		'id': 'DevicePowerOffBtn',
		'command': '1001+',
		'dialog': 'info'
		},
		{
		'type': 'button',
		'title': 'Power off lights only',
		'icon': 'fa fa-lightbulb-o',
		'id': 'DeviceLightsOffBtn',
		'command': '1003+',
		'dialog': 'info'
		}
	],
	'Sensors': [
		{
		'type': 'button',
		'title': 'Light',
		'icon': 'fa fa-lightbulb-o',
		'id': 'LightBtn',
		'command': '101+',
		'dialog': 'close'
		},
		{
		'type': 'button',
		'title': 'Light [raw signal]',
		'icon': 'fa fa-lightbulb-o',
		'id': 'LightRawBtn',
		'command': '105+',
		'dialog': 'close'
		},
		{
		'type': 'button',
		'title': 'CO<sub>2</sub> [ppm]',
		'icon': 'fa fa-cloud',
		'id': 'CO2Btn',
		'command': '102+',
		'dialog': 'close'
		},
		{
		'type': 'button',
		'title': 'Temperature [&deg;C]',
		'icon': 'fa fa-sun-o',
		'id': 'TempBtn',
		'command': '103+',
		'dialog': 'close'
		},
		{
		'type': 'button',
		'title': 'Relative Humidity [%]',
		'icon': 'fa fa-tint',
		'id': 'RelHumBtn',
		'command': '104+',
		'dialog': 'close'
		}
	],
	'Spectroscopy': [
		{
		'type': 'button',
		'title': 'Measuring light 1 (main board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'MeasureLight1Btn',
		'command': '15+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Measuring light 2 (main board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'MeasureLight2Btn',
		'command': '16+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Measuring light 3 (add-on board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'MeasureLight3Btn',
		'command': '11+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Measuring light 4 (add-on board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'MeasureLight4Btn',
		'command': '12+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Actinic light 1 (main board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'ActLight1Btn',
		'command': '20+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Actinic light 2 (add-on board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'ActLight2Btn',
		'command': '2+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Calibrating light 1 (main board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'CalLight1Btn',
		'command': '14+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Calibrating light 2 (add-on board)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'CalLight2Btn',
		'command': '10+',
		'dialog': 'static'
		},
		{
		'type': 'spacer'
		},
		{
		'type': 'button',
		'title': 'Detector 1 (main bord)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'SpectroscopyDetector1Btn',
		'command': '34+',
		'dialog': 'static'
		},
		{
		'type': 'button',
		'title': 'Detector 2 (add on bord)',
		'icon': 'fa fa-lightbulb-o',
		'id': 'SpectroscopyDetector2Btn',
		'command': '35+',
		'dialog': 'static'
		}
	]
}