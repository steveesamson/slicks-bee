/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/10/14.
 */

module.exports = function (config, cb) {

    require('slicks-' + config.driver)(config).connect(function (err, db) {
        if(err)
        {
            (cb && cb(err));
        }
        (cb && cb(false, db));
    });

};
