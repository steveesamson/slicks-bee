var nodemailer = require('nodemailer'),
    fs = require('fs'),
    stud = require('stud'),
    smtpPool = require('nodemailer-smtp-pool'),
    mailConfig = {
        service: 'gmail',
        auth: {
                user: 'kevwe.samson@gmail.com',
                pass: '@g0fur30'
            }
    },
    // mailConfig = {
    //     host: 'mail.helpals.net',
    //     port: 25,
    //     secure:false,
    //     auth: {
    //         user: 'noreply',
    //         pass: 'n0r3p0rt'
    //     },
    //     tls: {
    //       rejectUnauthorized: false
    //     },
    //     maxConnections: 5,
    //     maxMessages: 10
    // },
    
    mail = function (mailLoad, cb) {
        var transporter = nodemailer.createTransport(smtpPool(mailConfig)),
	    mailOptions = {
            from: mailLoad.from,// // sender address
            to: mailLoad.to,
            subject: mailLoad.subject, // Subject line
            text: mailLoad.message, // plaintext body
            html: mailLoad.html
        };

// send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {

            if (error) {
                console.error(error);
                cb && cb(error);

            } else {
                cb && cb(false, 'Message sent: ' + info.response);
            }
            transporter.close();

        });
    };
    

module.exports = function () {
    var tpl = fs.readFileSync(__dirname + "/mail.html", "utf8");
    return {
        sendMail: function (options, cb) {
            options.from = 'SupportsTeam <noreply@helpals.net>';

            stud.template(tpl, options, function (error, str) {

                options.html = str;
                // console.log('going out: ', options)
                mail(options, cb);
            });
        }
    };
};
