// let messanger = require('./mailer/transport')();

module.exports = function(_db, messanger){

    if(!SlickSources[_db]) return {start: () => false};

    let _req = {db:SlickSources[_db]},

        Mails = Models.Mails(_req),
        fetchMails = cb => {

            Mails.find({limit:100}, function(e, recs){

                if(!e){

                    cb(recs);

                }else{
                    
                    console.error(e);
                }

            })

        },
        start = () => {
            fetchMails( dispatch );
        },
        dispatch = recs => {

            let run = function(){

                if(recs.length){

                    sendMail(recs.pop());

                }else setTimeout(start,100);

            },
            sendMail = r => {

                r.to = `${r.receiver_name} <${r.receiver_email}>`;
                r.message = r.body;

                messanger.sendMail(r, function (e, info) {

                    if (!e) {

                        Mails.destroy({id:r.id}, function(err, res){
                            run();
                        });
                        
                    } 
                    // else{
                        
                    //     Mails.update({id:r.id, sent:'1'}, function(){
                    //         run();
                    //     });
                    // }

                });

            };
            run();
        }; 
       

        console.log('Registered Mailer for ', _db);

        return {
            start:start
        }
};