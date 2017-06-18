/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */
var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    denyAll = require('./denyAll'),
    allowAll = require('./allowAll'),
    jwt = require('jsonwebtoken'),
    saltRounds = 10,
    bcrypt = require('bcryptjs'),
    policies_path = null;

module.exports = function (base) {


    global['DateTime'] = function (_format) {
        var dateFormat = require('./dateformat')();
        // For convenience...
        Date.prototype.format = function (mask, utc) {
            return dateFormat(this, mask, utc);
        };
        var date = new Date();
        return date.format(_format);
    };
    global['makeName'] = function (str) {
        var index = str.indexOf('_');
        if (index < 0) {
            return str == 'id' ? str.toUpperCase() : (str.charAt(0)).toUpperCase() + str.substring(1);
        }
        var names = str.split('_');
        var new_name = '';
        names.forEach(function (s) {
            new_name += new_name.length > 0 ? " " + $.makeName(s) : $.makeName(s);
        });

        return new_name;

    };
    global['security'] = require(path.join(base, 'config', 'security'));

    var controllers = {},
        models = {},
        middlewares = [],
        controllers_path = path.join(base, 'controllers'),
        middlewares_path = path.join(base, 'middlewares'),
        models_path = path.join(base, 'models'),
        controllers_config = require(path.join(base, 'config', 'controllers')),
        views_config = require(path.join(base, 'config', 'views')),
        app_config = require(path.join(base, 'config', 'application')),
        routes_config = require(path.join(base, 'config', 'routes')),
        policies_config = require(path.join(base, 'config', 'policies')),
        database_config = require(path.join(base, 'config', 'databases'));


    policies_path = path.join(base, 'policies');


    fs.readdirSync(models_path).forEach(function (model_name) {
        var base_name = path.basename(model_name, '.js');
        models[base_name] = require(path.join(models_path, model_name));

    });

    fs.readdirSync(controllers_path).forEach(function (name) {
        var base_name = path.basename(name, '.js'),
            base_name = base_name.replace('Controller', '');
        controllers[base_name] = require(path.join(controllers_path, name));
    });

    fs.readdirSync(middlewares_path).forEach(function (name) {
        middlewares.push(require(path.join(middlewares_path, name)));
    });

    global['utils'] = _;
    global.PUBLIC_DIR = base + views_config.static_dir;
    global.VIEW_DIR = base + views_config.view_dir;
    var normalizePolicies = function () {
        var normalized = {};
        for (var k in policies_config) {
            normalized[k.replace('Controller', '')] = policies_config[k];
        }
        return normalized;
    };

    global.BASE_DIR = base;
    global.Token = {
        sign: function (load) {
            return jwt.sign(load, security.secret);
        },
        verify: function (token, cb) {
            jwt.verify(token, security.secret,cb);
        }
    };

    global.Encrypt = {
        verify: function (plain, hash, cb) {
            bcrypt.compare(plain, hash, cb);
        },
        hash: function (plain, cb) {

            bcrypt.genSalt(saltRounds, function(err, salt) {

                if (err) {

                    return cb(err);
                }

                bcrypt.hash(plain, salt, cb);

            });

        }
    };

    return {
        models: models,
        controllers: controllers,
        denyAll: denyAll,
        middlewares: middlewares,
        config: {
            controllers: controllers_config,
            views: views_config,
            application: app_config,
            routes: routes_config,
            policies: normalizePolicies(),
            databases: database_config
        },
        normalizePath: normalizePath,
        fnIsEqual: fnIsEqual,
        loadPolicies: loadPolicies,
        slickRouter: require('./restRouter'),
        slicksMultiparts: require('./slicks-multiparts'),
        decorateReq: decorateReq

    };


};


var loadPolicies = function (_policies) {


        var policies = [];

        _policies.forEach(function (poly) {
            poly = poly.trim();
            if (poly === 'denyAll') {
                policies.push(denyAll);
                return;
            }
            if (poly === 'allowAll') {
                policies.push(allowAll);
                return;
            }
            var fullpath = path.join(policies_path, poly),
                exists = fs.existsSync(fullpath + '.js');
            if (exists) {

                var policy = require(fullpath);

                policies.push(policy);

            } else {
                console.warn('Policy definition for: ' + poly + ' is undefined');
            }
        });
        return policies;

    },
    fnIsEqual = function (fn1, fn2) {

        return '' + fn1 == '' + fn2;
    },
    normalizePath = function (path) {
        var pathMap = {},
            regex_result = path.match(/(get|post|put|delete|subscribe|unsubscribe)?(\s+)?(\/)(\w+.*)?/i);
        pathMap.method = _.isUndefined(regex_result[1]) ? 'get' : regex_result[1].trim().toLowerCase();
        pathMap.path = regex_result[3] + ((_.isUndefined(regex_result[4])) ? '' : regex_result[4]);
        return pathMap;
    },

    decorateReq = function (req, mtd) {
        //For IO Requests.


        var data = JSON.parse(req.data);
        req.url = data.url;
        req.path = data.url;
        req.method = mtd;
        if (mtd === 'post' || mtd === 'put') {
            req.body = data.data;
        } else {
            req.query = data.data;
        }

        var result = req.path.match(/\/\w+\/(\d+)/i);

        if (result) {
            if (!req.body) {
                req.body = {id: result[1]};
            } else {
                req.body['id'] = result[1];
            }

        }
        var tok = {};
        if (req.headers && req.headers['x-csrf-token']) {
            tok['x-csrf-token'] = req.headers['x-csrf-token'];
        }
        req.parameters = utils.extend({}, tok, req.query, req.body, req.params);
    };




