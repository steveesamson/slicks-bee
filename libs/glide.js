/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/6/14.
 */
var express = require('express'),
    favicon = require('serve-favicon'),
    errorHandler = require('errorhandler'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    stud = require('stud');

module.exports = function (resource) {
    var app = express();


    app.set('port', resource.config.application.port);

    //app.set('views', VIEW_DIR);
    //app.engine('stud', stud.__express);
    //app.set('view engine', resource.config.views.engine);

    //app.use(morgan('dev'));                     // log every request to the console
    //app.use(favicon(PUBLIC_DIR + '/favicon.ico'));
    app.use(resource.slicksMultiparts());
    app.use(methodOverride());                  // simulate DELETE and PUT
    app.use(resource.slickRouter);
    app.use(errorHandler());
    app.use(express.static(PUBLIC_DIR));     // set the static files location /public/img will be /img for users

    require('./strap')(app, resource);

    return app;
};
