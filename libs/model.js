/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */

module.exports = function (model) {
    var modelName = model.toLocaleLowerCase(),
        skipCleanKey = '~|',
        SMClean = require('smclean');

    SMClean.double = SMClean.float;
    SMClean.tinyint = function (str) {
        if (str.length > 1) str = str.substring(0, 1);
        return SMClean.int(str);
    };

    if (typeof String.prototype.startsWith == 'undefined') {
        String.prototype.startsWith = function (prefix) {
            return this.indexOf(prefix) === 0;
        };
    }

    return {
        instanceName: model,
        socket: false,
        attributes: {},
        uniqueKeys: ['id', 'SUM', 'ROW_COUNT'],
        defaultDateValues: false, //{'withdrawn_date':''yyyy-mm-dd'}
        checkConcurrentUpdate: false,//'lastupdated'
        joinSearch: [],//['users.user_id'] includes joins in searches.
        verbatims: [],//['attachments'] excludes from mclean.
        subscribe: function (req) {
            req.io.join(this.instanceName);
            console.log('Subscribed to %s', modelName);
        },
        unsubscribe: function (req) {
            req.io.leave(this.instanceName);
            console.log('Unsubscribed to %s', modelName);
        },
        publishCreate: function (req, load) {
//            slickIO.room(this.instanceName).broadcast('created', {message: load});
            if (req.io) {

                var pload = {verb: 'create', room: modelName, data: load};
                req.io.broadcast.emit('comets', pload);
                console.log('PublishCreate to %s', modelName);
            }
        },
        publishUpdate: function (req, load) {
//            slickIO.room(this.instanceName).broadcast('updated', {message: load});
            if (req.io) {
                var pload = {verb: 'update', data: load, room: modelName};
                req.io.broadcast.emit('comets', pload);
                console.log('PublishUpdate to %s', modelName);
            }
        },
        publishDestroy: function (req, load) {
//            slickIO.room(this.instanceName).broadcast('destroyed', {message: load});
            if (req.io) {
                var pload = {data: load, verb: 'destroy', room: modelName};
                req.io.broadcast.emit('comets', pload);
                console.log('PublishDestroy to %s', modelName);
            }
        },
        sanitizeParams:function(options){

            var self = this;
            for (var attr in this.attributes) {

                if (attr in options) {
                    var value = options[attr];

                    var type = self.attributes[attr].toLowerCase();

                    // if(type === 'string'  && value && (value + '').startsWith(skipCleanKey) ){
                    //     value = value.substring(2);
                    //     options[attr] = value;
                    //     continue;
                    // }

                    if(self.verbatims.indexOf(attr) !== -1) continue;

                    options[attr] = SMClean[type](options[attr]);
                }
            }
        },
        search: function (searchString) {
            var self = this,
                params = '';

            if (searchString.length) {
                params = searchString.split(/\s/);
                var attrCopy = utils.clone(self.attributes);
                if (self.joinSearch && self.joinSearch.length) {
                    self.joinSearch.forEach(function (f) {
                        attrCopy[f] = 'string';
                    });
                }
                params.forEach(function (pa) {
                    var index = 0;
                    for (var attr in attrCopy) {
                        if (attrCopy[attr] === 'string') {
                            if (index === 0) {
                                self.db.like(attr.indexOf('.') == -1 ? (modelName + '.' + attr) : attr, pa, 'both');
                            } else {
//                                self.db.orLike(modelName + '.' + attr, pa, 'both');
                                self.db.orLike(attr.indexOf('.') == -1 ? (modelName + '.' + attr) : attr, pa, 'both');
                            }
                            ++index;
                        }
                    }

                });
            }
        },
        prepareResult: function (err, rows, options, cb) {
            var self = this,
                resultSent = false;
            if (err) {

                (cb && cb(err));
                return;
            }

            if (self.uniqueKeys && self.uniqueKeys.length) {
                for (var k = 0; k < self.uniqueKeys.length; ++k) {
                    var key = self.uniqueKeys[k];
                    if (options[key]) {
                        if (rows.length) {
                            var rec = rows[0];

                            if (!options.relax_exclude && self.exclude && self.exclude.length) {
                                self.exclude.forEach(function (x) {
                                    delete rec[x];
                                });
                            }
                            (cb && cb(false, rec));
                        } else {
                            (cb && cb(false, false));
                        }
                        resultSent = true;
                        break;
                    }
                }
            }

            if (!resultSent) {
                if (self.exclude && self.exclude.length) {
                    rows.forEach(function (rec) {

                        self.exclude.forEach(function (x) {
                            delete rec[x];
                        });
                    });
                }
                (cb && cb(false, rows));
            }

        },
        find: function (options, cb) {

            var self = this;
            this.sanitizeParams(options);

            for (var attr in this.attributes) {
                if (attr in options) {
                    this.db.where(modelName + '.' + attr, options[attr]);
                }
            }

            if (options['search']) {
                this.search(options['search']);
            }

            (options.limit && this.db.limit(options.limit, options.offset || '0'));
            if (options.orderby) {
                this.db.orderBy(options.orderby, options.direction);
            } else {
                if (self.orderBy) {
                    var direction = self.orderDirection || 'ASC';
                    this.db.orderBy(modelName + '.' + self.orderBy, direction);

                } else  this.db.orderBy(modelName + '.id', 'ASC');
            }

            if (options['ROW_COUNT']) {
                return this.rowCount(this.db.compile(modelName), options, cb);
            }
            this.db.fetch(modelName, function (err, rows) {

                self.prepareResult(err, rows, options, cb);

            });
        },
        rowCount: function (query, options, cb) {
            var self = this;
            this.sanitizeParams(options);

            query = "select COUNT(*) AS count  from (" + query + ") ex";
            this.db.query(query, function (err, rows) {
                self.prepareResult(err, rows, options, cb);
            });
        },
        counts: function (options, cb) {
            this.sanitizeParams(options);

            for (var attr in this.attributes) {
                if (attr in options) {
                    this.db.where(modelName + '.' + attr, options[attr]);
                }
            }
            this.db.select('COUNT(*) AS count')
                .from(modelName)
                .fetch(function (err, rows) {

                    if (err) {
                        (cb && cb(err));
                        return;
                    }
                    if (rows.length) {
                        (cb && cb(false, rows[0]));
                    } else {
                        (cb && cb(false, false));
                    }

                });
        },
        destroy: function (options, cb) {

            this.sanitizeParams(options);

            if (!options.id) {
                var err = new Error('You need an id to destroy any model');
                (cb && cb(err));
                return;
            }

            if (this.checkConcurrentUpdate) {
                this.db.where(this.checkConcurrentUpdate, options[this.checkConcurrentUpdate]);
                delete options[this.checkConcurrentUpdate];
            }

            this.db.where('id', options.id)
                .delete(modelName, function (err, result) {

                    if (err) {
                        (cb && cb(err));
                        return;
                    }
                    (cb && cb(false, result));
                });
        },
        update: function (options, cb) {


            this.sanitizeParams(options);

            if (!options.id) {
                var err = new Error('You need an id to update any model');
                (cb && cb(err));
                return;
            }


            if (this.checkConcurrentUpdate) {

                this.db.where(this.checkConcurrentUpdate, options[this.checkConcurrentUpdate]);

                this.db.set(this.checkConcurrentUpdate, parseInt(options[this.checkConcurrentUpdate]) +  1);

                delete options[this.checkConcurrentUpdate];
            }

            for (var attr in this.attributes) {
                if (attr !== 'id' && (attr in options)) {
                    this.db.set(attr, options[attr]);
                }
            }


            this.db.where('id', options.id)
                .update(modelName, function (err, result) {

                    if (err) {
                        (cb && cb(err));
                        return;
                    }
                    (cb && cb(false, result));
                });
        },
        create: function (options, cb) {

            this.sanitizeParams(options);

            var validOptions = {},
                self = this;
            for (var attr in this.attributes) {
                if (self.defaultDateValues && self.defaultDateValues[attr]) {
                    validOptions[attr] = DateTime(self.defaultDateValues[attr]);
                    continue;
                }

                if (attr in options) {
                    validOptions[attr] = options[attr];
                }
            }


            this.db.insert(modelName, validOptions, function (err, result) {
                if (err) {
                    (cb && cb(err));
                    return;
                }
                (cb && cb(false, result));
            });
        }

    };


};
