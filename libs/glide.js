/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/6/14.
 */
var express = require('express'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override');
//stud = require('stud');

module.exports = function (resource) {
    var app = express();


    app.set('port', resource.config.application.port);

    app.use(resource.slicksMultiparts());
    app.use(methodOverride());                  // simulate DELETE and PUT
    app.use(resource.slickRouter);
    app.use(errorHandler());
    app.use(express.static(PUBLIC_DIR));     // set the static files location /public/img will be /img for users

    var server = require('http').Server(app),
        io = require('socket.io')(server);


    app.server = server;
    app.io = io;
    global.IO = io;


    require('./strap')(app, resource);

    app.server.listen(0, 'localhost');

    return app;

};
