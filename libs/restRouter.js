/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/16/14.
 */


module.exports = function (req, res, next) {



    var result = req.path.match(/\/\w+\/(\d+)/i);

    if (result) {
        req.body = req.body || {};
        req.body['id'] = result[1];
    }
    var tok = {};
    if(req.headers && req.headers['x-csrf-token']){
        tok['x-csrf-token'] = req.headers['x-csrf-token'];
    }
    req.parameters = utils.extend({},tok, req.query, req.body);
    next();
};




