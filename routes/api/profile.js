//importing the modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const UD = require('../../function/userData');
const multer = require('multer');
const jimp = require('jimp');
const saltRounds = 10;

const router = express.Router();

//databases
const User = require('../../models/user');
const Post = require('../../models/post');
const Follow = require('../../models/follow');

//route authentication
const auth = require('../../function/authenticate');
//router.use(auth.kick);

//--------------------------------multer storage defination----------------------------------
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        console
        UD.fetchUserMin(req.body._id, req, (dataSet) => {
            console.log()
            req.body.folder = dataSet.folder;
            cb(null, `./public/users/${dataSet.folder}`);
        })
    },
    filename: (req, file, cb) => {

        req.body.ext = path.extname(file.originalname);
        console.log(req.body);
        let nameFile = req.body._id + path.extname(file.originalname);
        console.log(nameFile);
        cb(null, nameFile);
    }
});
//image storage instance of multer
const imageUpload = multer({
    storage: imageStorage
}).single('image');
//-------------------------------------------------------------------------------------------------
//-------------------------routes associated with information----------------------------------------

//route to get all the profile information
router.post('/', (req, res) => {
    req.checkBody('_id', '_id (of user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body._id, '_id', res, () => {
            UD.fetchUser(req.body._id, req, (data) => {
                Post.count({ user_id: mongoose.Types.ObjectId(req.body._id) }, (err, num) => {
                    if (err) console.log(err);
                    data.post_count = num;

                    res.json({
                        user_info: data,
                        status: 1
                    });
                });
            })
        });
    }
});

//api to form fillup info
router.post('/info', (req, res) => {
    req.checkBody('_id', '_id (of user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body._id, '_id', res, () => {
            UD.fetchUser(req.body._id, req, (data) => {
                //preparing the data for the filling form
                let dataSet = {};
                dataSet._id = data._id;
                dataSet.full_name = data.full_name;
                dataSet.user_name = data.user_name;
                dataSet.email = data.email;
                dataSet.phone = data.phone;
                dataSet.website = data.website;
                dataSet.bio = data.bio;
                dataSet.religious_afiliation = data.religious_afiliation;
                dataSet.church_info = data.church_info;
                dataSet.pastor = data.pastor;
                dataSet.adderss = data.adderss;
                dataSet.services = data.services;
                dataSet.country = data.country;
                dataSet.thumb_image = data.thumb_image;
                res.json({
                    user_info: dataSet,
                    status: 1
                })
            })
        });
    }
});

//api to get information of other person's profile
router.post('/other', (req, res) => {
    req.checkBody('_id', '_id (of user) is required!').notEmpty();
    req.checkBody('target_id', '_id (of the person you want to see)  is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body.target_id, 'target_id', res, () => {
            UD.fetchUserOther(req.body.target_id, req, (data) => {
                Post.count({ user_id: mongoose.Types.ObjectId(req.body.target_id) }, (err, num) => {
                    if (err) console.log(err);
                    data.post_count = num;

                    UD.followExists(req.body._id, req.body.target_id, (flag) => {
                        res.json({
                            user_info: data,
                            following: flag ? 1 : 0, // 1 : following, 0: not following 
                            status: 1
                        })
                    });
                });
            })
        });
    }
});

router.post('/can_comment', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    req.checkBody('state', 'state is required!(set 0 to stop commenting)').isNumeric();
    //assigning validation errors
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //checking if user do exist
        UD.existsUser(req.body._id, '_id', res, () => {
            let flag = true;
            if (req.body.state == 0)
                flag = false;
            User.findByIdAndUpdate(req.body._id, { $set: { can_comment: flag } })
                .exec((err, ux) => {
                    if (err) console.log(err);
                    res.json({
                        success: `${req.body._id}'s can_comment is set to ${flag}`,
                        status: 1
                    });
                });
        });
    }
});
router.post('/can_comment/status', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        User.findById(req.body._id)
            .exec((err, usr) => {
                if (err) console.log(err);
                let flag = usr.can_comment ? 1 : 0;
                res.json({
                    can_comment: flag,
                    status: 1
                })
            });
    }
})

