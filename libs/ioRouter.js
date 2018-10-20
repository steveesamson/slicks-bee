let slicksTenancy = require('./slicks-tenancy');
module.exports = function (req, mtd) {
    //For IO Requests.


    //var data = JSON.parse(req.data);
    //req.url = data.url;
    req.method = mtd;

   if (mtd === 'post' || mtd === 'put') {
        req.body = req.data;
    } else {
        req.query = req.data;
    }

    var result = req.path.match(/(\/\w+)\/(\d+)/i);



    if (result) {
        if (!req.body) {
            req.body = {id: result[2]};
        } else {
            req.body['id'] = result[2];
        }
        req.path = req.method === 'get'? result[1] : result[1] + '/:id';

    }

    req.parameters = utils.extend({}, req.query, req.body, req.params);
    delete req.data;
    delete req.query;
    delete req.body;
    delete req.params;
    slicksTenancy(req, null);
    
};
