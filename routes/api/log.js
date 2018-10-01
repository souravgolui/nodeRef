const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const saltRounds = 10;

const router = express.Router();

const User = require('../../models/user');
const auth = require('../../function/authenticate');
const FUNC = require('../../function/functional');
//router.use(auth.init);
//finction to prepare userinfo for the response
function prepareUser(lg, req) {
    userData = {};
    userData._id = lg._id;
    userData.image = `${req.app.locals.dat.domain}/users/${lg.folder}/${lg.image}`;
    userData.thumb_image = `${req.app.locals.dat.domain}/thumb/${lg.thumb_image}`;
    userData.full_name = lg.full_name;
    userData.user_name = lg.user_name;
    userData.last_login = lg.date;
    userData.connection_string = lg.connection_string;
    userData.is_following = lg.should_show_suggestion ? 1 : 0;
    return userData;
}
function isEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


//register
router.post('/register', (req, res) => {
    //checking wheather these fields are properly given
    req.checkBody('full_name', 'Full Name is required!').notEmpty();
    req.checkBody('user_name', 'user Name is required!').notEmpty();
    req.checkBody('latitude', 'latitude is required!').notEmpty();
    req.checkBody('longitude', 'longitude is required!').notEmpty();
    req.checkBody('email', 'Email is required!').notEmpty();
    req.checkBody('device_type', 'device_type is required!(ios, android)').notEmpty();
    req.checkBody('device_id', 'device_id is required!').notEmpty();
    req.checkBody('email', 'This is not an email-address').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();

    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0, message: 'unable to register!' }); // status 0 means that there is error
    } else {
        //checking wheather the user is unique
        User.find({ email: req.body.email }, (err, any) => {
            if (err) console.log(err);
            if (any.length) {
                res.json({ errors: [{ msg: 'email is already registered', param: 'email' }], status: 0, message: 'already existing email!' });
            }
            else {
                //provided that the user is unique
                let user = new User();
                user.full_name = req.body.full_name;
                user.user_name = req.body.user_name;
                user.latitude = req.body.latitude;
                user.longitude = req.body.longitude;
                user.device_type = req.body.device_type;
                user.device_id = req.body.device_id;
                user.email = req.body.email;
                user.account_type = 'normal';
                user.password = req.body.password;
                user.connection_string = FUNC.makeConnectionString();
                let fld = 'u-' + new Date().valueOf() + '-' + Math.random().toString(36).substring(4);
                user.folder = fld;
                user.image = 'default.jpg';
                user.thumb_image = fld + '.jpg';
                let newPath = req.app.locals.dat.basePath + '/public/users/' + fld;
                let newPath2 = req.app.locals.dat.basePath + '/public/thumb/' + fld + '.jpg';
                console.log(newPath);
                if (!fs.existsSync(newPath)) {
                    fs.mkdirSync(newPath);
                    fs.mkdirSync(newPath + '/posts');
                }
                // transfering default image and thumbnail
                fs.createReadStream(req.app.locals.dat.basePath + '/public/img/default.jpg').pipe(fs.createWriteStream(newPath + '/default.jpg'));
                fs.createReadStream(req.app.locals.dat.basePath + '/public/img/default_thumb.jpg').pipe(fs.createWriteStream(newPath2));
                //hashing the password
                bcrypt.genSalt(saltRounds, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        user.password = hash;
                        user.save((err, ur) => {

                            if (err) console.log(err);
                            if (ur) {

                                //preparation of data
                                userData = {};
                                userData.image = `${req.app.locals.dat.domain}/users/${ur.folder}/${ur.image}`;
                                userData.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;
                                userData.full_name = ur.full_name;
                                userData.user_name = ur.user_name;
                                User.findOne({ email: req.body.email })
                                    .exec((err, usr) => {
                                        if (err) console.log(err);
                                        if (usr) {
                                            userData._id = usr._id;
                                            userData.should_show_suggestion = usr.should_show_suggestion ? 1 : 0;
                                        }
                                        res.json({
                                            success: ' Registration successful.',
                                            user: userData,
                                            status: 1,
                                        });
                                    });
                            }
                        });
                    });
                });
            }
        });
    }
});

