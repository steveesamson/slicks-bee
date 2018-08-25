let request = require('./request'),
sendRedo = function (options, cb) {

    request.post('/redo', options, cb);

};

module.exports = function(_db, token){

    if(!SlickSources[_db]) return {start: () => false};

    let _req = {db:SlickSources[_db]},

        Redo = Models.Redo(_req),
        redo = cb => {

            Redo.find({limit:10}, function(e, recs){
                if(!e){
                    cb(recs);
                }else{
                    console.error(e);
                }

            })

        },
        start = () => {
            redo( dispatch );
        },
        dispatch = recs => {

            let relayIt = r => {

                Object.assign(r,{tenant:_db,'x-csrf-token': token});
                sendRedo(r, (e, m) =>{
                    if(e){

                        console.error(e, m);
                    }
                });

                if(recs.length){

                    relayIt(recs.pop());

                }else setTimeout(start,100);

                
            };

            if(recs.length){

                relayIt(recs.pop());

            }else setTimeout(start,100);
        }; 
       

        console.log('Registered redo logs for ', _db);

        return {
            start:start
        }
};