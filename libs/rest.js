/**
 * Created by steve Samson <stevee.samson@gmail.com> on 2/8/14.
 */


module.exports = function (modelName) {


    return {
        subscribe: function (req, res) {
            global[modelName].subscribe(req);
            res.json({message:'Subuscribed successfully'});
        },
        unsubscribe: function (req, res) {
            global[modelName].unsubscribe(req);
            res.json({message:'Unsubuscribed successfully'});
        },
        find: function (req, res) {

            global[modelName].find(req.parameters, function (err, rows) {

                if (err) {
                    res.status(200).json({error: err.message});
                } else {
                    if(rows){
                        res.status(200).json(rows);
                    }else{
                        res.status(200).json({error:'Record not found!'});
                    }
                }
            })
        },
        create: function (req, res) {

            var load = req.parameters;

            global[modelName].create(load, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});

                }
                else {

                    global[modelName].find(result, function (err, row) {

                        if (err) {
                            res.status(200).json({error: err.message});
                        } else {

                            global[modelName].publishCreate(req, row);
                            res.status(200).json(row);
                        }
                    })

                }


            });
        },
        destroy: function (req, res) {
            var arg = req.parameters;
            global[modelName].destroy(arg, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});

                } else {

                    if (parseInt(result.affectedRows)) {
                        var load = {id: arg.id};
                        global[modelName].publishDestroy(req, load);
                        res.status(200).json(result);
                    }else{
                        res.status(200).json({error:'Delete was not successful, probably this record has been updated since your last fetch'});
                    }

                }


            });
        },
        update: function (req, res) {

            var arg = req.parameters;

            global[modelName].update(arg, function (err, result) {
                if (err) {
                    res.status(200).json({error: err.message});
                } else {

                    if (parseInt(result.affectedRows)) {

                        global[modelName].find({id:arg.id}, function (err, row) {

                            if (err) {
                                res.status(200).json({error: err.message});
                            } else {
                                global[modelName].publishUpdate(req, row);
                                res.status(200).json(row);
                            }
                        });

                    }else{
                        res.status(200).json({error:'Update was not successful, probably this record has been updated since your last fetch.'});
                    }

                }


            });
        },
        counts:function(req, res)
        {
            global[modelName].counts(req.parameters, function (err, rows) {

                if (err) {
                    res.status(200).json({error: err.message});
                } else {
                    res.status(200).json(rows);
                }
            })
        }

    };

};
