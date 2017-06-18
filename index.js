/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */
module.exports = function (base) {


    var cluster = require('cluster'),
        stud = require('stud'),
        fs = require('fs'),
        path = require('path'),
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
            

            if (cluster.isMaster) {

                    var assetVersion = (new Date()).getTime();
                    stud.__express(path.join(VIEW_DIR, 'index.stud'),{year: DateTime('yyyy'), script:'/js/a_.js?v=' + assetVersion, style:'/css/a_.css?v=' + assetVersion},function(e, renderedString){

                        var f = path.join(PUBLIC_DIR, 'index.html');

                        fs.writeFile(f, renderedString, function (err) {
                            if (err) {

                                return console.log(err);
                            }
                            console.log('File ' + f + ' written.');

                            for (var i = 0; i < count; i++) {
                                spawn();
                            }
                            console.log("SlicksBee binds on port %s @ %s",  glider.get('port'), DateTime() );
                            cluster.on('death', function(worker) {
                                console.log('worker ' + worker.pid + ' died. spawning a new process...');
                                delete workers[worker.pid];
                                spawn();
                            });

                        });

                    });



            } else {
                var worker_id = 'Worker' + cluster.worker.id;

                (glider && glider.listen(glider.get('port'), function () {
                    console.log("SlicksBee %s started",  worker_id);
                }));
            }
        };






    //console.log(resource.routes);




    if (cfg.item) {
        dbUtils.load(cfg, dbUtils.handler, start);
    } else {
        start();
    }

};


