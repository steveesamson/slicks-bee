/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/7/14.
 */
var fs = require('fs');
module.exports = function (head, resource) {

    //var router = express.Router();
    /*
     Bind middlewares;
     */
    if (resource.middlewares) {

        head.all('*', resource.middlewares);
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
                policy = myPolicy ? (myPolicy[handler_name] ? myPolicy[handler_name] : (myGlobalPolicy ? myGlobalPolicy : (globalPolicy || []) )) : (globalPolicy ? globalPolicy : []);

            head[normalized.method](normalized.path, policy, controller[handler_name]);


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
                policy = myPolicy ? (myPolicy[handler_name] ? myPolicy[handler_name] : (myGlobalPolicy ? myGlobalPolicy : (globalPolicy || []) )) : (globalPolicy ? globalPolicy : []);
//            console.log('Handler: ' + handler_name + ' path: ' + normalized.path + ' method: ' + normalized.method);
            head[normalized.method](normalized.path, policy, controller[handler_name]);
            console.log(normalized);
        }

    }
//    global['slickIO'] = head.io;

    global['SlicksDecoder'] = {
        writeStreamTo: function (req, options, cb) {

            var dest = options.save_as,
                ws = fs.createWriteStream(dest);
            req.on('data',function (chunk) {
                ws.write(chunk);
            }).on('end', function () {
                    ws.destroySoon();
                    ws.on('close', function () {
                        dest = dest.replace(PUBLIC_DIR, '');
                        cb && cb({text: 'Web capture was successful.', src: dest});
                    });
                });
        },
        writeFileTo: function (req, options, cb) {
            //console.log(req.files);
            var file = req.files[options.load_name],
                dest = options.save_as  + '.jpg' || file.name;
                file.renameTo(dest, function(e){
                    if (e) {

                        cb && cb({text: 'Error while uploading -\'' + file.name + '\' ' + e.message, error: true});

                    } else {
                        dest = dest.replace(PUBLIC_DIR, '');
                        cb && cb({text: 'Picture uploaded successfully.', src: dest});
                    }
                });


        }
    };


//    var bindSocketRoutes = function (method) {
//        head.io.route(method, function (req) {
//
////            var data = JSON.parse(req.data);
//
////            console.log("url: %s, mtd: %s, data:%s",data.url, method, data.data);
//
//            var g = req.io,
//                res = {json: g.respond, send: g.respond};
//            resource.decorateReq(req, method);
//            head.router(req, res);
//
//
//        });
//    };
//
//    ['get', 'post', 'delete', 'put', 'subscribe', 'unsubscribe'].forEach(function (method) {
//        bindSocketRoutes(method);
//    });

};





