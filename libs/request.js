var http = require("http");
var options = {
  hostname: 'localhost',
  port: APP_PORT,
  headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  }
},
params = data => {
    return Object.keys(data)
        .map(k => `${k}=${encodeURIComponent(data[k])}`)
        .join('&');
};

var request = function(url, method, data={}, cb){
    let copy = {};
    Object.assign(copy,options, {method:method,path:url});
    var req = http.request(copy, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (body) {

            let msg = JSON.parse(body);
            if('error' in msg){
                return cb && cb(msg.error);
            }
            cb && cb(false, msg);
        });
      });
      req.on('error', function(e) {
          cb && cb(e.message);
      });
      // write data to request body
      req.write(params(data));
      req.end();
};


module.exports = {

    post:function(url,data,cb){
        request(url,'POST', data, cb);
    }
}