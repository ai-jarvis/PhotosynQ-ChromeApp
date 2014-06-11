(function() {
  if (chrome.serial.getDevices) {
    return;
  }
 console.log('Old API fallback');
  var connections = {};
 
  chrome.serial.onReceive = new chrome.Event();
  chrome.serial.onReceiveError = new chrome.Event();
 
  chrome.serial.getDevices = function(callback) {
    chrome.serial.getPorts(function(ports) {
      callback(ports.map(function(path) {
        return { path: path };
      }));
    });
  };
 
  chrome.serial.connect = function(path, options, callback) {
    var parityBit = options.parityBit;
    if (options.dataBits === 'seven')
      options.dataBit = 'sevenbit';
    else if (options.dataBits === 'eight')
      options.dataBit = 'eightbit';
    if (options.stopBits === 'one')
      options.stopBit = 'onestopbit';
    else if (options.stopBits === 'two')
      options.stopBit = 'twostopbit';
    if (parityBit)
      options.parityBit = parityBit + 'parity';
    chrome.serial.open(path, options, function(connectionInfo) {
      if (connectionInfo.connectionId === -1) {
        callback();
      } else {
        var id = connectionInfo.connectionId;
        var connection = {
          id: id,
          paused: false,
          persistent: false,
          name: '',
          bufferSize: options.bufferSize || 4096,
          bitrate: options.bitrate || 9600,
          dataBits: options.dataBits || 'eight',
          parityBit: parityBit || 'no',
          ctsFlowControl: false,
          receiveTimeout: 0,
          sendTimeout: 0,
          sendPending: false,
          keepReading: true,
		  connectionId: id
        };
        connections[id] = connection;
        ["persistent", "name", "ctsFlowControl", "receiveTimeout", "sendTimeout"].forEach(
            function(option) {
              if (options[option])
                console.warn("Ignoring unsupported option: ", option);
            });
        chrome.serial.read(id, connection.bufferSize, readLoop.bind(null, id));
        callback(connection);
      }
    });
  };
 
  chrome.serial.update = function(id, options, callback) {
    console.warn("Unsupported function.");
  };
 
  chrome.serial.disconnect = function(id, callback) {
    chrome.serial.close(id, function(result) {
      if (result)
		connectionId = -1;
        //connection[id] = null;
      callback(result);
    });
  };
 
  chrome.serial.setPaused = function(id, paused, callback) {
    console.log("Unsupported function.");
  };
 
  /*chrome.serial.getInfo(function(id, callback) {
    var connection = connections[id];
    if (!connection) {
      callback();
    } else {
      var info = {};
      for (var k in connection) {
        info[k] = connection[k];
      }
      callback(info);
    }
  });
 
  chrome.serial.getConnections(function(callback) {
    var result = [];
    for (var id in connections) {
      result.push(connections[id]);
    }
  });
 */
  chrome.serial.send = function(id, data, callback) {
    var connection = connections[id];
    if (connection.sendPending) {
      setTimeout(callback.bind(null, { bytesSent: 0, error: "pending" }), 0);
      return;
    }
    connection.sendPending = true;
    chrome.serial.write(id, data, function(writeInfo) {
      var connection = connections[id];
      if (connection)
        connection.sendPending = false;
      if (writeInfo.bytesWritten === -1) {
        if (!connection)
          callback({ bytesSent: 0, error: "disconnected" });
        else
          callback({ bytesSent: 0, error: "system_error" });
      } else {
        callback({ bytesSent: writeInfo.bytesWritten });
      }
    });
  };
 
  var readLoop = function(id, readInfo) {
    var connection = connections[id];
    if (readInfo.bytesRead === -1) {
      if (!connection)
        chrome.serial.onReceiveError.dispatch({ connectionId: id, error: "disconnected" });
      else
        chrome.serial.onReceiveError.dispatch({ connectionId: id, error: "system_error" });
    } else if (readInfo.bytesRead === 0) {
      chrome.serial.onReceiveError.dispatch({ connectionId: id, error: "device_lost" });
    } else {
      chrome.serial.onReceive.dispatch({ connectionId: id, data: readInfo.data });
    }
    if (connection)
      chrome.serial.read(id, connection.bufferSize, readLoop.bind(null, id));
  };
}());