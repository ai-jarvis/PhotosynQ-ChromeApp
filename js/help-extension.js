$('#HelpWizardPager .previous').on('click',function(){
	var activetab = $('#HelpWizard ul .active').index();
	$('#HelpWizard li:eq('+(activetab-1)+') a').tab('show');
});

$('#HelpWizardPager .next').on('click',function(){
	var activetab = $('#HelpWizard ul .active').index();
	$('#HelpWizard li:eq('+(activetab+1)+') a').tab('show');
});

$('#HelpWizard').on('shown.bs.tab',function(){
	var activetab = $('#HelpWizard ul .active').index();
	$('#HelpWizardPager .previous, #HelpWizardPager .next').show();
	if(activetab == 3){
		$('#HelpWizardPager .next').hide();
	}
	if(activetab == 0){
		$('#HelpWizardPager .previous').hide();
	}
});