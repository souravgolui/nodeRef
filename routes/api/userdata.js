//module imports
const express = require('express');
const mongoose = require('mongoose');
const UD = require('../../function/userData');

const router = express.Router();

//databases
const User = require('../../models/user');
const Follow = require('../../models/follow');

//route authentication
const auth = require('../../function/authenticate');
//router.use(auth.kick);

//------------------------routes associated with  suggestion----------------------------------------------------
//route to return nearby people
router.post('/nearby', (req, res) => {
    req.checkBody('latitude', 'latitude is required!').notEmpty();
    req.checkBody('longitude', 'longitude is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.getNearbyUserList(req.body.latitude, req.body.longitude, req, (dat) => {
            res.json({
                user_list: dat,
                status: 1
            });
        })
    };
});

//route to return suggested people
router.post('/suggestion', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body._id, '_id', res, ()=> {
            UD.getSuggestedUserList(req.body._id, req, (dat) => {
                res.json({
                    user_list: dat,
                    status: 1
                });
            });
        });
    };
});

//stop request for showing suggestion list
router.post('/stop_suggestion', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body._id, '_id', res, ()=> {
            User.findByIdAndUpdate(req.body._id, {$set: {should_show_suggestion : false}});
            res.json({
                success : 'stopped showing suggestion',
                status : 1
            });
        });
    };
});

//route to return searched people
router.post('/search', (req, res) => {
    req.checkBody('text', 'text (any expression) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
            UD.getSearchedUserList(req.body.text, req, (dat) => {
                res.json({
                    user_list: dat,
                    status: 1
                });
            });
    };
});

//----------------------------------------------------------------------------------------------------------------
//-----------------------------routes associated with following --------------------------------------------------

//route to follow the target person
router.post('/follow', (req, res) => {
    req.checkBody('user_id', 'user_id (your) is required!').notEmpty();
    req.checkBody('target_id', 'terget_id (the person you want to follow ) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body.target_id, 'target_id', res, () => {
            UD.followExists(req.body.user_id, req.body.target_id, (condition) => {
                //if not following then follow
                if (!condition) {
                    let follow = new Follow();
                    follow.user_id = mongoose.Types.ObjectId(req.body.user_id);
                    follow.target_id = mongoose.Types.ObjectId(req.body.target_id);

                    follow.save((err, dat) => {
                        if (err) console.log(user);
                        if (dat) {
                            User.findOneAndUpdate(req.body.user_id, {$set : {should_show_suggestion : false}})
                            .exec((err, spx) => {
                                if(err) console.log(err);
                                res.json({
                                    _id: dat._id,
                                    success: `${req.body.user_id} followed ${req.body.target_id} successfully`,
                                    status: 1
                                });
                            });
                        }
                    });
                } else { //if following then unfollow
                    Follow.remove({ user_id: mongoose.Types.ObjectId(req.body.user_id), target_id: mongoose.Types.ObjectId(req.body.target_id) })
                        .exec((err, f1) => {
                            if (err) console.log(err);
                            if (f1) {
                                Follow.update({ target_id: mongoose.Types.ObjectId(req.body.user_id), user_id: mongoose.Types.ObjectId(req.body.target_id) }, { $set: { mode: 0 } })
                                    .exec((err, f2) => {
                                        if (err) console.log(err);
                                        res.json({
                                            success: `${req.body.user_id} unfollowed ${req.body.target_id} successfully`,
                                            status: 1
                                        });
                                    });
                            }
                        })
                }
            });
        });
    }
});

//route to follow back if someone is already following the user
router.post('/followback', (req, res) => {
    req.checkBody('follow_id', 'follow_id is required!').notEmpty(); // _id represents the Id of the follow 
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsFollow(req.body.follow_id, res, () => {

            Follow.findById(req.body.follow_id)
                .exec((err, fx) => {
                    if (err) console.log(err);
                    if (fx.mode == 0) {// if not following back
                        Follow.findByIdAndUpdate(req.body.follow_id, { $set: { mode: 1 } })//set followback marker
                            .exec((err, f) => {
                                if (err) console.log(user);
                                if (f) {
                                    // register the new follow which is reverse to the previous one
                                    let fol = new Follow();
                                    fol.user_id = f.target_id;
                                    fol.target_id = f.user_id;
                                    fol.mode = 1;
                                    fol.save((err, dat) => {
                                        if(err) console.log(err);
                                        res.json({
                                            success: `${f.target_id} followed back ${f.user_id} successfully`,
                                            status: 1
                                        });
                                    });
                                }
                            });
                    } else {//if following back
                        Follow.findByIdAndUpdate(req.body.follow_id, { $set: { mode: 0 } }) // change followback marker
                            .exec((err, f) => {
                                if (err) console.log(user);
                                if (f) {
                                    Follow.remove({user_id: f.target_id, target_id: f.user_id}) // remove reverse following 
                                    .exec((err, dat) => {
                                        if (err) console.log(err);
                                        res.json({
                                            success: `${f.target_id} stopped following back ${f.user_id} successfully`,
                                            status: 1
                                        });
                                    });
                                }
                            });
                    }
                })
        });
    }
});

//route to return the follower list
router.post('/followers', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty(); // id represents the target person
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        let followers = [];
        UD.existsFollowingPerson(req.body._id, res, () => {
            let id = mongoose.Types.ObjectId(req.body._id);
            Follow.find({ target_id: id })
                .populate('user_id')
                .exec((err, dat) => {
                    if (err) console.log(err);
                    if (dat) {

                        dat.forEach(elem => {
                            let temp = {};
                            temp.follow_id = elem._id;
                            temp.person = {};

                            temp.person._id = elem.user_id._id;
                            temp.person.user_name = elem.user_id.user_name;
                            temp.person.full_name = elem.user_id.full_name;
                            temp.person.thumb_image = `${req.app.locals.dat.domain}/thumb/${elem.user_id.thumb_image}`;
                            temp.is_following_back = elem.mode;
                            followers.push(temp);
                        });
                        res.json({
                            followers: followers,
                            status: 1
                        });
                    }
                });
        });

    }
});

//route to return the following people list
router.post('/following', (req, res) => {
    req.checkBody('_id', '_id (of the user) is required!').notEmpty(); // _id represents the user's id
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        let following = [];
        UD.existsFollowerPerson(req.body._id, res, () => {
            let id = mongoose.Types.ObjectId(req.body._id);
            Follow.find({ user_id: id })
                .populate('target_id')
                .exec((err, dat) => {
                    if (err) console.log(err);
                    if (dat) {
                        dat.forEach(elem => {
                            let temp = {};
                            temp.follow_id = elem._id;
                            temp.person = {};
                            temp.person._id = elem.target_id._id;
                            temp.person.user_name = elem.target_id.user_name;
                            temp.person.full_name = elem.target_id.full_name;
                            temp.person.thumb_image = `${req.app.locals.dat.domain}/thumb/${elem.target_id.thumb_image}`;
                            temp.is_following_back = elem.mode;
                            following.push(temp);
                        });
                        res.json({
                            following: following,
                            status: 1
                        });
                    }
                });
        });

    }
});
//----------------------------------------------------------------------------------------------------------------------------



module.exports = router;