//login normal
router.post('/login', (req, res) => {
    //checking wheather these fields are properly given
    req.checkBody('latitude', 'latitude is required!').notEmpty();
    req.checkBody('longitude', 'longitude is required!').notEmpty();
    req.checkBody('email', 'Email is required!').notEmpty();
    req.checkBody('email', 'This is not an email-address').isEmail();
    req.checkBody('device_type', 'device_type is required!(ios, android)').notEmpty();
    req.checkBody('device_id', 'device_id is required!').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {

        let emailAddress = req.body.email;
        let password = req.body.password;
        User.findOne({ email: emailAddress }, (err, user) => {
            if (err) res.json({ errors: [{ msg: err }], status: 0 });
            if (user) {
                //comparing the hashed password
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) throw err;
                    if (result) {
                        console.log('password matched!');
                        User.findByIdAndUpdate(user._id, { $set: { date: Date.now(), latitude: req.body.latitude, longitude: req.body.longitude, device_type: req.body.device_type, device_id: req.body.device_id } }, (err, lg) => {
                            if (err) console.log(err);
                            if (lg) {
                                //preparation of data
                                userData = prepareUser(lg,req);
                                res.json({
                                    user: userData,
                                    status: 1
                                })
                            };

                        });
                    }
                    else {
                        console.log('wrong password!');
                        res.json({ errors: [{ msg: 'wrong password!', param: 'password', message: 'unable to authenticate!' }], status: 0 });
                    }
                });
            }
            else {
                console.log('wrong email address!');
                res.json({ errors: [{ msg: 'wrong email address', param: 'email', message: 'unable to authenticate!' }], status: 0 });
            }
        });
    }

});
//other logins : this is a togle api
router.post('/login/:type', (req, res) => {
    console.log(req.body);
    //checking wheather these fields are properly given
    req.checkBody('latitude', 'latitude is required!').notEmpty();
    req.checkBody('longitude', 'longitude is required!').notEmpty();
    req.checkBody('account', 'acount is required!').notEmpty();
    req.checkBody('name', 'name is required!').notEmpty();
    req.checkBody('device_type', 'device_type is required!(ios, android)').notEmpty();
    req.checkBody('device_id', 'device_id is required!').notEmpty();
    req.checkBody('email', 'This is not an email-address').isEmail();
    req.checkBody('token', 'token is required').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        User.count({ account_type: req.params.type, account: req.body.account })
            .exec((err, num) => {
                console.log(num);
                if (err) console.log(err);
                if (num > 0) {
                    //log in
                    User.findOne({ account: req.body.account, account_type: req.params.type }, (err, user) => {
                        if (err) res.json({ errors: [{ msg: err }], status: 0 });
                        User.findByIdAndUpdate(user._id, { $set: { date: Date.now(), latitude: req.body.latitude, longitude: req.body.longitude, connection_string: req.body.token, device_type: req.body.device_type, device_id: req.body.device_id } }, (err, lg) => {
                            if (err) console.log(err);
                            if (lg) {
                                //preparation of data
                                userData = prepareUser(lg,req);
                                userData.connection_string = req.body.token;
                                res.json({
                                    user: userData,
                                    status: 1
                                })
                            };
                        });
                    });
                } else {
                    //sign up
                    let user = new User();
                    user.full_name = req.body.name;
                    user.user_name = req.body.name;
                    user.latitude = req.body.latitude;
                    user.longitude = req.body.longitude;
                    user.account_type = req.params.type;
                    user.account = req.body.account;
                    user.device_type = req.body.device_type;
                    user.device_id = req.body.device_id;
                    user.password = 'xxxxdf43';
                    user.connection_string = req.body.token;
                    let fld = 'u-' + new Date().valueOf() + '-' + Math.random().toString(36).substring(4);
                    user.folder = fld;
                    user.image = 'default.jpg';
                    user.thumb_image = fld + '.jpg';
                    let newPath = req.app.locals.dat.basePath + '/public/users/' + fld;
                    let newPath2 = req.app.locals.dat.basePath + '/public/thumb/' + fld + '.jpg';
                    console.log(newPath);
                    if (!fs.existsSync(newPath)) {
                        fs.mkdirSync(newPath);
                        fs.mkdirSync(newPath + '/posts');
                    }
                    // transfering default image and thumbnail
                    fs.createReadStream(req.app.locals.dat.basePath + '/public/img/default.jpg').pipe(fs.createWriteStream(newPath + '/default.jpg'));
                    fs.createReadStream(req.app.locals.dat.basePath + '/public/img/default_thumb.jpg').pipe(fs.createWriteStream(newPath2));
                    //hashing the password
                    if (isEmail(req.body.account))
                        user.email = req.body.account;
                    user.save((err, ur) => {

                        if (err) console.log(err);
                        if (ur) {

                            //preparation of data
                            userData = {};
                            userData._id = ur._id;
                            userData.image = `${req.app.locals.dat.domain}/users/${ur.folder}/${ur.image}`;
                            userData.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;
                            userData.full_name = ur.full_name;
                            userData.user_name = ur.user_name;
                            User.findOne({ account: req.body.account, account_type: req.params.type })
                                .exec((err, usr) => {
                                    if (err) console.log(err);
                                    if (usr) {
                                        userData._id = usr._id;
                                        userData.should_show_suggestion = usr.should_show_suggestion ? 1 : 0;
                                    }
                                    res.json({
                                        success: ' Registration successful.',
                                        user: userData,
                                        status: 1,
                                    });
                                });
                        }
                    });
                }
            });
    }
});

//logout
router.get('/logout', (req, res) => {
    //checking if the _id exists inthe request...
    req.checkBody('_id', '_id (of user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        let connStr = FUNC.makeConnectionString();
        User.findByIdAndUpdate(req.params._id, { connection_string: connStr })
            .exec((err, sucess) => {
                if (err) console.log(err);
                res.json({
                    success: `logout successfull!`,
                    status: 1
                });
            });
    }
});

module.exports = router;