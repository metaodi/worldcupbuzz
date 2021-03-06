var _ = require('underscore');
var Twit = require('twit');  
var Yaml = require('js-yaml');
var Fs = require('fs');
var Superagent = require('superagent');

var config = Yaml.safeLoad(Fs.readFileSync('config.yml', 'utf8'));
console.log(config);

var T = new Twit({  
  consumer_key: config.twitter.consumerKey,
  consumer_secret: config.twitter.consumerSecret,
  access_token: config.twitter.accessToken,
  access_token_secret: config.twitter.accessTokenSecret
});

var stadiums = Yaml.safeLoad(Fs.readFileSync('stadium.yml', 'utf8'));

var keywords = _.flatten(_.map(stadiums, function(value, key) {
    return value.keywords;
}));

console.log("tracking keywords: ", keywords);

var sendTweet = function(infos) {
    console.log('incoming tweet:', infos);
    Superagent
        .post('http://worldcupbuzz.herokuapp.com/receive')
        .set('Content-Type', 'application/json')
        .send(infos)
        .end(function(res) {
            if (res.ok) {
                console.log("sent to Odi");
            }
            else {
                console.log("error while sending to Odi", res.text);
                console.log("res", res);
            }
        });
};

var geocode = function(loc, callback) {
    var result = false;
    Superagent
        .get('http://open.mapquestapi.com/geocoding/v1/address?maxResults=1&key=' + config.mapquest.appkey + '&location=' + loc)
        .end(function(res) {
            result = true;
            if (!res.ok || !res.body.locations || !res.body.locations[0]) {
                callback(null);
                return;
            }
            console.log("Location", res.body.locations[0]);
            var cords = res.body.locations[0].latLng;
            callback([cords.lng, cords.lat]);
        });

    setTimeout(function() {
        if (!result) {
            callback(null);
        }
    }, 2000);

};

var infosCallback = function (infos) {
    return function(coords) {
        if (coords) {
            infos.coordinates = {'type': 'Point', 'coordinates': coords};
        }
        sendTweet(infos);
    }
};

var stream = T.stream('statuses/filter', { track: keywords })

stream.on('tweet', function(tweet) {

    var matchingKeyword = _.find(keywords, function(keyword) {
        return tweet.text.indexOf(keyword) > -1;
    });

    if (matchingKeyword != undefined) {
        console.log("found matching keyword: ", matchingKeyword);
        var stadium = _.find(stadiums, function(stadium) {
            return stadium.keywords.indexOf(matchingKeyword) > -1;
        });

        var infos = {
            origin: 'twitter',
            user: tweet.user.screen_name,
            tweet: tweet.text,
            coordinates: null,
            stadium: {
                name: stadium.name,
                coordinates: {
                    type: 'Point',
                    coordinates: [
                        stadium.coordinates.long, stadium.coordinates.lat
                    ]
                }

            }
        };

        if (tweet.coordinates) {
            infos.coordinates = tweet.coordinates;
        } else if (tweet.user.location) {
            geocode(tweet.user.location, infosCallback(infos));
            return;
        } else if (tweet.user.time_zone) {
            geocode(tweet.user.time_zone, infosCallback(infos));
            return;
        }
        sendTweet(infos);
    }
});
