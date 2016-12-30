    const serverid = 1;
    var ipc=require('node-ipc');
    
    ipc.config.id   = 'cloud-server-'+serverid;
    //ipc.config.retry= 1500;
 
    ipc.connectToNet(
        'routingdb',
        '127.0.0.1',
        2000,
        function(){
            ipc.of.routingdb.on(
                'connect',
                function(){
                    ipc.log('## connected to world ##'.rainbow, ipc.config.delay);
                    ipc.of.routingdb.emit(
                        'query',  //any event or message type your server listens for 
                        JSON.stringify({deviceid: '001029301923'})
                    );
                }
            );
            ipc.of.routingdb.on(
                'disconnect',
                function(){
                    ipc.log('disconnected from world'.notice);
                }
            );
            ipc.of.routingdb.on(
                'results',  //any event or message type your server listens for 
                function(data){
                    ipc.log('got a message from world : '.debug, data);
                }
            );
        }
    );