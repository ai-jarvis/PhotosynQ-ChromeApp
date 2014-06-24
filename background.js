// ===============================================================================================
// 					Main Window Parameters and events
// ===============================================================================================
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('MainWindow.html', {
		id: "mainwindow",
		bounds: {
			top: 0,
			left: 0,
			width: 1024,
			height: 720
		},
		minHeight: 680,
		minWidth: 1000
	}, function (Mainwindow){
		Mainwindow.onClosed.addListener(function() {

			/* close serial connection(s) */
			chrome.serial.getConnections(function(connections){
				for(i in connections)
					chrome.serial.disconnect(connections[i].connectionId, function(){});
			});
			
			/* close all open windows */
			var allWindows = chrome.app.window.getAll();
			for(windowID in allWindows){
				if(allWindows[windowID].id != "mainwindow")
					allWindows[windowID].close();	
			}
			
		});
	});
});