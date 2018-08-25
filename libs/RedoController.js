module.exports={

    create: function (req, res) {

        var data = req.parameters;
        delete data['x-csrf-token'];
        req.db = SlickSources[data.tenant];
        let Redo = Models.Redo(req);
        Redo.emitToAll(req, data)
        Redo.destroy({id:data.id});
        res.json({text:'ok'});
    },
}