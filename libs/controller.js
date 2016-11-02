/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */
//var module.filename.slice(__filename.lastIndexOf('/')+1, module.filename.length -3);

module.exports = {

    index: function (req, res) {
        res.sendStatus(200);
    },
    xexcel: function (req, res) {

        var file_name = "Great_Leaders_Network_" + req.parameters['filename'];
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-Disposition", "attachment; filename=" + file_name + ".xls");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.end(req.parameters['load'],'binary');
    },
    streampix: function (req, res) {

        SlicksDecoder.writeStreamTo(req, {save_as: PUBLIC_DIR + '/uploads/' + req.parameters.save_as + '.jpg'}, function (done) {
            res.json(done);
        });
    },
    croppix: function (req, res) {

        var params = req.parameters,
            gm = require('gm'),
            path = PUBLIC_DIR + params.src;
//        console.log(path);
        gm(path).crop(params.w, params.h, params.x, params.y).write(path, function (e) {
            if (e) {
                res.json({text: 'Error while cropping -\'' + params.src + '\' ' + e.message, error: true});

            } else {
                res.json({text: 'Picture cropped successfully.', src: params.src});
            }
        });
    },
    uploadpix: function (req, res) {

        SlicksDecoder.writeFileTo(req, {
            save_as: PUBLIC_DIR + '/uploads/' + req.parameters.save_as,
            load_name: 'load'
        }, function (done) {
            var coords = {w: parseInt(req.parameters.w), h: parseInt(req.parameters.h)},
                gm = require('gm'),
                path = PUBLIC_DIR + done.src;
            if (done.error) {
                res.json(done);
                return;
            }
            gm(path).size(function (e, size) {

                if (e) {
                    res.json({text: 'Error while getting image size -\'' + done.src + '\' ' + e.message, error: true});
                    return;
                }
                var sw = parseInt(size.width),
                    sh = parseInt(size.height),
                    resizeImage = function(w,h){
                    gm(path).resize(w, h).write(path, function (e) {
                        if (e) {
                            res.json({text: 'Error while resize -\'' + done.src + '\' ' + e.message, error: true});
                        } else {
                            res.json(done);
                        }
                    });
                };

                if(sw < coords.w  || sh < coords.h )
                {
                    var fs = require('fs');
                    fs.unlink(path, function(e){});
                    res.json({text: "Sorry, picture -'" + done.src + "' must be at least " + coords.w + "x" + coords.h +" in dimension.", error: true});
                }else if(sw > coords.w){
                    resizeImage(coords.w, coords.h);
                }


            });

        });
    }
};

