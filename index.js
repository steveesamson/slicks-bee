/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */
module.exports = function () {


    var base = process.cwd(),
        cluster = require('cluster'),
        workers = {},
        count = require('os').cpus().length,
        spawn = function () {
            var worker = cluster.fork();
            workers[worker.pid] = worker;
            return worker;
        },
        databases = {},
        resource = require('./libs/resource')(base),
        config = require('./libs/configurer')(resource),
        dbUtils = require('./libs/dbUtils')(databases, resource),
        dbKeys = utils.keys(resource.config.databases),
        cfg = dbUtils.nextItem(dbKeys),
        start = function () {

            config.configureModel(databases);
            config.configureController();
            config.configureRoute();
            config.configurePolicy();
            var glider = require('./libs/glide')(resource);
            console.log('cpus: ' + count);
//            if (cluster.isMaster) {
//                for (var i = 0; i < count; i++) {
//                    spawn();
//                }
//                cluster.on('death', function(worker) {
//                    console.log('worker ' + worker.pid + ' died. spawning a new process...');
//                    delete workers[worker.pid];
//                    spawn();
//                });
//            } else {
//                var worker_id = 'Worker' + cluster.worker.id;

            (glider && glider.listen(glider.get('port'), function () {
//                    var now = new Date();
//                    console.log("Slicker glides on port %s started by %s @ %s",  glider.get('port'), worker_id, now.format('dddd, mmmm dS, yyyy. h:MM:ss TT') );
                console.log("Slicker glides on port %s started @ %s", glider.get('port'), DateTime());
            }));
//            }
        };


    //console.log(resource.routes);

    if (cfg.item) {
        dbUtils.load(cfg, dbUtils.handler, start);
    } else {
        start();
    }

};


