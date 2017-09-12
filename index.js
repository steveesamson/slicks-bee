/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */
module.exports = function (base) {


    var stud = require('stud'),
        fs = require('fs'),
        path = require('path'),
        net = require('net'),
        io = require('socket.io'),
        sio_redis = require('socket.io-redis'),
        farmhash = require('farmhash'),

        databases = {},
        os = require('os'),
        count = os.cpus().length,
        cluster = require('cluster'),
        resource = require('./libs/resource')(base),
        config = require('./libs/configurer')(resource),
        dbUtils = require('./libs/dbUtils')(databases, resource),
        dbKeys = utils.keys(resource.config.databases),
        cfg = dbUtils.nextItem(dbKeys),
        port = parseInt(resource.config.application.port),
        start = function () {


            config.configureModel(databases);
            config.configureController();
            config.configureRoute();
            config.configurePolicy();


            if (cluster.isMaster) {


                var assetVersion = (new Date()).getTime();
                // This stores our workers. We need to keep them to be able to reference
                // them based on source IP address. It's also useful for auto-restart,
                // for example.
                var workers = [];

                // Helper function for spawning worker at index 'i'.
                var spawn = function(i) {
                    workers[i] = cluster.fork();

                    // Optional: Restart worker on exit
                    workers[i].on('exit', function(code, signal) {
                        console.log('Re-spawning worker', i);
                        spawn(i);
                    });
                };


                // Helper function for getting a worker index based on IP address.
                // This is a hot path so it should be really fast. The way it works
                // is by converting the IP address to a number by removing non numeric
                // characters, then compressing it to the number of slots we have.
                //
                // Compared against "real" hashing (from the sticky-session code) and
                // "real" IP number conversion, this function is on par in terms of
                // worker index distribution only much faster.
                var worker_index = function(ip, len) {

                    return farmhash.fingerprint32(ip) % len; // Farmhash is the fastest and works with IPv6, too
                };

                stud.__express(path.join(VIEW_DIR, 'index.stud'),{year: DateTime('yyyy'), script:'/js/a_.js?v=' + assetVersion, style:'/css/a_.css?v=' + assetVersion},function(e, renderedString){

                    var f = path.join(PUBLIC_DIR, 'index.html');

                    fs.writeFile(f, renderedString, function (err) {
                        if (err) {

                            return console.log(err);
                        }
                        console.log('File ' + f + ' written.');

                        // Spawn workers.
                        for (var i = 0; i < count; i++) {
                            spawn(i);
                        }


                        // Create the outside facing server listening on our port.
                        var server = net.createServer({ pauseOnConnect: true }, function(connection) {
                            // We received a connection and need to pass it to the appropriate
                            // worker. Get the worker for this connection's source IP and pass
                            // it the connection.
                            var worker = workers[worker_index(connection.remoteAddress, count)];

                            worker.send('sticky-session:connection', connection);


                        }).listen(port);


                    });

                });


            } else {
                // Note we don't use a port here because the master listens on it for us.
                var app = require('./libs/glide')(resource);

                //var server = app.server.listen(0,'localhost');
                // Here you might use middleware, attach routes, etc.

                // Don't expose our internal server to the outside.


                // Tell Socket.IO to use the redis adapter. By default, the redis
                // server is assumed to be on localhost:6379. You don't have to
                // specify them explicitly unless you want to change them.
                //app.io.adapter(sio_redis({ host: 'localhost', port: 6379 }));

                // Here you might use Socket.IO middleware for authorization etc.

                // Listen to messages sent from the master. Ignore everything else.
                process.on('message', function(message, connection) {
                    if (message !== 'sticky-session:connection') {
                        return;
                    }

                    // Emulate a connection event on the server by emitting the
                    // event with the connection the master sent us.
                    app.server.emit('connection', connection);

                    connection.resume();
                });
            }



        };


    //console.log(resource.routes);

    if (cfg.item) {
        dbUtils.load(cfg, dbUtils.handler, start);
    } else {
        start();
    }

};


