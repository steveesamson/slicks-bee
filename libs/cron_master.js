
const cronRunner = require('node-cron'),
cronStack = {};


module.exports = {

    
    start:function(cronName){
        console.log(`Starting cron:${cronName}...`);
        let task = cronStack[cronName];
        task && task.start();
        console.log(`Started cron:${cronName} successfully.`)
    },
    startAll:function(){
        Object.values(cronStack).forEach( v => v.start());
    },
    stop:function(cronName){
        console.log(`Stopping cron:${cronName}...`);
        let task = cronStack[cronName];
        task && task.stop();
        console.log(`Stopped cron:${cronName} successfully.`)
    },
    stopAll:function(){
        Object.values(cronStack).forEach( v => v.stop());
    },
    init:function(crons){
        crons.forEach(e =>{
            if(!cronRunner.validate(e.schedule)){
                console.error('Invalid cron expression: ', e.name, e.schedule);

                process.exit();
            }
            if(e.enabled){
                cronStack[e.name] = cronRunner.schedule(e.schedule, e.task);
                if(e.immediate){
                    e.task();
                }
            }

        })

        setTimeout(() =>{

            this.stop('Rates');
            setTimeout(() =>{
                this.start('Rates');
            },120000);

        },120000);
    }

}