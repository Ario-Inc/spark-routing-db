var settings = require('./settings.js');
var loki = require('lokijs');
var db = new loki('./routing.db', {
    autoload: true,
    autoloadCallback: dbLoader,
    autosave: true,
    autosaveInterval: 10000,
});
var modules;
function dbLoader() {
  console.log("This Fired...");
  // if database did not exist it will be empty so I will intitialize here
  modules = db.getCollection('modules');
  if (modules === null) {
    modules = db.addCollection('modules', {unique: ['deviceid']});
  }

}

//var modules =  db.addCollection('modules', { unique: ['deviceid'] } );

// modules.insert({ deviceid: '310017000647343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '2c0045000647343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '440030001747343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '2f0019001247343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '300019001247343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '310023000647343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '1c0036001947343433313339', server: "13.88.11.101"})
// modules.insert({ deviceid: '360030000147343433313337', server: "13.88.11.101"})
// modules.insert({ deviceid: '2d0048000647343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '300036001147343431373336', server: "13.88.11.101"})
// modules.insert({ deviceid: '25001f001247343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '170032000447343432313031', server: "13.88.11.101"})
// modules.insert({ deviceid: '330046001147343431373336', server: "13.88.11.101"})
// modules.insert({ deviceid: '230021001947343433313339', server: "13.88.11.101"})
// modules.insert({ deviceid: '23001a001947343433313339', server: "13.88.11.101"})
// modules.insert({ deviceid: '420024000147343433313337', server: "13.88.11.101"})

const url = require('url');
var http = require('http'),
    httpProxy = require('http-proxy');


var ipc = require('node-ipc');
ipc.config.id = 'routingdb';


//Initialize ipc server
ipc.serveNet(
    settings.ipaddress,
    2000,
    function() {
        //console.log("Got IPC Message...");
        ipc.server.on('query',
            function(data, socket) {
                console.log("Got query command...");
                var query = JSON.parse(data);
                var server = modules.findOne({deviceid: query.deviceid});
                if (server) {
                    ipc.server.emit(
                        socket,
                        'results',
                        {
                            from : ipc.config.id,
                            message: JSON.stringify({serverid: server.id})
                        }
                    );
                }
            }
        );
        ipc.server.on('update',
            function(data, socket) {
                console.log("Got update command...");
                var query = JSON.parse(data);
                var record = modules.findOne({deviceid: query.deviceid});
                if (record) {
                    record.server = query.server;
                    modules.update(record);
                }
                else {
                    modules.insert({deviceid: query.deviceid, server: query.server});
                }
                if (server) {
                    ipc.server.emit(
                        socket,
                        'results',
                        {
                            from : ipc.config.id,
                            message: "Update Complete"
                        }
                    );
                }
            }
        );        
        console.log(ipc.server);
    }
);

ipc.server.start();


var proxy = httpProxy.createProxyServer({});
var server = http.createServer(function(req, res) {
    let path = url.parse(req.url).pathname.split("/");
    let deviceid = null;
    let server = null;
    path.forEach(function (element) {
        if (element.length === 24) {
            deviceid = element;
        }
    });
    console.log("DEVICEID: "+ deviceid);
    if (deviceid !== null) {
        let record = modules.findOne({deviceid: deviceid});
        console.log("RECORD: " + record);
        if (record) {
            if (record.server !== 0) {
                server = record.server;
            }
        }
    }
    if (server) {
        proxy.web(req, res, { target: 'http://'+server+':8080' });
    }
    else {
        proxy.web(req, res, { target: 'http://localhost:8888' });

    }
});
server.listen(8000, settings.ipaddress);

http.createServer(function(req, res) {
    res.writeHead(502);
    res.end("Device not found");
}).listen(8888, '127.0.0.1');