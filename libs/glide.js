/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/6/14.
 */
const express = require("express"),
  errorHandler = require("errorhandler"),
  path = require("path"),
  helmet = require("helmet"),
  compression = require("compression"),
  cookieParser = require("cookie-parser"),
  iocookieParser = require("socket.io-cookie");
methodOverride = require("method-override");
//stud = require('stud');

module.exports = function(resource, sapper) {
  const app = express(),
    router = express.Router();

  // app.set('port', resource.config.application.port);

  app.use(
    helmet(),
    cookieParser(),
    resource.slicksMultiparts(),
    methodOverride(),
    resource.slickRouter,
    errorHandler(),
    compression({ threshold: 0 }),
    express.static(sapper ? path.basename(PUBLIC_DIR) : PUBLIC_DIR)
  );

  var server = require("http").Server(app),
    io = require("socket.io")(server);
  io.use(iocookieParser);

  app.server = server;
  app.io = io;
  global.IO = io;

  // require('./strap')(app, resource);

  require("./route")(app, resource, router);

  app.use(MOUNT_PATH, router);

  sapper && app.use(sapper.middleware());

  app.server.listen(0, "localhost");

  return app;
};
