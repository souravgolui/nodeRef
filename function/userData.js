const mongoose = require('mongoose');
const _ = require('underscore');
const wc = require('which-country');
const FUNC = require('./functional');

//databases
const User = require('../models/user');
const Follow = require('../models/follow');
const Post = require('../models/post');

//constant
const RADIUS = 20;


//general function to return  user's information
exports.fetchUserOther = (id, req, cb) => {
    User.findById(id)
        .exec((err, ur) => {
            if (err) console.log(err);
            if (ur) {
                dataSet = {};
                dataSet.followers = 0;
                dataSet.following = 0;
                dataSet._id = ur._id;
                dataSet.full_name = ur.full_name;
                dataSet.user_name = ur.user_name;
                dataSet.email = ur.email;
                dataSet.phone = ur.phone;
                dataSet.website = ur.website;
                dataSet.bio = ur.bio;
                dataSet.religious_afiliation = ur.religious_afiliation;
                dataSet.church_info = ur.church_info;
                dataSet.pastor = ur.pastor;
                dataSet.adderss = ur.adderss;
                dataSet.services = ur.services;
                dataSet.last_login = ur.date;
                dataSet.country = wc([ur.latitude, ur.longitude]);
                dataSet.img = `${req.app.locals.dat.domain}/users/${ur.folder}/${ur.image}`;
                dataSet.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;
                Follow.count({ target_id: mongoose.Types.ObjectId(id) }, (err, num1) => {
                    if (err) console.log(err);
                    dataSet.followers = num1;

                    Follow.count({ user_id: mongoose.Types.ObjectId(id) }, (err, num2) => {
                        if (err) console.log(err);
                        dataSet.following = num2;

                        dataSet.posts = [];
                        let idArr = [];
                        idArr.push(mongoose.Types.ObjectId(id));
                        console.log(idArr);
                        FUNC.loadPosts(idArr, id, req, (posts) => {
                           
                                posts.forEach( p => {
                                    if(p.is_private == 0)
                                        dataSet.posts.push(p);
                                });
                            cb(dataSet);
                        });

                    });
                });
            }
        });
};


//general function to return  user's information
exports.fetchUser = (id, req, cb) => {
    isOther = false;
    User.findById(id)
        .exec((err, ur) => {
            if (err) console.log(err);
            if (ur) {
                dataSet = {};
                dataSet.followers = 0;
                dataSet.following = 0;
                dataSet._id = ur._id;
                dataSet.full_name = ur.full_name;
                dataSet.user_name = ur.user_name;
                dataSet.email = ur.email;
                dataSet.phone = ur.phone;
                dataSet.website = ur.website;
                dataSet.bio = ur.bio;
                dataSet.religious_afiliation = ur.religious_afiliation;
                dataSet.church_info = ur.church_info;
                dataSet.pastor = ur.pastor;
                dataSet.adderss = ur.adderss;
                dataSet.services = ur.services;
                dataSet.last_login = ur.date;
                dataSet.country = wc([ur.latitude, ur.longitude]);
                dataSet.img = `${req.app.locals.dat.domain}/users/${ur.folder}/${ur.image}`;
                dataSet.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;
                Follow.count({ target_id: mongoose.Types.ObjectId(id) }, (err, num1) => {
                    if (err) console.log(err);
                    dataSet.followers = num1;

                    Follow.count({ user_id: mongoose.Types.ObjectId(id) }, (err, num2) => {
                        if (err) console.log(err);
                        dataSet.following = num2;

                        dataSet.posts = [];
                        let idArr = [];
                        idArr.push(mongoose.Types.ObjectId(id));
                        console.log(idArr);
                        FUNC.loadPosts(idArr, id, req, (posts) => {
                            if (isOther == false)
                                dataSet.posts = posts;
                           /*  else {
                                posts.forEach( p => {
                                    if(p.is_private == 0)
                                        dataSet.posts.push(p);
                                }); 
                            }*/
                            cb(dataSet);
                        });

                    });
                });
            }
        });
};

//general function to return user's minimal information
exports.fetchUserMin = (id, req, cb) => {
    User.findById(id)
        .exec((err, ur) => {
            if (err) console.log(err);
            if (ur) {
                dataSet = {};
                dataSet._id = ur._id;
                dataSet.user_name = ur.user_name;
                dataSet.folder = ur.folder;
                dataSet.latitude = ur.latitude;
                dataSet.longitude = ur.longitude;
                dataSet.country = wc([ur.latitude, ur.longitude]);
                dataSet.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;
                cb(dataSet);
            }
        });
};

//general function to return user's nearby people.
//might be subject to change
exports.getNearbyUserList = (latitude_val, longitude_val, req, cb) => {
    let userList = [];
    latUp = latitude_val + RADIUS;
    latDown = latitude_val - RADIUS;
    longUP = longitude_val + RADIUS;
    longDown = longitude_val - RADIUS;
    User.find({
        latitude: { $gt: latDown, $lt: latUp },
        longitude: { $gt: longDown, $lt: longUP }
    })
        .exec((err, us) => {
            if (err) console.log(err);
            us.forEach(ur => {

                let dat = {};
                dat.user_name = ur.user_name;
                dat._id = ur._id;
                dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;

                userList.push(dat);

            });

            cb(userList);

        });
}

