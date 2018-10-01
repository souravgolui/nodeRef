//module imports
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const path = require('path');


//database config import
const config = require('./config/database');

//database connection
mongoose.connect(config.database);
let db = mongoose.connection;
//check connection
db.once('open', function () {
    console.log('connected to mongoDB');
})
//check for db err
db.on('error', function (err) {
    console.log(err);
})

//app port
//for final version use port = 80
let port = 3100;
//api host name 
//for final version use hostName = '74.208.217.113'
let hostName = 'localhost';



//app Creation
const app = express();



//cross origin access
app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});



//public folder
app.use(express.static(path.join(__dirname, 'public')));
//set up local
app.locals.dat = {
    basePath: __dirname,
    domain: `${hostName}:${port}`
}
//set up middle-wares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressValidator());
//-----------------------------Route declearations-----------------------------------

app.get('/', (req, res) => {
    res.json( {
        status: 1,
        msg: 'working fine'
    })
});

app.get('/error', (req, res) => {
    res.json( {
        status: 1,
        msg: 'try if you can solve this puzzle'
    })
})

//log route
let logRoute = require('./routes/api/log');
app.use('/api/log', logRoute);
//userData route
let userDataRoute = require('./routes/api/userdata');
app.use('/api/userdata', userDataRoute);
//profile route
let profileRoute = require('./routes/api/profile');
app.use('/api/profile', profileRoute);
//posts route
let postRoute = require('./routes/api/post');
app.use('/api/post', postRoute);
//admin route
let adminRoute = require('./routes/api/admin');
app.use('/admin', adminRoute);

//-----------------------------------------------------------------------------------
//server-listen
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`server started on ${hostName}: ${port}`);
});
