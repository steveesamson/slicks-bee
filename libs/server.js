/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */
module.exports = function (base, sapper) {


    let net = require('net'),
        sio_redis = require('socket.io-redis'),
        farmhash = require('farmhash'),
        cluster = require('cluster'),
        cronMaster = require('./cron_master')
        os = require('os'),
        databases = {},
        resource = require('./resource')(base),
        config = require('./configurer')(resource),
        dbUtils = require('./dbUtils')(databases, resource),
        
        dbKeys = utils.keys(resource.config.databases),
        cfg = dbUtils.nextItem(dbKeys);

    global['SlickSources'] = databases;
    config.configureModel(databases);
    config.configureController();
    config.configureRoute();
    config.configurePolicy();
    // dbUtils.loadDbs(dbKeys, startServer);
    
    dbUtils.load(cfg, dbUtils.handler, kickOff);

    function kickOff() {

        if (cluster.isMaster) {

            let count = os.cpus().length,
                startedWorkers = 0,
                // port = parseInt(resource.config.application.port),
                startWatches = function () {

                    // if (resource.config.application.redo_logs) {
                        startedWorkers += 1;

                        Object.keys(databases).forEach(k => {
                            let db = databases[k];
                            if (db.cdc) {
                                let Redoer = require('./Redoer')(k);
                                Redoer.start();
                            }

                            if (db.maillog) {
                                let smtpTransport = require("./smtpTransport")(resource.config.smtp),
                                Mailer = require('./Mailer')(k, smtpTransport);
                                Mailer.start();
                            }

                        });

                        cronMaster.init(resource.crons);



                  
                };

            // This stores our workers. We need to keep them to be able to reference
            // them based on source IP address. It's also useful for auto-restart,
            // for example.
            let workers = [],

                // Helper function for spawning worker at index 'i'.
                spawn = function (i) {
                    workers[i] = cluster.fork();

                    console.log('Creating Worker: ', workers[i].process.pid);
                    workers[i].on('message', m => {
                        switch (m.type) {
                            case 'STARTED':
                                !startedWorkers && startWatches();
                                break;
                        }
                    });
                    // Optional: Restart worker on exit
                    workers[i].on('exit', function (code, signal) {
                        console.log('Respawning worker', i);
                        spawn(i);
                    });
                };

            // Spawn workers.
            for (var i = 0; i < count; i++) {
                spawn(i);
            }

            // Helper function for getting a worker index based on IP address.
            // This is a hot path so it should be really fast. The way it works
            // is by converting the IP address to a number by removing non numeric
            // characters, then compressing it to the number of slots we have.
            //
            // Compared against "real" hashing (from the sticky-session code) and
            // "real" IP number conversion, this function is on par in terms of
            // worker index distribution only much faster.
            var worker_index = function (ip, len) {

                return farmhash.fingerprint32('' + ip[i]) % len; // Farmhash is the fastest and works with IPv6, too
            };

            // Create the outside facing server listening on our port.
            let server = net.createServer({
                pauseOnConnect: true
            }, function (connection) {
                // We received a connection and need to pass it to the appropriate
                // worker. Get the worker for this connection's source IP and pass
                // it the connection.
                let worker = workers[worker_index(connection.remoteAddress, count)];

                worker.send('sticky-session:connection', connection);

            }).listen(APP_PORT, () => {
                console.log(`Server started on localhost:${APP_PORT}...`);
            });



        } else {
            // Note we don't use a port here because the master listens on it for us.
            var app = require('./glide')(resource, sapper);

            //var server = app.server.listen(0,'localhost');
            // Here you might use middleware, attach routes, etc.

            // Don't expose our internal server to the outside.


            // Tell Socket.IO to use the redis adapter. By default, the redis
            // server is assumed to be on localhost:6379. You don't have to
            // specify them explicitly unless you want to change them.
            //app.io.adapter(sio_redis({ host: 'localhost', port: 6379 }));

            // Here you might use Socket.IO middleware for authorization etc.

            // Listen to messages sent from the master. Ignore everything else.
            // process.on('message', function(message, connection) {
            process.on('message', function (message, connection) {

                if (typeof message === 'string') {

                    if (message === 'sticky-session:connection') {
                        // Emulate a connection event on the server by emitting the
                        // event with the connection the master sent us.
                        app.server.emit('connection', connection);
                        connection.resume();
                    }

                }


            });
        }

    }
};