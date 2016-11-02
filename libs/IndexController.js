/**
 * Created by steve Samson <stevee.samson@gmail.com> on 9/9/14.
 */

module.exports = function(viewPath){
    return {
        index: function (req, res) {
            res.render(viewPath, {year: DateTime('yyyy'), script:'/js/a_.js', style:'/css/a_.css'});
        }
    };
};
