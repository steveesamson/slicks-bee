/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/7/14.
 */
var fs = require('fs'),
    copyArray = function (c) {

        return c.slice(0, c.length);
    },
    ext = function (fileName) {

        var result = fileName.split('.');

        return result.length === 1 ? "" : '.' + result.pop();
    };

module.exports = function (app, resource) {

    var ioRoutes = {
        get: {},
        post: {},
        'delete': {},
        put: {}
    };
    /*
     Bind middlewares;
     */
    if (resource.middlewares) {
        app.all('*', resource.middlewares);
        //for(var i=0;i<resource.middlewares.length; ++i){
        //    router.use(resource.middlewares[i]);
        //}
    }
    var globalPolicy = resource.policies.global;


    /*
     bind / route first
     */
    if (utils.has(resource.routes, 'Index')) {
        var route = resource.routes['Index'],
            controller = resource.controllers['Index'],
            myPolicy = resource.policies['Index'],
            myGlobalPolicy = myPolicy && myPolicy['global'];

        for (var path in route) {
            var handler_name = route[path],
                normalized = resource.normalizePath(path),
                policy = myPolicy ? (myPolicy[handler_name] ? myPolicy[handler_name] : (myGlobalPolicy ? myGlobalPolicy : (globalPolicy || []))) : (globalPolicy ? globalPolicy : []);

            app[normalized.method](normalized.path, policy, controller[handler_name]);


        }
    }


    /*
     Bind all others routes
     */
    for (var rkey in resource.routes) {
        if (rkey === 'Index') {
            continue;
        }

        var route = resource.routes[rkey],
            controller = resource.controllers[rkey],
            myPolicy = resource.policies[rkey],
            myGlobalPolicy = myPolicy && myPolicy['global'];

        for (var path in route) {
            var handler_name = route[path],
                normalized = resource.normalizePath(path),
                policy = myPolicy ? (myPolicy[handler_name] ? myPolicy[handler_name] : (myGlobalPolicy ? myGlobalPolicy : (globalPolicy || []))) : (globalPolicy ? globalPolicy : []);

            // policy.push(resource.slicksTenancy); //Added/Removed
            // console.log('Handler: ' + handler_name + ' path: ' + normalized.path + ' method: ' + normalized.method);
            if (controller[handler_name]) {
                app[normalized.method](normalized.path, policy, controller[handler_name]);
                //ioRoutes[normalized.method][normalized.path] = {policy:policy,handler:controller[handler_name]};

                ioRoutes[normalized.method][normalized.path] = (function (_policy, _handler) {

                    return function (req, res) {

                        var _policies = copyArray(_policy),
                            next = function () {
                                _policies.length && _policies.shift()(req, res, next);
                            };

                        _policies.push(_handler);

                        //console.log('Polices: ', _policies.toString());

                        next();

                    }

                })(policy, controller[handler_name]);
            }else{
                console.error('Handler: ' + handler_name + ' not found on for path: ' + normalized.path + ' on method: ' + normalized.method);
            }
        }

    }

    //console.log('ioRoutes: ', ioRoutes);


    global['SlicksDecoder'] = {
        writeStreamTo: function (req, options, cb) {

            var dest = options.save_as,
                ws = fs.createWriteStream(dest);
            req.on('data', function (chunk) {
                ws.write(chunk);
            }).on('end', function () {
                ws.destroySoon();
                ws.on('close', function () {
                    dest = dest.replace(PUBLIC_DIR, '');
                    cb && cb({
                        text: 'Web capture was successful.',
                        src: dest
                    });
                });
            });
        },
        writeFileTo: function (req, options, cb) {
            //console.log(req.files);
            var file = req.files[options.load_name],
                dest = options.save_as + ext(file.name);
            file.renameTo(dest, function (e) {
                if (e) {

                    cb && cb({
                        errpr: 'Error while uploading -\'' + file.name + '\' ' + e.message
                    });

                } else {
                    dest = dest.replace(PUBLIC_DIR, '');
                    cb && cb({
                        text: 'Picture uploaded successfully.',
                        src: dest
                    });
                }
            });


        }
    };

    global.IO = app.io;
    app.io.sockets.on('connection', function (socket) {

        console.log('Connected: ', socket.id);


        socket.once('disconnect', function () {
            console.log('disconnecting...');
            socket.disconnect();
        });

        ['get', 'post', 'delete', 'put'].forEach(function (method) {
            socket.on(method, function (req, cb) {


                var res = {
                    json: cb,
                    status: function (stat) {
                        res.status = stat;
                        return res;
                    }
                };


                resource.slicksIORouter(req, method);

                req.io = socket;
                req.url = req.path;


                // console.log("mtd: ",method);
                // console.log("Path: ",req.path);
                // console.log("Params: ", req.parameters);
                // console.log("IO x-token: ", req.parameters['x-csrf-token']);

                if(!req.path.trim()) return;
                ioRoutes[method][req.path](req, res);



            });
        });
    });


};