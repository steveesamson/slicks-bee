
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
        console.log(`Starting all crons...`);
        Object.values(cronStack).forEach( v => v.start());
        console.log(`Started all crons successfully.`)
    },
    stop:function(cronName){
        console.log(`Stopping cron:${cronName}...`);
        let task = cronStack[cronName];
        task && task.stop();
        console.log(`Stopped cron:${cronName} successfully.`)
    },
    stopAll:function(){
        console.log(`Stopping all crons...`);
        Object.values(cronStack).forEach( v => v.stop());
        console.log(`Stopped all crons successfully.`)
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
        crons.length && console.log('Cron routine started.')

    }

}