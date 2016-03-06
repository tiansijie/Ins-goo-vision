require('dotenv').config();
var request = require('request');
var async = require('async');

module.exports = function(INS_ACCESS_TOKEN, GOO_VISION_KEY, callback) {
  callback = callback || function() {};
  var results = [];
  var instagramURL = 'https://api.instagram.com/v1/users/self/media/recent/?access_token=' + process.env.INS_ACCESS_TOKEN || INS_ACCESS_TOKEN;
  request.get({url: instagramURL}, function(err, res, body) {
    body = JSON.parse(body);

    async.each(body.data, sendIns2GooVision, function(err) {
      if (err) {
        console.error(err);
      }
      callback(results);
    });
  });


  function sendIns2GooVision(ins, cb) {
    var imageURL = ins.images.standard_resolution.url;
    request.get({url: imageURL, encoding: 'base64'}, function (err, res, body) {
      var data = {
        "requests":[
          {
            "image":{
              "content": body
            },
            "features":[
              {
                "type":"LABEL_DETECTION",
                "maxResults":2
              }
            ]
          }
        ]
      };

      var options = {
           url: 'https://vision.googleapis.com/v1/images:annotate?key=' + process.env.GOO_VISION_KEY || GOO_VISION_KEY,
           headers: {'Content-Type': 'application/json'},
           json: data
      };

      request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          results.push(body.responses[0].labelAnnotations)
          cb();
        }
        else {
          cb(error);
        }
      });
    });
  }
}
