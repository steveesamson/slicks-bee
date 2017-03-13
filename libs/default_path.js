/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/8/14.
 */
module.exports = function(viewPath)
{
    var dateFormat = require('dateformat')();
    // For convenience...
    Date.prototype.format = function (mask, utc) {
        return dateFormat(this, mask, utc);
    };
    return function(req, res)
    {
        res.render(viewPath, {year:(new Date()).format('yyyy')});
    }
};
