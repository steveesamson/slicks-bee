/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/19/14.
 */
module.exports = function (databases, resource) {


    var du = {

        load: function (cfg, cb, oc) {

            if(!cfg.item) return oc();

            require('./slicksdb')(resource.config.databases[cfg.item], function (err, db) {

                if (err) {
                    console.error('Error while connecting to database: ' + cfg.item + ', details: ' + err.message);
                    cfg = du.nextItem(cfg.options);
                    (cb && cb((cfg.item ? cfg : false), oc));
                    return;
                }
                if(!db){
                    throw Error('Error unable to connect to database');
                    process.exit();
                    return;
                }

                console.log('Connected to ' + cfg.item + ' db.');

                // var key = (cfg.item === 'default') ? 'db' : cfg.item;
                // var key =  cfg.item;
                databases[cfg.item] = db;
                cfg = du.nextItem(cfg.options);
                (cb && cb((cfg.item ? cfg : false), oc));

            });
        },
        nextItem: function (options) {
            return options.length ? {
                item: options[0],
                options: options.slice(1, options.length)
            } :
            {
                item: false,
                options: false
            };
        },
        handler: function (next, done) {
            if (next) {
                du.load(next, du.handler, done);
            } else {
                // console.log('Connected to ' + utils.keys(databases).length + ' database(s).');
                (done && done());
            }

        }

    };
    return du;
};