//general function to return user's searched people.
exports.getSearchedUserList = (expr, req, cb) => {
    let userList = [];
    User.find({
        $or: [
            { full_name: { $regex: expr, $options: "i" } },
            { user_name: { $regex: expr, $options: "i" } },
        ]
    })
        .exec((err, us) => {
            if (err) console.log(err);
            us.forEach(ur => {

                let dat = {};
                dat.user_name = ur.user_name;
                dat._id = ur._id;
                dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;

                userList.push(dat);

            });
            cb(userList);

        });
}

//general function to return user's suggested people
//might be subject to change
exports.getSuggestedUserList = (id, req, cb) => {
    let userList = [];
    let knownUserList = [];
    let userID = mongoose.Types.ObjectId(id);

    Follow.find({ user_id: userID })
        .exec((err, following) => {
            if (err) console.log(err);
            following.forEach(f => {
                knownUserList.push(f.target_id);
            });
            Follow.find({ $or: [{ user_id: { $in: knownUserList } }, { target_id: { $in: knownUserList } }] })
                .populate('target_id')
                .exec((err, fx) => {
                    if (err) console.log(err);
                    //push all the following and followers of people the user is following
                    fx.forEach(f => {
                        let dat = {};
                        dat.user_name = f.target_id.user_name;
                        dat._id = f.target_id._id;
                        dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${f.target_id.thumb_image}`;
                        userList.push(dat);
                    });
                    //push nearby people
                    User.findById(id)
                        .exec((err, urx) => {
                            if (err) console.log(err);
                            latUp = urx.latitude + RADIUS;
                            latDown = urx.latitude - RADIUS;
                            longUP = urx.longitude + RADIUS;
                            longDown = urx.longitude - RADIUS;
                            //unique thumb of rhe user to remove user himself
                            //as _id is a object it will not do the trick
                            let uniqueThumb = `${req.app.locals.dat.domain}/thumb/${urx.thumb_image}`

                            User.find({
                                latitude: { $gt: latDown, $lt: latUp },
                                longitude: { $gt: longDown, $lt: longUP }
                            })
                                .exec((err, us) => {
                                    if (err) console.log(err);
                                    us.forEach(ur => {

                                        let dat = {};
                                        dat.user_name = ur.user_name;
                                        dat._id = ur._id;
                                        dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${ur.thumb_image}`;

                                        userList.push(dat);

                                    });
                                    //remove douplicates from the array of users
                                    let ulx = _.uniq(userList, _.property('thumb_image'));
                                    //remove own
                                    ulx = _.without(ulx, _.findWhere(ulx, {
                                        thumb_image: uniqueThumb
                                    }));
                                    cb(ulx);

                                });
                        });
                });
        });
}


//general function to check wheather the user exists
exports.existsUser = (id, par, res, cb) => {
    User.count({ _id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `user does not exists : ${id}`, param: par }],
                status: 0
            });
        }
    })
};

//general function to check wheather the follow exists
exports.existsFollow = (id, res, cb) => {
    Follow.count({ _id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `follow does not exists : ${id}`, param: 'follow_id' }],
                status: 0
            });
        }
    })
};
exports.assertFollowLikes = (likes, _id, req, cb) => {
    let exportLikes = [];
    let followingList = [];
    Follow.find({ user_id: mongoose.Types.ObjectId(_id) })
        .exec((err, followings) => {
            if (err) console.log(err);
            followings.forEach(f => {
                followingList.push(f.target_id.toString());
            });
            likes.forEach(lk => {
                let dat = {};
                dat.user_id = lk.user_id;
                //console.log(lk._id);
                dat.full_name = lk.full_name;
                dat.user_name = lk.user_name;
                dat.thumb_image = lk.thumb_image;
                dat.is_followed = 0;
                let n = _.contains(followingList, lk.user_id.toString());
                if (n) {

                    dat.is_followed = 1;
                }
                exportLikes.push(dat);
            });
            cb(exportLikes);
        });
};

exports.assertFollowAnswers = (answers, _id, req, cb) => {
    let exportAnswers = [];
    let followingList = [];
    Follow.find({ user_id: mongoose.Types.ObjectId(_id) })
        .exec((err, followings) => {
            if (err) console.log(err);
            followings.forEach(f => {
                followingList.push(f.target_id.toString());
            });
            answers.forEach(lk => {
                let dat = {};
                dat.user_id = lk.user_id;
                //console.log(lk._id);
                dat.full_name = lk.full_name;
                dat.user_name = lk.user_name;
                dat.thumb_image = lk.thumb_image;
                dat.is_followed = 0;
                let n = _.contains(followingList, lk.user_id.toString());
                if (n) {

                    dat.is_followed = 1;
                }
                exportAnswers.push(dat);
            });
            cb(exportAnswers);
        });
};

//general function to check wheather the following person exists
exports.existsFollowingPerson = (id, res, cb) => {
    Follow.count({ target_id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `following person does not exists : ${id}`, param: '_id' }],
                status: 0
            });
        }
    })
};
//general function to check wheather the follower person exists
exports.existsFollowerPerson = (id, res, cb) => {
    Follow.count({ user_id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `follower person does not exists : ${id}`, param: '_id' }],
                status: 0
            });
        }
    })
};

//conditional call if follow exists which pass a boolean in the callback
exports.followExists = (userID, targetID, cb) => {

    Follow.count({ user_id: mongoose.Types.ObjectId(userID), target_id: mongoose.Types.ObjectId(targetID) }, (err, num) => {
        if (err) console.log(err);
        if (num > 0)
            cb(true);
        else {
            cb(false);
        }
    })
};




