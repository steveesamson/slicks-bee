module.exports = function(_db){
    let _req = {db:SlickSources[_db]},
        Redo = Models.Redo(_req),
        dispatch = recs =>{
            recs.forEach( r => Redo.relay(_req, r));
            setTimeout(start,1000);
        }, 
        redo = cb => {

            Redo.find({limit:100}, function(e, recs){
                if(!e){
                    cb(recs);
                }else{
                    console.error(e);
                    // cb([]);
                }

            })

        },
        start = () => {
            redo( dispatch );
        };

        console.log('Registered redo logs for ', _db);
        // start();

        return {
            start:start
        }
};