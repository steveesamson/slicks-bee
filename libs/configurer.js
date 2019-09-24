/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/19/14.
 */
var baseModel = require('./model'),
	baseController = require('./controller'),
	restController = require('./rest'),
	indexController = require('./IndexController');

module.exports = function (resource) {
	global.Models = {};
	return {
		configureModel: function (databases) {
			var models = resource.models;
			for (var m in models) {
				var dbcopy = utils.clone(databases),
					bkeys = baseModel(m)['uniqueKeys'],
					ckeys = models[m]['uniqueKeys'] || [];

				// var model = utils.extend(dbcopy, baseModel(m), models[m]);
				var model = utils.extend(baseModel(m), models[m]);
				model['uniqueKeys'] = utils.union(bkeys, ckeys);
				// global[m] = model;
				global.Models[m] = (function (mdl) {

					return function (req) {

						let copy = utils.clone(mdl);

						if (copy.store) {
							let db = SlickSources[copy.store];
							if (!db) {
								throw new Error(`Store '${copy.store}' for ${copy.instanceName} could not be found, check all your database connections...`);
							}
							copy['db'] = db;
						} else {
							if (!req || !req.db) {
								throw new Error('Null db object, check all your database connections...');
							}
							copy['db'] = req.db;
						}
						return copy;
					}


				})(model);

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
						[
							'create',
							'update',
							'destroy',
							'find',
							// 'counts',
							'streampix',
							'uploadpix',
							'xexcel',
							'unlink',
							'spinx',
							'croppix',
							'resizeimage',
						].forEach(function (restac) {
							funcs = utils.without(funcs, restac);
						});
					}

					for (var i = 0; i < funcs.length; ++i) {

						for (var rkey in routes_config) {

							let handler = routes_config[rkey];
							let controller_method = handler.split('.');
							if (controller_method.length < 2) {
								throw Error('Incorrect route configuration for: ', rkey)
							}
							if (controller_method[0].trim() === key) {
								actionRoutes[rkey] = controller_method[1].trim();
							}
						}
					}
				}

				if (resource.config.controllers.rest && models[key]) {
					//restRoutes['get /' + key.toLowerCase() + '(/\\d+)?'] = 'find';
					restRoutes['get /' + key.toLowerCase()] = 'croppix';
					restRoutes['get /' + key.toLowerCase() + '/:id'] = 'find';
					restRoutes['get /' + key.toLowerCase()] = 'find';
					// restRoutes['get /' + key.toLowerCase() + '/counts'] = 'counts';
					restRoutes['post /' + key.toLowerCase()] = 'create';
					restRoutes['put /' + key.toLowerCase() + '/:id'] = 'update';
					restRoutes['delete /' + key.toLowerCase() + '/:id'] = 'destroy';
					restRoutes['post /' + key.toLowerCase() + '/resizeimage'] = 'resizeimage';
					restRoutes['post /' + key.toLowerCase() + '/streampix'] = 'streampix';
					restRoutes['post /' + key.toLowerCase() + '/uploadpix'] = 'uploadpix';
					restRoutes['post /' + key.toLowerCase() + '/xexcel'] = 'xexcel';
					restRoutes['post /' + key.toLowerCase() + '/unlink'] = 'unlink';
					restRoutes['post /' + key.toLowerCase() + '/spinx'] = 'spinx';
				}

				utils.extend(route, restRoutes, actionRoutes);

				routes[key] = route;
			}

			//add default route and the handler
			// if (!controllers['Index']) {
			// 	controllers['Index'] = indexController(resource.config.views.index_file);
			// 	routes['Index'] = {
			// 		'get /': 'index'
			// 	};
			// }
			resource['routes'] = routes;
		},
		configurePolicy: function () {
			var policiesMap = {},
				policies_config = resource.config.policies;

			for (var k in policies_config) {
				var policy = policies_config[k];
				if (k === '*') {
					if (typeof policy === 'string') {
						policiesMap['global'] = resource.loadPolicies(policy.split(','));
					} else if (typeof policy === 'boolean' && !policy) {
						policiesMap['global'] = resource.loadPolicies(['denyAll']);
					}
				} else {
					if (typeof policy === 'string') {
						policiesMap[k] = {
							global: resource.loadPolicies(policy.split(','))
						};
					} else if (typeof policy === 'object') {
						var childPoly = {};
						for (var o in policy) {
							var poly = policy[o];
							if (o === '*') {
								if (typeof poly === 'string') {
									childPoly['global'] = resource.loadPolicies(poly.split(','));
								} else if (typeof poly === 'boolean') {
									childPoly['global'] = !poly ?
										resource.loadPolicies(['denyAll']) :
										resource.loadPolicies(['denyAll']);
								}
							} else {
								if (typeof poly === 'string') {
									childPoly[o] = resource.loadPolicies(poly.split(','));
								}
							}
						}
						policiesMap[k] = childPoly;
					}
				}
			}
			resource['policies'] = policiesMap;
		},
	};
};