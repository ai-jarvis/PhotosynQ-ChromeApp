var all_lights = [2,20,15,16,11,12,10,14];
var meas_lights = [15,16,11,12];
var act_lights = [2,20];
var cal_lights = [10,14];
var meas_act_lights = [15,16,11,12,2,20];
var detectors = [34,35];
var all_pins = [15,16,11,12,2,20,14,10,34,35,36,37,38,3,4,9,24,25,26,27,28,29,30,31,32,33]
var light_colors = {
	2:{color:'red',hex:'#d9534f'},
	20:{color:'red',hex:'#d9534f'},
	15:{color:'orange',hex:'#f0ad4e'},
	16:{color:'green',hex:'#5cb85c'},
	11:{color:'red',hex:'#428bca'},
	12:{color:'infrared',hex:'#dddddd'},
	10:{color:'infrared',hex:'#dddddd'},
	14:{color:'infrared',hex:'#dddddd'}
}

var parameters = [
	{
	'name':'light_intensity',
	'label':'Light intensity [&micro;E s<sup>-1</sup> m<sup>2</sup>]',
	'title':'Measure current light intensity in PAR. Range from 0 to &micro;E s<sup>-1</sup> m<sup>2</sup>. Accuracy: ±',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
	'value':0,
	'advanced':false
	},
	{
	'name':'relative_humidity',
	'label':'Relative Humidity [%]',
	'title':'Measure current relative humidity in percent. Range: 5 to 95 %. Accuracy: ±2 %.',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
	'value':0,
	'advanced':false
	},
	{
	'name':'temperature',
	'label':'Ambient Temperature in [&deg;C]',
	'title':'Measure current ambient temperature in degrees Celsius. Range: -30 to 90 °C. Accuracy: ±1 °C.',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
	'value':0,
	'advanced':false
	},
	{
	'name':'co2',
	'label':'CO<sub>2</sub> [ppm]',
	'title':'Measure Carbon-dioxide concentration in parts per million. Range: 400 to 2000 ppm. Accuracy: ±70 ppm ± 3% of reading.',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
	'value':0,
	'advanced':false
	},
	{
	'name':'contactless_temperature',
	'label':'Leaf Temperature [&deg;C]',
	'title':'Measure leaf temperature in degrees Celsius',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
	'value':0,
	'advanced':false
	},
	{
	'name':'note',
	'label':'Measurement notes',
	'title':'Add notes to your current measurement, before or after it is done',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['beginning','end'],
	'input_title': ['before measurement','after measurement'],
	'value':0,
	'advanced':false
	},
	// MAIN GROUP
	{	
	'name':'pulsesize',
	'label':'Duration of measuring pulses',
	'title':'Duration of measuring pulses in &micro;s. Range: 5-100 &micro;s',
	'type':'int',
	'group':'main',
	'color':'#5cb85c',
	'range_type':'int_range',
	'range':[5,100],
	'input_type': 'text',
	'input_label': '&micro;s',
	'input_title': 'Range 5-100',
	'value':10,
	'advanced':false
	},
	{	
	'name':'pulsedistance',
	'label':'Time between measuring pulses',
	'title':'Time between measuring pulses in &micro;s. Range: 1000-10000000 &micro;s',
	'type':'int',
	'group':'main',
	'color':'#5cb85c',
	'range_type':'int_range',
	'range':[1000,10000000],
	'input_type': 'text',
	'input_label': '&micro;s',
	'input_title': 'Range 1000-10000000',
	'value':'10000',
	'advanced':false
	},
	{	
	'name':'pulses',
	'label':'Pulse sets',
	'title':'Pulse sets, and number of pulses in each set. Range: 0-5000',
	'type':'array',
	'group':'main',
	'color':'#3c763d',
	'range_type':'int_range_sum',
	'range':[0,5000],							// limit of ~5000, but I need to clarify this
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-5000',
	'value':'100,100,100,100',
	'advanced':false
	},
	{	
	'name':'meas_lights',
	'label':'Pulsed lights',
	'title':'Pin number for pulsed lights. Pins: '+all_lights.join(', '),
	'type':'arrayarray_def',
	'group':'main',
	'color':'#5cb85c',
	'range_type':'int_list',
	'range':all_lights,
	'input_type': 'array_text',
	'input_label': false,
	'input_title': '',
	'value':[[15],[15],[15],[15]],
	'advanced':false
	},
	{	
	'name':'detectors',
	'label':'Detectors',
	'title':'34 - IR detector on main unit, 35 - visible light detector on add-on unit',
	'type':'arrayarray_def',
	'group':'main',
	'color':'#5cb85c',
	'range_type':'int_list',
	'range':detectors,
	'input_type': 'array_text',
	'input_label': false,
	'input_title': '',
	'value':[[34],[34],[34],[34]],
	'advanced':false
	},
// LIGHT INTENSITIES
	{	
	'name':'meas_intensities',
	'label':'Intensity for lights 15, 16, 11, 12',
	'title':'Intensity values from 1 (high) to 1200 (off)',
	'type':'array_def',
	'group':'if_meas',
	'range_type':'int_range',
	'range':[1200,0],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 1200-1 (low-high)',
	'value':'',
	'advanced':false
	},
	{	
	'name':'act_intensities',
	'label':'Intensity for lights 2, 20',
	'title':'Intensity values from 0 (low) to 2710 (high ~10,000uE)',
	'type':'array_def',
	'group':'if_act',
	'range_type':'int_range',
	'range':[0,4095],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-2710 (low-high)',
	'value':'',
	'advanced':false
	},
	{	
	'name':'cal_intensities',
	'label':'Intensity for lights 10, 14',
	'title':'Intensity values from 0 (low) to 4095 (high)',
	'type':'array_def',
	'group':'if_cal',
	'range_type':'int_range',
	'range':[0,4095],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-4095 (low-high)',
	'value':'',
	'advanced':false
	},
// ACTINIC AND ALTERNATE LIGHTS
	{	
	'name':'act1_lights',
	'label':'Non-pulsed set of lights #1',
	'title':'Pins for non-pulsed lights #1. Pins: '+meas_act_lights.join(', '),
	'type':'array_def',
	'group':'',
	'range_type':'int_list',
	'range':meas_act_lights,
	'input_type': 'text',
	'input_label': false,
	'input_title': '',
	'value':'1',
	'advanced':false
	},
	{	
	'name':'act2_lights',
	'label':'Non-pulsed set of lights #2',
	'title':'Pins for non-pulsed lights #2. Pins: '+meas_act_lights.join(', '),
	'type':'array_def',
	'group':'',
	'range_type':'int_list',
	'range':meas_act_lights,
	'input_type': 'text',
	'input_label': false,
	'input_title': '',
	'value':'20',
	'advanced':false
	},
	{	
	'name':'alt1_lights',
	'label':'Non-pulsed set of lights #3',
	'title':'Pins for non-pulsed lights #3. Pins: '+meas_act_lights.join(', '),
	'type':'array_def',
	'group':'',
	'range_type':'int_list',
	'range':meas_act_lights,
	'input_type': 'text',
	'input_label': false,
	'input_title': '',
	'value':'16',
	'advanced':false
	},
	{	
	'name':'alt2_lights',
	'label':'Non-pulsed set of lights #4',
	'title':'Pins for non-pulsed lights #4. Pins: '+meas_act_lights.join(', '),
	'type':'array_def',
	'group':'',
	'range_type':'int_list',
	'range':meas_act_lights,
	'input_type': 'text',
	'input_label': false,
	'input_title': '',
	'value':'11',
	'advanced':false
	},
	// BACKGROUND ACTINIC SETTING
	{	
	'name':'tcs_to_act',
	'label':'Background light intensity (ambient)',
	'title':'Set variable intensity of background light to x% of the measured ambient light intensity',
	'type':'int',
	'group':'actinic_var',
	'color':'#f0ad4e',
	'range_type':'int_range',
	'range': [0,500],
	'input_type': 'text',
	'input_label': '%',
	'input_title': 'Range 0-500 %',
	'value':100,
	'advanced':false
	},
	{
	'name':'act_background_light',
	'label':'Background light',
	'title':'Background light pin (stays on between protocols and measurements). Pins: '+act_lights.join(', '),
	'type':'int',
	'group':'actinic_const,actinic_var',
	'color':'#f0ad4e',
	'range_type':'int_list',
	'range':act_lights,
	'input_type': 'select',
	'input_label': 'Light',
	'input_title': '',
	'value':20,
	'advanced':false
	},
	{
	'name':'act_background_light_intensity',
	'label':'Background light intensity (constant)',
	'title':'value between 0 (off) to 2710 (high ~10,000uE)',
	'type':'int',
	'group':'actinic_const',
	'color':'#f0ad4e',
	'range_type':'int_range',
	'range':[0,4095],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-2710 (low-high)',
	'value':129,
	'advanced':false
	},
	// NUMBER OF MEASUREMENTS, AVERAGES, DELAYS, ETC.
	{	
	'name':'measurements',
	'label':'Measurement repeats',
	'title':'Number of times to repeat entire measurement. Range: 0-100000 repeats.',
	'type':'int',
	'group':'measurements',
	'color':'#428bca',
	'range_type':'int_range',
	'range':[0,100000],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-100000',
	'value':1,
	'advanced':false
	},
	{	
	'name':'measurements_delay',
	'label':'Measurement delay',
	'title':'Delay between measurements in seconds. Range between 0-100000 seconds.',
	'type':'float',
	'group':'measurements',
	'color':'#428bca',
	'range_type':'int_range',
	'range':[0,100000],
	'input_type': 'text',
	'input_label': 'sec',
	'input_title': 'Range 0-100000',
	'value':1,
	'advanced':false
	},
	{	
	'name':'protocols',
	'label':'Protocol repeats',
	'title':'Number of times to repeat protocol. Range: 0-100000 repeats.',
	'type':'int',
	'group':'protocol',
	'color':'#2d6ca2',
	'range_type':'int_range',
	'range':[0,100000],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-100000',
	'value':1,
	'advanced':false
	},
	{	
	'name':'protocols_delay',
	'label':'Protocol delay',
	'title':'Delay between protocols in seconds. Range: 0-100000 seconds.',
	'type':'int',
	'group':'protocol',
	'color':'#2d6ca2',
	'range_type':'int_range',
	'range':[0,100000],
	'input_type': 'text',
	'input_label': 'sec',
	'input_title': 'Range 0-100000',
	'value':5,
	'advanced':false
	},
	{	
	'name':'averages',
	'label':'Protocol internal averages',
	'title':'Number of times to repeat a protocol to produce a single averaged protocol output. Range: 0-30 averages.',
	'type':'int',
	'group':'averages',
	'color':'#5bc0de',
	'range_type':'int_range',
	'range':[0,30],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-30',
	'value':1,
	'advanced':false
	},
	{	
	'name':'averages_delay',
	'label':'Delay between protocol internal averages',
	'title':'Delay between Protocol internal averages in seconds. Range: 0-100000 seconds.',
	'type':'float',
	'group':'averages',
	'color':'#5bc0de',
	'range_type':'int_range',
	'range':[0,100000],
	'input_type': 'text',
	'input_label': 'sec',
	'input_title': 'Range 0-100000',
	'value':0,
	'advanced':false
	},
	// ADMIN FUNCTIONS
	{	
	'name':'analog_averages',
	'label':'Internal averages by detector',
	'title':'Number of times detector internally averages (keep to 1). Range: 0-30 averages.',
	'type':'int',
	'group':'admin',
	'range_type':'int_range',
	'range':[0,30],
	'input_type': 'text',
	'input_label': false,
	'input_title': 'Range 0-30',
	'value':1,
	'advanced':true
	},
	{
	'name':'get_userdef0',
	'label':'User saved values #0',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef1',
	'label':'User saved values #1',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef2',
	'label':'User saved values #2',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef3',
	'label':'User saved values #3',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef4',
	'label':'User saved values #4',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef5',
	'label':'User saved values #5',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_userdef6',
	'label':'User saved values #6',
	'title':'Get user defined data saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include value in output','Exclude value from output'],
	'value':0,
	'advanced':true
	},
	{
	'name':'offset_off',
	'label':'Detector offset',
	'title':'Turn detector offset on / off',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['on','off'],
	'input_title': ['Detector offset on','Detector offset off'],
	'value':0,
	'advanced':true
	},
	{
	'name':'get_offset',
	'label':'Get detector offset',
	'title':'Include detector offset in device output (on / off)',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include in output','Exclude from output'],
	'value':0,
	'advanced':true
	},
	{	
	'name':'get_ir_baseline',
	'label':'Infrared offset',
	'title':'Include infrared offset slope and y-intercept saved on device for a specific pin. Pins: '+all_pins.join(', '),
	'type':'array',
	'group':'',
	'range':all_pins,
	'input_type': 'text',
	'input_label': 'Pin(s)',
	'input_title': 'Range '+all_pins.join(', '),
	'value':1,
	'advanced':true
	},
	{	
	'name':'get_tcs_cal',
	'label':'PAR sensor calibration information',
	'title':'Include PAR sensor calibration information saved on device',
	'type':'int',
	'group':'',
	'range': [0,1],
	'input_type': 'radio',
	'input_label': ['include','exclude'],
	'input_title': ['Include in output','Exclude from output'],
	'value':0,
	'advanced':true
	},
	{	
	'name':'get_lights_cal',
	'label':'PAR conversion factor for light',
	'title':'Include PAR conversion factor saved on device for a specific pin. Pins: '+all_pins.join(', '),
	'type':'array',
	'group':'',
	'range':all_pins,
	'input_type': 'text',
	'input_label': 'Pin(s)',
	'input_title': 'Range '+all_pins.join(', '),
	'value':1,
	'advanced':true
	},
	{	
	'name':'get_blank_cal',
	'label':'Blank for transmittance',
	'title':'Include blank detector value saved on device for a specific pin. Pins: '+all_pins.join(', '),
	'type':'array',
	'group':'',
	'range':all_pins,
	'input_type': 'text',
	'input_label': 'Pin(s)',
	'input_title': 'Range '+all_pins.join(', '),
	'value':1,
	'advanced':true
	},
	{	
	'name':'get_other_cal',
	'label':'User saved calibration values',
	'title':'Include user defined calibration value saved on device for a specific pin. Range: '+all_pins.join(', '),
	'type':'array',
	'group':'',
	'range':all_pins,
	'input_type': 'text',
	'input_label': 'Pin(s)',
	'input_title': 'Range '+all_pins.join(', '),
	'value':1,
	'advanced':true
	}
]