/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/6/14.
 */
let express = require('express'),
    errorHandler = require('errorhandler'),
    helmet = require('helmet'),
    cookieParser = require('cookie-parser'),
    iocookieParser = require('socket.io-cookie');
methodOverride = require('method-override');




module.exports = function (base, cb) {
    
    
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
    let app = express();

    
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

        // app.set('port', resource.config.application.port);
        app.use(helmet());
        app.use(cookieParser());
        app.use(resource.slicksMultiparts());
        app.use(methodOverride()); // simulate DELETE and PUT
        app.use(resource.slickRouter);
        app.use(errorHandler());
        app.use(express.static(PUBLIC_DIR)); // set the static files location /public/img will be /img for users

        var server = require('http').Server(app),
            io = require('socket.io')(server);
        io.use(iocookieParser);

        app.server = server;
        app.io = io;
        global.IO = io;


        require('./strap')(app, resource);

        app.server.listen(APP_PORT, () => {
            startWatches();
            console.log(`Server started on localhost:${APP_PORT}...`);
            cb && cb();
        });

    };

    return app;
}
