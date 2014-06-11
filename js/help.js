onload = function() {
	// Resizing app events
	// ===============================================================================================
	var bodyheight =$(window).height()-15
	$("#MainDisplayContainer").height(bodyheight);
	$("#MainDisplayContainer >.tab-content >.tab-pane").height(bodyheight-90);
	$("#MainDisplayContainer >.tab-content .tab-content").height(bodyheight-180);
	$(window).resize(function() {
		bodyheight = $(window).height()-15;
		$("#MainDisplayContainer").height(bodyheight);
		$("#MainDisplayContainer >.tab-content >.tab-pane").height(bodyheight-90);
		$("#MainDisplayContainer >.tab-content .tab-content").height(bodyheight-180);
	});
	
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
}