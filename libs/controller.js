/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */
//var module.filename.slice(__filename.lastIndexOf('/')+1, module.filename.length -3);
var svgCaptcha = require('svg-captcha'),
    shortid = require('shortid');
module.exports = {

    //index: function (req, res) {
    //    res.sendStatus(200);
    //},
    xexcel: function (req, res) {

        var file_name = "Slicks-Bee_" + req.parameters['filename'];
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-Disposition", "attachment; filename=" + file_name + ".xls");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.end(req.parameters['load'], 'binary');
    },
    streampix: function (req, res) {

        let  store_name = req.parameters.store_name,
        save_as = req.parameters.save_as || shortid.generate();
        SlicksDecoder.writeStreamTo(req, {save_as: `${PUBLIC_DIR}/uploads/${store_name}/${save_as}.jpg`}, function (done) {
            res.status(200).json(done);
        });
    },
    croppix: function (req, res) {

        var params = req.parameters,
            gm = require('gm'),
            path = PUBLIC_DIR + params.src;
//        console.log(path);
        gm(path).crop(params.w, params.h, params.x, params.y).write(path, function (e) {
            if (e) {
                res.status(200).json({error: "Error while cropping -'" + params.src + "' " + e.message});

            } else {
                res.status(200).json({text: 'Picture cropped successfully.', src: params.src});
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
        res.status(200).json(captcha);
    },
    unlink: function (req, res) {
        var attachments = req.parameters.attachments,
            store = req.parameters.store
            path = require('path'),
            fs = require('fs');
        if (attachments) {

            attachments = attachments.split(',');

            if (attachments.length > 1) {

                attachments.forEach(function (image) {

                    var _path = path.join(PUBLIC_DIR, 'uploads',store, image);
                    try {
                        fs.unlinkSync(_path);
                    } catch (e) {
                        console.log(e.toString());
                    }
                });

                res.status(200).json({text: 'Attachments successfully deletes'});

            } else {
                var _path = path.join(PUBLIC_DIR, 'uploads',store, attachments[0]);
                fs.unlink(_path, function (e) {
                    if (e) {
                        res.status(200).json({error: e.toString()});
                        return;
                    }
                    res.status(200).json({text: path.basename(_path) + ' successfully deleted!'});
                });
            }

        } else {
            res.status(200).json({error: 'There are no attachments'});
        }

    },
    resizeimage:function(req, res){

        if (!req.parameters.h || !req.parameters.w) {
            return res.status(200).json({error:'Provide height,h and width,w please.'});
        }

        if(!req.parameters.src){
            return res.status(200).json({error:'No image source provided, src'});
        }

        let src = req.parameters.src;
        
        var coords = {w: parseInt(req.parameters.w), h: parseInt(req.parameters.h)},
            gm = require('gm'),
            path = PUBLIC_DIR + src;

        gm(path).size(function (e, size) {

            if (e) {
                res.status(200).json({error: "Error while getting image size -'" + src + "' " + e.message});
                return;
            }
            var sw = parseInt(size.width),
                sh = parseInt(size.height),
                resizeImage = function (w, h) {

                    gm(path).resize(w, h).write(path, function (e) {
                        if (e) {
                            res.status(200).json({error: "Error while resizing -'" + src + "' " + e.message});
                        } else {
                            res.status(200).json({text: 'Picture uploaded successfully.', 'src': src});
                        }
                    });
                };

            if (sw < coords.w || sh < coords.h) {
                var fs = require('fs');
                fs.unlink(path, function (e) {
                });
                res.status(200).json({error: "Sorry, picture -'" + src + "' must be at least " + coords.w + "x" + coords.h + " in dimension."});
            } else {
                resizeImage(coords.w, coords.h);
            }
        });

    },
    uploadpix: function (req, res) {
        let  store_name = req.parameters.store_name,
        save_as = req.parameters.save_as || shortid.generate();
        SlicksDecoder.writeFileTo(req, {
            save_as: `${PUBLIC_DIR}/uploads/${store_name}/${save_as}`,
            load_name: 'load'
        }, function (done) {


            res.status(200).json(done);

        });
    }
};


