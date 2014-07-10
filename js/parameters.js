var all_lights = [2,20,15,16,11,12,10,14];
var meas_lights = [15,16,11,12];
var act_lights = [2,20];
var cal_lights = [10,14];
var meas_act_lights = [15,16,11,12,2,20];
var detectors = [34,35];
var light_colors = {
	2:{color:'red',hex:'#d9534f'},
	20:{color:'red',hex:'#d9534f'},
	15:{color:'orange',hex:'#f0ad4e'},
	16:{color:'green',hex:'#5cb85c'},
	11:{color:'red',hex:'#428bca'},
	12:{color:'infrared',hex:'#e1e1e1'},
	10:{color:'infrared',hex:'#e1e1e1'},
	14:{color:'infrared',hex:'#e1e1e1'}
}


//blue #428bca;
//green #5cb85c;
//light blue    #5bc0de;
//orange #f0ad4e;
//red #d9534f;

var parameters = [
		{
		'name':'light_intensity',
		'label':'Light intensity [&mu;mol s<sup>-1</sup> m<sup>2</sup>]',
		'title':'Measure current light intensity',
		'type':'int',
		'group':'',
		'range': [0,1],
		'input_type': 'radio',
		'input_label': ['before','after'],
		'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
		'value':0
		},
		{
		'name':'relative_humidity',
		'label':'Relative Humidity [%]',
		'title':'Measure current relative humidity',
		'type':'int',
		'group':'',
		'range': [0,1],
		'input_type': 'radio',
		'input_label': ['before','after'],
		'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
		'value':0
		},
		{
		'name':'temperature',
		'label':'Ambient Temperature [&deg;C]',
		'title':'Measure current temperature in degrees Celsius',
		'type':'int',
		'group':'',
		'range': [0,1],
		'input_type': 'radio',
		'input_label': ['before','after'],
		'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
		'value':0
		},
		{
		'name':'co2',
		'label':'CO<sub>2</sub> [ppm]',
		'title':'Measure Carbon-dioxide concentration in parts per million',
		'type':'int',
		'group':'',
		'range': [0,1],
		'input_type': 'radio',
		'input_label': ['before','after'],
		'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
		'value':0
		},
		{
		'name':'contactless_temperature',
		'label':'Leaf Temperature [&deg;C]',
		'title':'Measure leaf temperature in degrees Celsius',
		'type':'int',
		'group':'',
		'range': [0,1],
		'input_type': 'radio',
		'input_label': ['before','after'],
		'input_title': ['before spectroscopic measurement','after spectroscopic measurement'],
		'value':0
		},
		// MAIN GROUP
		{	
		'name':'pulsesize',
		'label':'Size of measuring pulses',
		'title':'Size of measuring pulses',
		'type':'int',
		'group':'main',
		'color':'#3c763d',
		'range_type':'int_range',
		'range':[5,100],
		'input_type': 'text',
		'input_label': '&micro;s',
		'input_title': 'Range 5-100',
		'value':10
		},
,
		{	
		'name':'pulsedistance',
		'label':'Distance between measuring pulses',
		'title':'Distance between measuring pulses',
		'type':'int',
		'group':'main',
		'color':'#3c763d',
		'range_type':'int_range',
		'range':[1000,10000000],
		'input_type': 'text',
		'input_label': '&micro;s',
		'input_title': 'Range 1000-10000000',
		'value':'10000'
		},
		{	
		'name':'pulses',
		'label':'Measuring pulse sets, and number of pulses in each set',
		'title':'Number of pulses and number of pulse sets',
		'type':'array',
		'group':'main',
		'color':'#3c763d',
		'range_type':'int_range_sum',
		'range':[0,5000],							// limit of ~5000, but I need to clarify this
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-5000',
		'value':'100,100,100,100'
		},
		{	
		'name':'detectors',
		'label':'Teensy pin number for detectors',
		'title':'',
		'type':'arrayarray_def',
		'group':'main',
		'color':'#3c763d',
		'range_type':'int_list',
		'range':detectors,
		'input_type': 'array_text',
		'input_label': false,
		'input_title': '',
		'value':[[15],[15],[15],[15]]
		},
		{	
		'name':'meas_lights',
		'label':'Teensy pin number for measuring lights',
		'title':'Teensy pin number for measuring lights',
		'type':'arrayarray_def',
		'group':'main',
		'color':'#3c763d',
		'range_type':'int_list',
		'range':all_lights,
		'input_type': 'array_text',
		'input_label': false,
		'input_title': '',
		'value':[[15],[15],[15],[15]]
		},
// LIGHT INTENSITIES
		{	
		'name':'meas_intensities',
		'label':'Intensity for measuring lights (15,16,11,12)',
		'title':'values from 0 (high) to 2092 (off)',
		'type':'array_def',
		'group':'if_meas',
		'range_type':'int_range',
		'range':[0,4095],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-4095',
		'value':''
		},
		{	
		'name':'act_intensities',
		'label':'Intensity for actinic lights (2,20)',
		'title':'values from 0 (low) to 2710 (high ~10,000uE)',
		'type':'array_def',
		'group':'if_act',
		'range_type':'int_range',
		'range':[0,4095],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-4095',
		'value':''
		},
		{	
		'name':'cal_intensities',
		'label':'Intensity for calibration lights (10,14)',
		'title':'values from 0 (low) to 4095 (high)',
		'type':'array_def',
		'group':'if_cal',
		'range_type':'int_range',
		'range':[0,4095],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-4095',
		'value':''
		},
// ACTINIC AND ALTERNATE LIGHTS
		{	
		'name':'act1_lights',
		'label':'Teensy pin for actinic light 1',
		'title':'Teensy pin for actinic light 1',
		'type':'array_def',
		'group':'',
		'range_type':'int_list',
		'range':meas_act_lights,
		'input_type': 'text',
		'input_label': false,
		'input_title': '',
		'value':'1'
		},
		{	
		'name':'act2_lights',
		'label':'Teensy pin for actinic light 2',
		'title':'Teensy pin for actinic light 2',
		'type':'array_def',
		'group':'',
		'range_type':'int_list',
		'range':meas_act_lights,
		'input_type': 'text',
		'input_label': false,
		'input_title': '',
		'value':'20'
		},
		{	
		'name':'alt1_lights',
		'label':'Teensy pin for alternate light 1',
		'title':'Teensy pin for alternate light 1',
		'type':'array_def',
		'group':'',
		'range_type':'int_list',
		'range':meas_act_lights,
		'input_type': 'text',
		'input_label': false,
		'input_title': '',
		'value':'16'
		},
		{	
		'name':'alt2_lights',
		'label':'Teensy pin for alternate light 2',
		'title':'Teensy pin for alternate light 2',
		'type':'array_def',
		'group':'',
		'range_type':'int_list',
		'range':meas_act_lights,
		'input_type': 'text',
		'input_label': false,
		'input_title': '',
		'value':'11'
		},
		{	
		'name':'pin21',
		'label':'stepper_motor',
		'title':'',
		'type':'int',
		'group':'',
		'range_type':'',
		'range':'',
		'input_type': 'text',
		'input_label': false,
		'input_title': '',
		'value':'100'
		},
// BACKGROUND ACTINIC SETTING
		{	
		'name':'tcs_to_act',
		'label':'Variable intensity of background actinic',
		'title':'Set variable intensity of background actinic to x% of the measured ambient light intensity',
		'type':'int',
		'group':'actinic_var',
		'range_type':'int_range',
		'range': [0,500],
		'input_type': 'text',
		'input_label': '%',
		'input_title': 'Range 0-500 %',
		'value':100
		},
		{
		'name':'act_background_light',
		'label':'Background actinic light',
		'title':'Teensy pin to set as the background actinic light (stays on between protocols and measurements)',
		'type':'int',
		'group':'actinic_const,actinic_var',
		'range_type':'int_list',
		'range':act_lights,
		'input_type': 'select',
		'input_label': 'Light',
		'input_title': '',
		'value':20
		},
		{
		'name':'act_background_light_intensity',
		'label':'Constant intensity of background actinic light',
		'title':'value between 0 (off) to 2710 (high ~10,000uE)',
		'type':'int',
		'group':'actinic_const',
		'range_type':'int_range',
		'range':[0,4095],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-4095',
		'value':129
		},
// NUMBER OF MEASUREMENTS, AVERAGES, DELAYS, ETC.
		{	
		'name':'measurements',
		'label':'Measurements',
		'title':'Number of times to repeat entire measurement',
		'type':'int',
		'group':'measurements',
		'range_type':'int_range',
		'range':[0,100000],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-100000',
		'value':1
		},
		{	
		'name':'measurements_delay',
		'label':'Measurement delay',
		'title':'Delay between measurements in seconds',
		'type':'float',
		'group':'measurements',
		'range_type':'int_range',
		'range':[0,100000],
		'input_type': 'text',
		'input_label': 'sec',
		'input_title': 'Range 0-100000',
		'value':1
		},
		{	
		'name':'protocols_delay',
		'label':'Protocols delay',
		'title':'Delay between protocols',
		'type':'int',
		'group':'',
		'range_type':'int_range',
		'range':[0,100000],
		'input_type': 'text',
		'input_label': 'sec',
		'input_title': 'Range 0-100000',
		'value':5
		},
		{	
		'name':'averages',
		'label':'Protocol averages',
		'title':'Number of times to repeat a protocol to produce a single averaged protocol output',
		'type':'int',
		'group':'averages',
		'range_type':'int_range',
		'range':[0,30],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-30',
		'value':1
		},
		{	
		'name':'averages_delay',
		'label':'Averages delay',
		'title':'Delay between internal averages in seconds',
		'type':'float',
		'group':'averages',
		'range_type':'int_range',
		'range':[0,100000],
		'input_type': 'text',
		'input_label': 'sec',
		'input_title': 'Range 0-100000',
		'value':0
		},
// CALIBRATION
		{	
		'name':'protocol_name',
		'label':'Name of protocol',
		'title':'Name of protocol (for calibration only)',
		'type':'string',
		'group':'calibration',
		'range_type':'string_list',
		'range':['calibration','calibration_spad_ndvi'],
		'input_type': 'select',
		'input_label': false,
		'input_title': '',
		'value':'calibration'
		},
		{	
		'name':'cal_true',
		'label':'Calibration protocol',
		'title':'Define as a calibration protocol',
		'type':'int',
		'group':'calibration',
		'range_type':'int_list',
		'range':[0,1,2],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0,1,2',
		'value':2
		},
		{	
		'name':'baselines',
		'label':'Turn on IR baseline correction',
		'title':'for pin number (0,15,16,20), 1 for on, 0 for off',
		'type':'array_4',
		'group':'',
		'range_type':'int_list',
		'range':[0,1],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0,1',
		'value':'0,0,0,0'
		},
// ADMIN FUNCTIONS
		{	
		'name':'analog_averages',
		'label':'Internal averages by detector',
		'title':'Number of times detector internally averages (keep to 1)',
		'type':'int',
		'group':'admin',
		'range_type':'int_range',
		'range':[0,30],
		'input_type': 'text',
		'input_label': false,
		'input_title': 'Range 0-30',
		'value':1
		}
	]