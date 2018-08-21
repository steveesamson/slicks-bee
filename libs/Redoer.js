module.exports = function(_db, getAWorker){

    if(!SlickSources[_db]) return {start: () => false};

    let _req = {db:SlickSources[_db]},
        Redo = Models.Redo(_req),
        dispatch = recs => {

            let relayIt = r => {

                Object.assign(r,{tenant:_db});
                Redo.proxyFetch(_req, r, data => {

                    // console.log('data: ', data)
                    let load = {};
                    if(data){

                        Object.assign(load, data);
                    }else load = data;
                    // console.log('load: ', load)
                    

                    if(data){
                        let worker = getAWorker();
                        if(worker){
                            worker.send(load);
                        }

                    }
                    Redo.destroy({id:r.id});

                    if(recs.length){

                        relayIt(recs.pop());

                    }else setTimeout(start,1000);

                });
            };

            if(recs.length){

                relayIt(recs.pop());

            }else setTimeout(start,1000);
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