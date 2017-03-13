/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */
//var module.filename.slice(__filename.lastIndexOf('/')+1, module.filename.length -3);
var svgCaptcha = require('svg-captcha');
module.exports = {

    index: function (req, res) {
        res.sendStatus(200);
    },
    xexcel: function (req, res) {

        var file_name = "Konvaj_" + req.parameters['filename'];
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-Disposition", "attachment; filename=" + file_name + ".xls");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.end(req.parameters['load'], 'binary');
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
                res.json({error: 'Error while cropping -\'' + params.src + '\' ' + e.message});

            } else {
                res.json({text: 'Picture cropped successfully.', src: params.src});
            }
        });
    },
    spinx: function (req, res) {

        var capOpts = {
                ignoreChars: '0o1il',
                noise: 3
            },
            captcha = svgCaptcha.create(capOpts);
        captcha.data = encodeURIComponent(captcha.data);
        //console.log(captcha);
        res.json(captcha);
    },
    unlink: function (req, res) {
        var images = req.parameters.images,
            path = require('path'),
            fs = require('fs');
        if (images) {

            images = images.split(',');

            if (images.length > 1) {

                images.forEach(function (image) {

                    var _path = PUBLIC_DIR + image;
                    try {
                        fs.unlinkSync(_path);
                    } catch (e) {
                        console.log(e.toString());
                    }
                });

                res.json({text: 'Images successfully deletes'});

            } else {
                var _path = PUBLIC_DIR + images[0];
                fs.unlink(_path, function (e) {
                    if (e) {
                        res.json({error: e.toString()});
                        return;
                    }
                    res.json({text: path.basename(_path) + ' successfully deleted!'});
                });
            }

        } else {
            res.json({error: 'There are no images'});
        }

    },
    uploadpix: function (req, res) {

        SlicksDecoder.writeFileTo(req, {
            save_as: PUBLIC_DIR + '/uploads/' + req.parameters.save_as,
            load_name: 'load'
        }, function (done) {


            if (done.error || req.parameters.w === undefined || !req.parameters.w) {
                res.json(done);
                return;
            }


            var coords = {w: parseInt(req.parameters.w), h: parseInt(req.parameters.h)},
                gm = require('gm'),
                path = PUBLIC_DIR + done.src;

            //console.log('CORDS: ', coords);
            //if (done.error) {
            //    res.json(done);
            //    return;
            //}
            gm(path).size(function (e, size) {

                if (e) {
                    res.json({error: 'Error while getting image size -\'' + done.src + '\' ' + e.message});
                    return;
                }
                var sw = parseInt(size.width),
                    sh = parseInt(size.height),
                    resizeImage = function (w, h) {

                        gm(path).resize(w, h).write(path, function (e) {
                            if (e) {
                                res.json({error: 'Error while resize -\'' + done.src + '\' ' + e.message});
                            } else {
                                res.json(done);
                            }
                        });
                    };

                if (sw < coords.w || sh < coords.h) {
                    var fs = require('fs');
                    fs.unlink(path, function (e) {
                    });
                    res.json({error: "Sorry, picture -'" + done.src + "' must be at least " + coords.w + "x" + coords.h + " in dimension."});
                    //} else if (sw > coords.w) {
                } else {
                    resizeImage(coords.w, coords.h);
                }
            });

        });
    }
};


