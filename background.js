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
			chrome.serial.close(connectionId, function(){});
		});
	});
});