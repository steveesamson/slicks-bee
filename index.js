/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */
module.exports = function (base, devel) {

    if (devel) {
        return require('./libs/dev-server')(base, devel);
    } else {
        require('./libs/server')(base);
    }
};