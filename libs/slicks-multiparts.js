/***
 * Created by steve Samson <stevee.samson@gmail.com> on 2/16/14.
 */

var Busboy = require('busboy'),
    path = require('path'),
    os = require('os'),
    qs = require('querystring')
    fs = require('fs');

module.exports = function (options) {
    options = options || {};
    return function (req, res, next) {

        var files = {},
            body = {},
            decodeChunks = function (cb) {

                let chunk = '';
                req.on('data', function (chk) {
                    chunk += chk;
                }).on('end', function () {
                    if(isJson){
                        body = qs.decode(chunk);
                        req.body = utils.extend(req.body || {}, body);
                        return next();
                   }
                   
                   console.log('No content type was specified for this request, passing body down as raw.')
                   req.body = chunk;
                   next();
                });
            },
            contentType = req.headers['content-type'],
            isUpload = !!contentType &&  ((contentType.indexOf('multipart/form-data') !== -1) || (contentType.indexOf('application/x-www-form-urlencoded') !== -1)),
            isJson = !!contentType &&   (contentType.indexOf('application/json') !== -1);

        if (!isUpload) {
            
            if(req.method === 'GET'){

                return next();
            }
            
           return decodeChunks();
        }

        var busboy = new Busboy({
            headers: req.headers
        });
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

            var saveTo = options.uploadDir ? path.join(BASE_DIR, options.uploadDir, path.basename(filename)) : path.join(os.tmpDir(), path.basename(filename));
            file.pipe(fs.createWriteStream(saveTo));
            files[fieldname] = {
                name: filename,
                encoding: encoding,
                path: saveTo,
                ext: path.extname(path.basename(filename)),
                mime: mimetype,
                renameTo: function (dest, cb) {

                    var self = this;
                    fs.rename(this.path, dest, function (e) {
                        if (e) {
                            cb && cb(e);
                        } else {
                            cb && cb(null);
                        }
                    });
                }
            };
        });

        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
            body[fieldname] = val;
        });
        busboy.on('finish', function () {
            req.body = utils.extend(req.body || {}, body);
            req.files = files;

            next();
        });
        req.pipe(busboy);
    }
}