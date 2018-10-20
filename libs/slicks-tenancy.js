module.exports = function (req, next) {


    // console.log('Tenancy: ', isMultitenant);
    if (isMultitenant) {

        if (req.parameters['tenant']) {
            let tenant = req.parameters['tenant'];
            // Token.verify(req.parameters['x-csrf-token'], function (err, decoded) {

                // if (!err && typeof decoded !== 'undefined') {
                    req.db = SlickSources[tenant];
                // }
                next && next();

            // });

        }else{
            req.db = SlickSources['default'];
            next && next();
        }
    }else{
        req.db = SlickSources['default'];
        next && next();
    }
}