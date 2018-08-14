/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/5/14.
 */

module.exports = function (model) {
    var modelName = model.toLocaleLowerCase(),
        SMClean = require('smclean'),
        broadcast = function (load) {
            IO.sockets.emit('comets', load);
        };

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
        checkConcurrentUpdate: false, //'lastupdated'
        joinSearch: [], //['users.user_id'] includes joins in searches.
        verbatims: [], //['attachments'] excludes from mclean.
        searchPath: [], //['attachments'] excludes from mclean.
        postCreate: function (req, data) {

        },
        postUpdate: function (req, data) {

        },
        postDestroy: function (req, data) {

        },
        broadcastUpdate: function (load) {
            var pload = {
                verb: 'update',
                room: modelName,
                data: load
            };
            broadcast(pload);
        },
        broadcastCreate: function (load) {
            var pload = {
                verb: 'create',
                room: modelName,
                data: load
            };
            broadcast(pload);
        },
        broadcastDestroy: function (load) {
            var pload = {
                verb: 'destroy',
                room: modelName,
                data: load
            };
            broadcast(pload);
        },
        publishCreate: function (req, load) {
            //            slickIO.room(this.instanceName).broadcast('created', {message: load});
            this.postCreate({
                db: req.db
            }, load);
            if (req.io) {

                var pload = {
                    verb: 'create',
                    room: modelName,
                    data: load
                };

                req.io.broadcast.emit('comets', pload);
                console.log('PublishCreate to %s', modelName);
            }
        },

        publishUpdate: function (req, load) {
            this.postUpdate({
                db: req.db
            }, load);
            if (req.io) {
                var pload = {
                    verb: 'update',
                    data: load,
                    room: modelName
                };
                req.io.broadcast.emit('comets', pload);
                console.log('PublishUpdate to %s', modelName);
            }
        },
        publishDestroy: function (req, load) {
            //            slickIO.room(this.instanceName).broadcast('destroyed', {message: load});
            this.postDestroy({
                db: req.db
            }, load);
            if (req.io) {
                var pload = {
                    data: load,
                    verb: 'destroy',
                    room: modelName
                };

                req.io.broadcast.emit('comets', pload);
                console.log('PublishDestroy to %s', modelName);
            }
        },
        setConditions: function (options) {

            this.sanitizeParams(options);

            for (var attr in this.attributes) {
                if (attr in options) {

                    if (utils.isArray(options[attr])) {
                        var nArr = (this.attributes[attr] === 'string') ? options[attr].map(v => `'${v}'`) : options[attr];
                        this.db.whereIn(modelName + '.' + attr, nArr);
                    } else {
                        this.db.where(modelName + '.' + attr, options[attr]);
                    }
                }
            }
        },
        sanitizeParams: function (options) {

            var self = this;
            for (var attr in this.attributes) {

                if (attr in options) {
                    var value = options[attr];

                    var type = self.attributes[attr].toLowerCase();

                    if (self.verbatims.indexOf(attr) !== -1) continue;

                    if (utils.isArray(options[attr])) {
                        let copy = options[attr].slice(0, options[attr].length);
                        copy = copy.map(e => SMClean[type](e));
                        options[attr] = copy;

                    } else {
                        options[attr] = SMClean[type](value);
                    }
                }
            }
        },

        search: function (searchString, searchPath) {
            var self = this,
                params = '';

            if (searchString.length) {
                params = searchString.split(/\s/);
                var attrCopy = searchPath || self.searchPath.slice(0, self.searchPath.length);
                if (self.joinSearch && self.joinSearch.length) {
                    self.joinSearch.forEach(function (f) {
                        attrCopy.push(f);
                    });
                }
                params.forEach(function (pa) {
                    for (var index = 0; index < attrCopy.length; ++index) {
                        var attr = attrCopy[index];
                        if (index === 0) {
                            self.db.like(attr.indexOf('.') == -1 ? (modelName + '.' + attr) : attr, pa, 'both');
                        } else {
                            self.db.orLike(attr.indexOf('.') == -1 ? (modelName + '.' + attr) : attr, pa, 'both');
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
            this.setConditions(options);


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

                } else this.db.orderBy(modelName + '.id', 'ASC');
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

        destroy: function (options, cb) {

            if (!options.id && !options.where) {
                var err = new Error('You need an id/where object to destroy any model');
                (cb && cb(err));
                return;
            }

            if(options.id){
                this.db.where('id', SMClean.int(options.id));
            }else if(options.where){
                let where = options.where;
                this.setConditions(where);
            }

            if (this.checkConcurrentUpdate) {
                this.db.where(this.checkConcurrentUpdate, options[this.checkConcurrentUpdate]);
                delete options[this.checkConcurrentUpdate];
            }

            // 
            this.db.delete(modelName, function (err, result) {

                    if (err) {
                        (cb && cb(err));
                        return;
                    }
                    (cb && cb(false, result));
                });
        },
        update: function (options, cb) {

            if (!options.id && !options.where) {
                var err = new Error('You need an id/where object to update any model');
                (cb && cb(err));
                return;
            }

            if(options.id){
                this.db.where('id',  SMClean.int(options.id));
            }else if(options.where){
                let where = options.where;
                this.setConditions(where);
            }

            if (this.checkConcurrentUpdate) {

                this.db.where(this.checkConcurrentUpdate, options[this.checkConcurrentUpdate]);

                this.db.set(this.checkConcurrentUpdate, parseInt(options[this.checkConcurrentUpdate]) + 1);

                delete options[this.checkConcurrentUpdate];
            }

            for (var attr in this.attributes) {
                if (attr !== 'id' && (attr in options)) {
                    this.db.set(attr, options[attr]);
                }
            }

            this.db.update(modelName, function (err, result) {

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