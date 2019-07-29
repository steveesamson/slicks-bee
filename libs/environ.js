const fs = require('fs'),
    readline = require('readline');
module.exports = function (base, cb) {

    // let base = process.cwd();
    // console.log(base)
    global['ENV'] = {};    

    if(!fs.existsSync(base + "/.env")) return cb();


    const readInterface = readline.createInterface({
        input: fs.createReadStream(base + "/.env"),
        // output: process.stdout,
        console: false
    });
    // const query = ['INSERT INTO countries (name,currency_code, country_extension, rate) VALUES '];
    readInterface.on('line', function (line) {
        if (!line) return;
        const [key, value] = line.split('=');
        // process.env[key] = value;
        ENV[key.trim()] = value.trim();
    });

    readInterface.on('close', function () {

        // console.log('Done...', ENV)
        cb();

    });

}