//-------------------------routes associated with data alteration --------------------------------------
//route to update profile information
router.post('/update', (req, res) => {
    //checking for having a nonempty _id for the user
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    req.checkBody('full_name', 'full_name is required!').exists();
    req.checkBody('user_name', 'user_name is required!').exists();
    req.checkBody('website', 'website is required!').exists();
    req.checkBody('bio', 'bio is required!').exists();
    req.checkBody('phone', 'phone is required!').exists();
    req.checkBody('religious_affiliation', 'religious_affiliation is required!').exists();
    req.checkBody('church_info', 'church_info is required!').exists();
    req.checkBody('pastor', 'pastor is required!').exists();
    req.checkBody('address', 'address is required!').exists();
    req.checkBody('services', 'services is required!').exists();
    //assigning validation errors
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //checking if user do exist
        UD.existsUser(req.body._id, '_id', res, () => {
            //finally update the user information
            User.findByIdAndUpdate(req.body._id, {
                $set: {
                    full_name: req.body.full_name,
                    user_name: req.body.user_name,
                    website: req.body.website,
                    bio: req.body.bio,
                    phone: req.body.phone,
                    religious_affiliation: req.body.religious_affiliation,
                    church_info: req.body.church_info,
                    pastor: req.body.pastor,
                    address: req.body.address,
                    services: req.body.services,
                }
            })
                .exec((err, ur) => {
                    if (err) console.log(err);
                    if (ur) {
                        res.json({
                            success: `updated info successfully of user : ${req.body._id}`,
                            status: 1
                        })
                    }
                });
        });
    }
});

//proflie change password
router.post('/update_password', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    req.checkBody('password', 'password is required!').notEmpty();
    req.checkBody('password_new', 'password_new is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body._id, '_id', res, () => {
            User.findById(req.body._id, (err, user) => {
                if (err) res.json({ errors: [{ msg: err }], status: 0 });
                if (user) {
                    //comparing the hashed password
                    bcrypt.compare(password, user.password, (err, result) => {
                        if (err) throw err;
                        if (result) {
                            console.log('password matched!');
                            let newPassword = req.body.password_new;
                            bcrypt.genSalt(saltRounds, function (err, salt) {
                                bcrypt.hash(newPassword, salt, function (err, hash) {
                                    if (err) console.log(err);
                                    User.findByIdAndUpdate(user._id, { $set: { date: Date.now(), password: hash } })
                                        .exec((err, lg) => {
                                            if (err) console.log(err);
                                            if (lg) {
                                                //preparation of data
                                                userData = {};
                                                userData.image = `${req.app.locals.dat.domain}/users/${lg.folder}/${lg.image}`;
                                                userData.thumb_image = `${req.app.locals.dat.domain}/thumb/${lg.thumb_image}`;
                                                userData.full_name = lg.full_name;
                                                userData.last_login = lg.date;
                                                res.json({
                                                    success: `password updateded successfully : ${lg._id}`,
                                                    user: userData,
                                                    status: 1
                                                })
                                            };

                                        });
                                });
                            });
                        }
                        else {
                            console.log('wrong password!');
                            res.json({ errors: [{ msg: 'wrong password!', param: 'password' }], status: 0 });
                        }
                    });
                }
                else {
                    console.log('wrong email address!');
                    res.json({ errors: [{ msg: 'wrong _id', param: '_id' }], status: 0 });
                }
            })
        });
    }

})


//profile image upload route
router.post('/update_image', imageUpload, (req, res) => {
    //checking for having a nonempty _id for the user
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        errors.push({ msg: 'image is needed', param: 'image' });
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //checking if user do exist
        UD.existsUser(req.body._id, '_id', res, () => {

            const img = req.body._id + req.body.ext;
            console.log(img);
            User.findByIdAndUpdate(req.body._id, { $set: { image: img, thumb_image: `${req.body.folder}${req.body.ext}` } })
                .exec((err, user) => {
                    if (err) console.log(err);
                    if (user) {
                        //thumbnail image processing
                        jimp.read(`${req.app.locals.dat.basePath}/public/users/${user.folder}/${img}`, function (err, lenna) {
                            if (err) throw err;
                            if (lenna.bitmap.height > lenna.bitmap.width) {
                                lenna.resize(125, jimp.AUTO)            // resize
                                    .quality(100)                 // set JPEG quality.crop(0 ,0 ,125,125)
                                    .crop(0, 0, 125, 125)
                                    .write(`${req.app.locals.dat.basePath}/public/thumb/${user.folder}${req.body.ext}`); // save 
                            } else {
                                lenna.resize(jimp.AUTO,125)            // resize
                                    .quality(100)                 // set JPEG quality.crop(0 ,0 ,125,125)
                                    .crop(0, 0, 125, 125)
                                    .write(`${req.app.locals.dat.basePath}/public/thumb/${user.folder}${req.body.ext}`); // save 
                            }
                        });
                        res.json({
                            success: `updated image successfully of user : ${req.body._id}`,
                            status: 1
                        })
                    }
                });
        });
    }
});
//--------------------------------------------------------------------------------------------------------------------------

module.exports = router;