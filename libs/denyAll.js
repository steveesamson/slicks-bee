/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */
module.exports = function(req, res, next)
{
    console.log('Unauthorized Access to ' + req.url);
    res.status(401).json({error:'Unauthorized'});
};