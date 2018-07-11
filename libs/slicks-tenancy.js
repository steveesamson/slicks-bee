module.exports = function (req, res, next) {


    // console.log('Tenancy: ', isMultitenant);
    if (isMultitenant) {

        if (req.parameters['x-csrf-token']) {
            Token.verify(req.parameters['x-csrf-token'], function (err, decoded) {

                if (!err && typeof decoded !== 'undefined') {
                    req.db = SlickSources[decoded.tenant];
                }
                next();

            });

        }else{
            req.db = SlickSources['default'];
            next();
        }
    }else{
        req.db = SlickSources['default'];
        next();
    }
}