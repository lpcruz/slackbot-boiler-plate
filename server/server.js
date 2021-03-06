require('dotenv').config();
const express = require('express');
const request = require('request');
const app = express();
const slackEventsApi = require('@slack/events-api');
const slackEvents = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET, {
    includeBody: true
});
const Slack = require('./slack');

  class Server {
    constructor() {
        this.clientId = process.env.SLACK_CLIENT_ID;
        this.clientSecret = process.env.SLACK_CLIENT_SECRET;
        this.PORT = 4390;
        this.slack = new Slack();
    }

    setUp() {
        return this
          .init(this.PORT)
          .auth()
          .get('/')
          .get('/oauth')
          .get('/slack/events')
          .initSlackListener();
      }
    
    initSlackListener() {
      app.use('/slack/events', slackEvents.expressMiddleware());
      slackEvents.on('app_mention', (message, body) => {
          console.log(`Received a message event: user ${body.event.user} in channel ${body.event.channel} says ${body.event.text}`);
          if (!message.subtype && message.text.indexOf('hi') >= 0) {  
              this.slack.notify(`Congrats <@${body.event.user}>!, you made your first slackbot`);
            };
        });
        
        return this;
    }  

    init(port) {
        app.listen(port, function () {
            console.log(`Bot listening on ${port}`);
        })

        return this;
    }

    get(route) {
        app.get(route, function(req,res) {
            res.send(`Server is up and running. Nothing to see here.`);
        })

        return this;
    }

    auth() {
        app.get('/oauth', function(req, res) {
            if (!req.query.code) {
                res.status(500);
                res.send({"Error": "Looks like we're not getting code."});
                console.log("Looks like we're not getting code.");
            } else {
                request({
                    url: 'https://slack.com/api/oauth.access',
                    qs: {code: req.query.code, client_id: this.clientId, client_secret: this.clientSecret},
                    method: 'GET', 
        
                }, function (error, res, body) {
                    if (error) {
                        console.log(error);
                    } else {
                        res.json(body);
        
                    }
                })
            }
        })
        
        return this;
    }
}

module.exports = Server;