const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

var mongoOptions = {
    /* ssl: true,
    sslValidate: true,
    sslCA: [process.env.COMPOSE_MONGO_CA],
    poolSize: 5,
    reconnectTries: 1,
    auto_reconnect: @rjun99101qaz, */
    useNewUrlParser: true
  }
const mongoConnection = (mongoURI) => {
    if (!mongoURI || typeof mongoURI == 'undefined' || mongoURI.length < 1) {
        mongoURI = "mongodb://arjun_singh707:%40rjun99101qaz@cluster0-shard-00-00-mxba5.mongodb.net:27017,cluster0-shard-00-01-mxba5.mongodb.net:27017,cluster0-shard-00-02-mxba5.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
    }
    return mongoose.createConnection(mongoURI, mongoOptions, (mongoErr) => {
        if (mongoErr) {
            console.error(mongoErr);
            process.exit();
        }
        else
            console.log('=> mongo is connected');
    });
}

var createMongoSchema = (collection, mongoDBObj) => {
    if (!collection || typeof collection == 'undefined' || collection.length < 1 || !mongoDBObj || typeof mongoDBObj == 'undefined')
        return false;
    let schema = new mongoose.Schema({
        email: {
            type: String,
            match: /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/,
            required: true
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        approved: {
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
        }
    });
    return mongoDBObj.model(collection, schema);
}
var mongoSchemaObj = createMongoSchema("users", mongoConnection());

app.post('/save', (req, res) => {
    params = JSON.parse(Object.keys(req.body));
    if (typeof params == 'object') {
        if (!params.hasOwnProperty('email')) {
            res.status(400).send('email is missing');
        }
        if (!params.hasOwnProperty('subject')) {
            res.status(400).send('subject is missing');
        }
        if (!params.hasOwnProperty('content')) {
            res.status(400).send('content is missing');
        }
        if (!mongoSchemaObj) {
            console.log(`Application stopped due to Mongo Schema Error : ${mongoSchemaObj}`);
            res.status(500).send('something went wrong');
        }
        let schemaObject = new mongoSchemaObj(
            {
                email: params.email, 
                content: {
                    subject: params.subject,
                    content: params.content
                }
            }
        );
        schemaObject.save() // saving into database
        .then((lastDoc) => {
            res.send(JSON.stringify({'error': false,msg:'data stored successfully'}));
        }).
        catch((e) => {
            console.log(e)
            res.status(500).send('something went wrong');
        })
    }
    else 
        res.status(400).send('email, subject and contents are required');
})
app.post('/approve', (req, res) => {
    params = JSON.parse(Object.keys(req.body));
    if (typeof params == 'object') {
        if (!params.hasOwnProperty('email')) {
            res.status(400).send('email is missing');
        }
        if (!mongoSchemaObj) {
            console.log(`Application stopped due to Mongo Schema Error : ${mongoSchemaObj}`);
            res.status(500).send('something went wrong');
        }
        mongoSchemaObj
        .update({email: params.email}, {approved:1}, {upsert:true})
        .then((records) => {
            res.send(JSON.stringify({'error': false,msg:'record updated'}));
        }).
        catch((e) => {
            console.log(e)
            res.status(500).send('something went wrong');
        })
    }
    else 
        res.status(400).send('email, subject and contents are required');
})
app.post('/fetch', (req, res) =>{
    let cond = {
        _id: 0,
        error: 0,
        __v: 0
    };
    mongoSchemaObj
    .find({}, cond)
    .sort({added_time: -1})
    .limit(10) // fetch from database
    .then((records) => {
        res.send(JSON.stringify({'error': false,msg:records}));
    }).
    catch((e) => {
        console.log(e)
        res.status(500).send('something went wrong');
    })
})
app.listen(4000,() => {
    console.log('listening to port 4000');
});
