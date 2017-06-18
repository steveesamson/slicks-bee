/**
 * Created by steve Samson <stevee.samson@gmail.com> on 9/9/14.
 */

if(!global.assetVar){
    global.assetVar =  (new Date()).getTime();
}
module.exports = function(viewPath){

    return {
        index: function (req, res) {
            res.render(viewPath, {year: DateTime('yyyy'), script:'/js/a_.js?v=' + global.assetVar, style:'/css/a_.css?v=' + global.assetVar});
        }
    };
};
