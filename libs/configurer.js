/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/19/14.
 */
var baseModel = require('./model'),
    baseController = require('./controller'),
    restController = require('./rest'),
    default_path = require('./default_path');
    //indexController = require('./IndexController');

module.exports = function (resource) {

    return {
        configureModel: function (databases) {
            var models = resource.models;
            for (var m in models) {
                var dbcopy = utils.clone(databases),
                    bkeys = baseModel(m)['uniqueKeys'],
                    ckeys = models[m]['uniqueKeys'] || [];

                var model = utils.extend(dbcopy, baseModel(m), models[m]);
                model['uniqueKeys'] = utils.union(bkeys, ckeys);
                global[m] = model;
            }

            resource.models = models;
        },
        configureController: function () {
            var controllers = resource.controllers;

            for (var c in controllers) {


                var controllerCopy = utils.clone(baseController),
                    model = resource.models[c];

                if (resource.config.controllers.rest && model) {

                    utils.extend(controllerCopy, restController(c));
                }
                utils.extend(controllerCopy, controllers[c]);
                controllers[c] = controllerCopy;
            }

            resource.controllers = controllers;

        },
        configureRoute: function () {
            var controllers = resource.controllers,
                routes = {},
                routes_config = resource.config.routes,
                models = resource.models;

            for (var key in controllers) {
                var restRoutes = {},
                    actionRoutes = {},
                    route = {},
                    funcs = null;

                if (resource.config.controllers.action) {
                    var controla = controllers[key];
                    funcs = utils.functions(controla);

                    if (resource.config.controllers.rest) {
                        ['create', 'update', 'destroy', 'find', 'counts', 'capturepix', 'uploadpix', 'xexcel'].forEach(function (restac) {
                            funcs = utils.without(funcs, restac);
                        })
                    }
                    for (var i = 0; i < funcs.length; ++i) {

                        actionRoutes['get /' + key.toLowerCase() + (funcs[i] === 'index' ? '/' : '/' + funcs[i])] = funcs[i];
                    }
                }

                if (resource.config.controllers.rest && models[key]) {
                    restRoutes['get /' + key.toLowerCase() + '(/\\d+)?'] = 'find';
                    restRoutes['get /' + key.toLowerCase() + '/counts'] = 'counts';
                    restRoutes['post /' + key.toLowerCase()] = 'create';
                    restRoutes['put /' + key.toLowerCase() + '/:id'] = 'update';
                    restRoutes['delete /' + key.toLowerCase() + '/:id'] = 'destroy';
                    restRoutes['get /' + key.toLowerCase() + '/croppix'] = 'croppix';
                    restRoutes['post /' + key.toLowerCase() + '/streampix'] = 'streampix';
                    restRoutes['post /' + key.toLowerCase() + '/uploadpix'] = 'uploadpix';
                    restRoutes['post /' + key.toLowerCase() + '/xexcel'] = 'xexcel';
                    restRoutes['post /' + key.toLowerCase() + '/unlink'] = 'unlink';
                    restRoutes['post /' + key.toLowerCase() + '/spinx'] = 'spinx';
                }
                utils.extend(route, restRoutes, actionRoutes);

                routes[key] = route;
            }

            if (resource.config.controllers.action) {
                for (var key in routes_config) {
                    var action = routes_config[key],
                        parts = null;

                    if (utils.isString(action)) {
                        parts = (action.indexOf('.') != -1) ? action.split('.') : [action.replace('Controller', ''), 'index'];
                        if (parts.length < 2) {
                            console.log('Warning: Route for ' + action + ' is not valid. Routes must contain the controller and the method, e.g. user.login for controller \'UserController\' and mehod \'login\'!');
                            continue;
                        }
                        var controller_name = parts[0].trim().replace('Controller', ''),
                            method_name = parts[1].trim(),
                            controller = controllers[controller_name];

                        if (!controller) {

                            console.log('Warning: Controller  \'' + controller_name + '\' is undefined!');
                            continue;

                        } else {

                            if (!utils.has(controller, method_name)) {
                                console.log('Warning: Controller \'' + controller_name + '\' does not contain action \'' + method_name + '\'!');
                                continue;
                            }
                        }
//                        console.log(routes[controller_name]);
                        var target = routes[controller_name];
                        if (target) {
                            target[key] = method_name;
                        }

                    }
                }
            }
            //add default route and the handler
            //if (!controllers['Index']) {
            //    controllers['Index'] = indexController(resource.config.views.index_file);
            //    routes['Index'] = { 'get /': 'index'};
            //
            //}
            resource['routes'] = routes;

        },
        configurePolicy: function () {
            var policiesMap = {},
                policies_config = resource.config.policies,
                controllers = resource.controllers,
                routes = resource.routes;


            for (var k in policies_config) {
                var policy = policies_config[k];
                if (k === '*') {
                    if (typeof policy === "string") {
                        policiesMap['global'] = resource.loadPolicies(policy.split(','));;

                    } else if (typeof policy === "boolean" && !policy) {

                        policiesMap['global'] = resource.loadPolicies(['denyAll']);

                    } else if (policy instanceof Array) {

                        policiesMap['global'] = resource.loadPolicies(policy);
                    }
                } else {

                    if (policy instanceof Array) {
                        policiesMap[k] = {'global': resource.loadPolicies(policy)};
                    } else if (typeof policy === "string") {
                        policiesMap[k] = {'global': resource.loadPolicies(policy.split(','))};
                    } else if (typeof policy === "object") {
                        var childPoly = {};
                        for (var o in policy) {
                            var poly = policy[o];
                            if (o === '*') {
                                if (typeof poly === "string") {
                                    childPoly['global'] = resource.loadPolicies(poly.split(','));
                                } else if (typeof poly === "boolean") {
                                    if(!poly){
                                        childPoly['global'] = resource.loadPolicies(['denyAll']);
                                    }else{
                                        childPoly['global'] = resource.loadPolicies(['allowAll']);
                                    }

                                } else if (poly instanceof Array) {
                                    childPoly['global'] = resource.loadPolicies(poly);
                                }

                            } else {
                                if (typeof poly === "string") {
                                    childPoly[o] = resource.loadPolicies(poly.split(','));
                                } else if (poly instanceof Array) {
                                    childPoly[o] = resource.loadPolicies(poly);
                                }

                            }
                        }
                        policiesMap[k] = childPoly;

                    }
                }

            }
            resource['policies'] = policiesMap;

        }
    };
};
