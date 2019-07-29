/**
 * Created by steve samson <stevee.samson@gmail.com> on 2/4/14.
 */

const environ = require('./libs/environ');
module.exports = function (base, devel) {

    environ(base, function beforeAll(){

        if (devel) {
            return require('./libs/dev-server')(base, devel);
        } else {
            require('./libs/server')(base);
        }
    });
   
};