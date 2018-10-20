const 
{ promisify } = require("util"),
redis = require("redis"),
amqp = require('amqplib/callback_api'),
fs = require('fs'),
path = require("path");

class commonModule  {
    
    constructor(APP_NAME = '') {
        if (typeof APP_NAME == 'string' && APP_NAME.trim() != '') {
            this.appName = APP_NAME;
            this.logNow(`**** ${APP_NAME} has started ****`);
            console.log(`=> Logging is enabled with by default Application name : ${APP_NAME}`);
        }
        else {
            console.error(`Application Name is Missing while requiring exporter.js`);
            process.exit();
        }
        this.__CONFIG = this.readConfig();
        // let instance;
        this.GOOGLE_API_KEYS = {};
        this.redisConfig = this.__CONFIG.google.google_api_key;
        this.redisClient;
        this.rbmqClient;
    }
    /* createInstance() {
        let object = new commonModule();
        return object;
    }
    getInstance() {
        if (!this.instance)
            this.instance = this.createInstance();
        return this.instance;
    } */
    readConfig() {
        let configLocation = path.dirname(__filename) + "/config";
        if (!fs.existsSync(configLocation)) {
            console.error(`Location : ${configLocation} not found.`);
            process.exit();
        }
        let CONFIG_FILE = configLocation+"/config.json";
        return require(CONFIG_FILE);
    }
    mongoConnection(mongoURI = this.__CONFIG.database.mongo.local.url) {
        if (!mongoURI || typeof mongoURI == 'undefined' || mongoURI.length < 1)
            return false;
        let mongoose = require("mongoose");
        return mongoose.createConnection(mongoURI, { useNewUrlParser: true }, (mongoErr) => {
            if (mongoErr) {
                console.error(mongoErr);
                process.exit();
            }
            else
                console.log('=> mongo is connected');
        });
    }
    async rbmqConnection(crendentialURL = this.__CONFIG.rabbit_mq.credential_url.local) {
        if (!crendentialURL || typeof crendentialURL == 'undefined' || crendentialURL.length < 1) {
            this.rbmqClient = null;
            process.exit();
        }
        // promise not supported
        await amqp.connect(crendentialURL, (amqpErr, amqpConn) => {
            if (amqpErr) {
                this.rbmqClient = null;
                console.error(`RabbitMQ Error: ${amqpConn}`);
                process.exit();
            }
            else {
                this.rbmqClient = amqpConn;
                console.log('=> rabbitmq is connected');
            }
        });
    }
    async redisConnection(crendentialURL = this.__CONFIG.redis.local) {
        if (!crendentialURL || typeof crendentialURL == 'undefined') {
            this.redisClient = null;
            process.exit();
        }
        // `crendentialURL` should be passed as parameter
        let redisClient = redis.createClient();
        await redisClient.on("error", (err) => {
            console.error(`Radis Error: ${err}`);
            process.exit();
        });
        this.redisClient = redisClient;
        console.log('=> redis is connected');
    }
    createMongoSchema(collection, mongoDBObj) {
        if (!collection || typeof collection == 'undefined' || collection.length < 1 || !mongoDBObj || typeof mongoDBObj == 'undefined')
            return false;
        let mongoose = require('mongoose');
        let schema = new mongoose.Schema({
            domain: {
                type: String,
                match: /^(https?:\/\/)?((?:[a-z0-9-]+\.)+(?:[a-z0-9-]+))(?:\/|$)/i,
                required: true
            },
            speed_data: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            api_url: {
                type: String,
                default: ''
            },
            status: {
                type: Number,
                default: 0
            },
            error: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            added_time: {
                type: Date,
                default: Date.now
            },
            updated_time: {
                type: Date,
                default: Date.now
            },
            callback_url: {
                type: String,
                default: ''
            },
            callback_sent: {
                type: Boolean,
                default: false
            }
        });
        return mongoDBObj.model('google_explorer', schema);
    }
    rabbitmqMessagePush(message, queueName, rmqConnection = this.rbmqClient) {
        return new Promise((resolve, reject) => {
            if (!message || typeof message == 'undefined' || message.length < 1 || !rmqConnection || typeof rmqConnection == 'undefined' || !queueName || typeof queueName == 'undefined' || queueName.length < 1)
                reject(new Error(false));
            try {
                rmqConnection.createConfirmChannel(async (channelErr, channel) => {
                    if (channelErr)
                        reject(new Error(channelErr));
                    else {
                        var priority = 0;
                        try {
                            await channel.assertQueue(queueName, { durable: true, maxPriority: priority });
                        }
                        catch (ex) {
                            console.error(ex);
                        }
                        try {
                            channel.sendToQueue(queueName, new Buffer(JSON.stringify(message)), { persistent: true }, (publErr, ok) => {
                                channel.close();
                                // rmqConnection.close();
                                
                                if (publErr)
                                    reject(new Error(publErr));
                                else
                                    resolve(false);
                            });
                        }
                        catch (ex) {
                            reject(new Error(ex));
                        }
                    }
                });
            }
            catch (ex) {
                reject(new Error(ex));
            }
        });
    }
    rabbitmqMessageConsume(queueName, rmqConnection = this.rbmqClient) {
        return new Promise((resolve, reject) => {
            if (!rmqConnection || typeof rmqConnection == 'undefined' || !queueName || typeof queueName == 'undefined' || queueName.length < 1)
                reject(false);
            try {
                rmqConnection.createConfirmChannel(async (channelErr, channel) => {
                    if (channelErr)
                        reject(channelErr);
                    else {
                        var priority = 0;
                        try {
                            await channel.assertQueue(queueName, { durable: true, maxPriority: priority});
                        }
                        catch (ex) {
                            console.error(ex);
                        }
                        try {
                            channel.consume(queueName, (msg) => {
                                channel.close();
                                // rmqConnection.close();
                                
                                if (!msg)
                                    reject(msg);
                                else
                                    resolve(msg);
                            }, {noAck: true});
                        }
                        catch (ex) {
                            reject(new Error(ex));
                        }
                    }
                });
            }
            catch (ex) {
                reject(new Error(ex));
            }
        });
    }
    resetApiKeyValuesRedis(input, incr = 'hmset', redisClient = this.redisClient) {
        return new Promise((resolve, reject) => {
            if (!redisClient || typeof redisClient == 'undefined' || !input || typeof input == 'undefined')
                reject(false);
            if (input && Array.isArray(input) && input.length > 0) {
                let hashKey = Object.keys(this.redisConfig)[0];
                // let hashValue = Object.keys(this.redisConfig["api-key"][hashKey]);
                if (incr == 'incr') {
                    redisClient.hmincr(hashKey, input, (err, res) => {
                        if (err)
                            reject(err);
                        else
                            resolve(new Error(`incrment value update status :true`));
                    });
                }
                else {
                    redisClient.hmset(hashKey, input, (err, res) => {
                        if (err)
                            reject(err);
                        else
                            resolve(new Error(`hmset value update status :true`));
                    });
                }
            }
            else
                reject(new Error('invalid redis input'));
        });
        
    }
    getApiKeysFromRedis(redisClient = this.redisClient) {        
        let hashKey = Object.keys(this.redisConfig)[0];
        // let hashValue = this.redisConfig[hashKey];
        return new Promise((resolve, reject) => {
            if (!redisClient || typeof redisClient == 'undefined')
                reject(false);
            let redisPromise = promisify(redisClient.hgetall).bind(redisClient);
            redisPromise(hashKey)
            .then((replies) => {
                if (replies && typeof replies == 'object') {                
                    let inputForRedis = [];
                    for (let key in replies) {
                        if (parseInt(replies[key]) >= 25000) {
                            inputForRedis.push(key);
                            inputForRedis.push(0);
                            this.GOOGLE_API_KEYS[key] = 0;
                        }
                        else {
                            this.GOOGLE_API_KEYS[key] = replies[key];
                        }
                    }
                    if (inputForRedis.length > 1) {
                        this.resetApiKeyValuesRedis(redisClient, inputForRedis)
                        .then(resolve(this.GOOGLE_API_KEYS))
                        .catch(reject(true));
                    }
                    else
                        resolve(this.GOOGLE_API_KEYS);
                }
                else
                    reject(new Error("no keys found"));
            })
            .catch((err) => {
                console.error(err);
                redisClient.quit();
                process.exit()
            }); 
        });   
    }
    logNow(content, appName = this.appName) {
        if (appName && typeof content != 'undefined' && typeof content == 'string') {
            let dir = "./"+this.appName+"-logs";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, '0777', (fol_err) => {
                    if (fol_err) {
                        console.error(`${dir} not found. Exception : ${fol_err}`);
                        return false;
                    }
                })
            }
            let fileName = dir+"/"+this.appName+".log";
            let currentDate = new Date();
            let year = currentDate.getFullYear();
            let month = currentDate.getMonth();
            let day = currentDate.getDate();
            let hour = currentDate.getHours();
            let min = currentDate.getMinutes();
            let sec = currentDate.getSeconds();
            month = (month < 10) ? "0"+month : month;
            day = (day < 10) ? "0"+day : day;
            hour = (hour < 10) ? "0"+hour : hour;
            min = (min < 10) ? "0"+min : min;
            sec = (sec < 10) ? "0"+sec : sec;
            let logOption = [
                "Line : "+20+" ",
                year+"-"+month+"-"+day+" "+hour+":"+min+":"+sec,
                " => ",
                content                
            ];
            logOption = logOption.join(" ")+"\n";
            fs.appendFileSync(fileName, logOption, (ferr) => {
                if (ferr) 
                    console.error(`Log file not created: ${ferr}`);
            });
        }
        else {
            console.error(`unable to create log file : ${content}`);
            return false;
        }
    }
}
module.exports = (app) => (new commonModule(app));