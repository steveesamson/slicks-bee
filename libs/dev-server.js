/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/6/14.
 */
let express = require('express'),
    compression = require('compression'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    helmet = require('helmet'),
    cookieParser = require('cookie-parser'),
    iocookieParser = require('socket.io-cookie');
methodOverride = require('method-override');

module.exports = function (base, sapper, cb) {
    
    
    let resource = require('./resource')(base),
        databases = {},
        cronMaster = require('./cron_master'),
        config = require('./configurer')(resource),
        dbUtils = require('./dbUtils')(databases, resource),
        dbKeys = utils.keys(resource.config.databases),
        cfg = dbUtils.nextItem(dbKeys);

    global['SlickSources'] = databases;
    config.configureModel(databases);
    config.configureController();
    config.configureRoute();
    config.configurePolicy();
    const app = express(),
          router = express.Router();

    // dbUtils.loadDbs(dbKeys, startServer);
    dbUtils.load(cfg, dbUtils.handler, startServer);


    function startServer(){
        let startWatches = function () {
            console.log('Starting Watches...');
            Object.keys(databases).forEach(k => {
                let db = databases[k];
                if (db.cdc) {
                    console.log('Starting Redo...');
                    let Redoer = require('./Redoer')(k);
                    Redoer.start();
                }

                if (db.maillog) {
                    console.log('Starting Mail...');
                    let smtpTransport = require("./smtpTransport")(resource.config.smtp);
                    let Mailer = require('./Mailer')(k, smtpTransport);
                    Mailer.start();
                }

            });
            cronMaster.init(resource.crons);
        };

        app.use(
            helmet(),
            cookieParser(),
            resource.slicksMultiparts(),
            methodOverride(),
            resource.slickRouter,
            errorHandler(),
            compression({ threshold: 0 }),
            express.static(sapper? path.basename(PUBLIC_DIR) : PUBLIC_DIR)
        ); // set the static files location /public/img will be /img for users

        var server = require('http').Server(app),
            io = require('socket.io')(server);
        io.use(iocookieParser);

        app.server = server;
        app.io = io;
        global.IO = io;

        sapper && app.use(
            sapper.middleware()
        );
        // require('./strap')(app, resource);
        require('./route')(app, resource, router);
        //This allow us customize the api path
        app.use(MOUNT_PATH,router);



        app.server.listen(APP_PORT, () => {
            startWatches();
            console.log(`Server started on localhost:${APP_PORT}...`);
            cb && cb();
        });

    };

    return app;
}
