/*
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
	"time_offset",
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
	'Manual Control': [
		{
		'type': 'spacer',
		'title': 'Sensors'
		},
		{
		'type': 'button',
		'title': 'Light [PAR]',
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
		},{
		'type': 'button',
		'title': 'Contactless temperature [&deg;C]',
		'icon': 'fa fa-sun-o',
		'id': 'CLessTempBtn',
		'command': '106+',
		'dialog': 'close'
		},
		{
		'type': 'button',
		'title': 'Relative Humidity [%]',
		'icon': 'fa fa-tint',
		'id': 'RelHumBtn',
		'command': '104+',
		'dialog': 'close'
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
		'icon': 'fa fa-lightbulb-o',
		'id': 'ManualLights',
		'command': [
				{
				'title': 'Measuring light 1 (main board)',
				'command': '15+'
				},
				{
				'title': 'Measuring light 2 (main board)',
				'command': '16+'
				},
				{
				'title': 'Measuring light 3 (add-on board)',
				'command': '11+'
				},
				{
				'title': 'Measuring light 4 (add-on board)',
				'command': '12+'
				},
				{
				'title': 'Actinic light 1 (main board)',
				'command': '20+'
				},
				{
				'title': 'Actinic light 2 (add-on board)',
				'command': '2+'
				},
				{
				'title': 'Calibrating light 1 (main board)',
				'command': '14+'
				},
				{
				'title': 'Calibrating light 2 (add-on board)',
				'command': '10+'
				}
			],
		'prompt_label': 'Intensity',
		'prompt_help': 'Set light intensity from 0-4095',
		'button_label': 'On',
		'button_behavior': 'toggle',
		'dialog': 'prompt'
		},
		{
		'type': 'button',
		'title': 'Get detector read',
		'icon': 'fa fa-square',
		'id': 'ManualDetectors',
		'command': [{
			'title': 'Detector 1 (main bord)',
			'command': '34+'
			},
			{
			'title': 'Detector 2 (add on bord)',
			'command': '35+'
			}],
		'prompt_label': 'Detection duration',
		'prompt_help': 'Set detection duration 5-500 us',
		'button_label': 'Read',
		'button_behavior': 'click',
		'dialog': 'prompt'
		}
	]
}