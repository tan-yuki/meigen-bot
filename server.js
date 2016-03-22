var client  = require('cheerio-httpcli');
var Retry   = require('node-promise-retry').Retry;
var request = require('request');

var $ = require('./configure.json');

client
  .fetch('http://www.meigensyu.com/quotations/index/page1.html').then(function (result) {
    // 名言の最大件数取得
    var maxCount = result.$('.count').eq(0).text();

    return retryFetchQuotation(maxCount);
  }).then(function(result) {
    var quotation = result.$('.text').text();
    var source = result.$('.link li a').last().text();

    var message = '[code]' + quotation + '[/code]\n' +
                  'by ' + source;

    return postMessageToChatWork(message);
  })
  .catch(function (err) {
    console.log('Error:' + JSON.stringify(err));
  });


function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function retryFetchQuotation(maxCount) {
  var retry = new Retry({
    maxTries: 10,
    delay : 500,
    promiseFactory: function () {
      var index = randomInt(1, maxCount);
      return client
        .fetch('http://www.meigensyu.com/quotations/view/' + index + '.html');
    }
  });

  return retry.execute();
}

function postMessageToChatWork(message) {
  return new Promise(function(resolve, reject) {
    request.post({
      url: 'https://api.chatwork.com/v1/rooms/' + $.roomId + '/messages',
      headers: {
        'X-ChatWorkToken': $.apiToken
      },
      form: {
        body: message
      }
    }, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
