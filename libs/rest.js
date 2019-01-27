/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/8/14.
 */


module.exports = function (modelName) {


    return {

        find: function (req, res) {

            // console.log('Params: ', req.parameters, ' Tenant: ', req.db !== null);
            
            let model = Models[modelName](req);
            // console.log(' Tenant Model: ', model);
            model.find(req.parameters, function (err, rows) {

                if (err) {
                    res.status(200).json({error: err.message});
                } else {
                    if(rows){

                        if(model.publish_create || req.parameters.publish_fetch){
                            model.publishCreate(req, rows);
                            return req.parameters.publish_create?  res.status(200).json([]) : res.status(200).json(rows);
                        }

                        if(req.parameters.publish_delete){
                            model.publishDestroy(req, rows);
                            return res.status(200).json([]);
                        }
                        if(req.parameters.publish_update || req.parameters.publish_fetch_update){
                            model.publishUpdate(req, rows);
                            return req.parameters.publish_update?  res.status(200).json([]) : res.status(200).json(rows);
                        }
                        
                        res.status(200).json(rows);

                    }else{
                        res.status(200).json({error:'Record not found!'});
                    }
                }
            })
        },
        create: function (req, res) {

            var load = req.parameters;
            let model = Models[modelName](req);
            model.create(load, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});

                }
                else {
                    // console.log('result: ', result);
                    model.find(result, function (err, row) {

                        if (err) {
                            res.status(200).json({error: err.message});
                        } else {

                            model.publishCreate(req, row);
                            // console.log('should send: ', row);
                            res.status(200).json(row);
                        }
                    })

                }


            });
        },
        destroy: function (req, res) {
            var arg = req.parameters;
            let model = Models[modelName](req);
            model.destroy(arg, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});

                } else {

                    if (parseInt(result.affectedRows)) {
                        var load = {id: arg.id};
                        model.publishDestroy(req, load);
                        res.status(200).json(load);
                    }else{
                        res.status(200).json({error:'Delete was not successful, probably this record has been updated since your last fetch'});
                    }

                }


            });
        },
        update: function (req, res) {

            let arg = req.parameters;
            let model = Models[modelName](req);
            model.update(arg, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});
                } else {

                    if (parseInt(result.affectedRows)) {

                        model.find({id:arg.id}, function (err, row) {

                            if (err) {
                                res.status(200).json({error: err.message});
                            } else {

                                model.publishUpdate(req, row);
                                res.status(200).json(row);
                            }
                        });

                    }else{
                        res.status(200).json({error:'Update was not successful, probably this record has been updated since your last fetch.'});
                    }

                }


            });
        },
        __fields: function(req, res){
            let model = Models[modelName](req);
            res.status(200).json(model.attributes);
        }

    };

};
