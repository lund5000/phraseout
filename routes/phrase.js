var http = require('http');
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Q = require('q');
var partsOfSpeech = ['adjective', 'verb', 'noun', 'adverb']

function getOptions(part, count) {
  var params = {
    api_key: process.env.APIKEY,
    includePartOfSpeech: part,
    minCorpusCount: count || 100000
  };
  var queryString = '';

  _.each(params, function (key, value) {
    queryString += value + '=' + key + '&';
  });
  
  return {
    host: 'api.wordnik.com',
    path: '/v4/words.json/randomWord?' + queryString.slice(0, -1),
  };
}

function makeRequest(options, deferred) {
  var request = http.get(options, function (response) {
    response.setEncoding('utf8');
    var body = '';
    
    response.on('data', function (data) {
      body += data;
    });
    response.on('end', function () {
      var json = JSON.parse(body);
      var word = json.word;
      var capitalized = word ? word.slice(0, 1).toUpperCase() + word.slice(1) : '';
      deferred.resolve(capitalized);
    });
  });

  request.on('error', function (err) {
    deferred.reject(err);
  });
  request.end();
}

router.use(function (req, res) {
  var parts = _.compact(req.path.split('/'));
  var promises = [];
  var promise;

  _.each(parts, function (part) {
    if(part === 'number') {
      promise = Q(Math.round(Math.random() * 100));
    } else if (_.includes(partsOfSpeech, part)) {
      var deferred = Q.defer();
      var options = getOptions(part, req.query.count);
      makeRequest(options, deferred);

      promise = deferred.promise;      
    }

    promises.push(promise);
  });

  Q.all(promises)
    .spread(function () {
      var args = Array.prototype.slice.call(arguments);
      res.render('phrase', {
        phrase: args.join('')
      });
    })
    .catch(function (error) {
      console.error(error);
    });
});

module.exports = router;
