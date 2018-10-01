const mongoose = require('mongoose');
const _ = require('underscore');
const async = require('async');
//databases
const Post = require('../models/post');
const Follow = require('../models/follow');
const Comment = require('../models/comment');
const Story = require('../models/story');

const UD = require('./userData');

//creationg random name for images
exports.randomName = () => {
    return ('media-' + new Date().valueOf() + '-' + Math.random().toString(36).substring(4));
}
exports.makeConnectionString = () => {
    let str = Math.random().toString(36).substring(4);
    return str.toLowerCase();
};
//creating img_collection field so that the image storage and the post route can user this 
//to save the names of the images or videos.
exports.postPrepare = (req, res, next) => {

    req.img_collection = [];
    //for alternative address to postprocess image
    req.img_collection2 = [];
    //for video processing
    req.img_collection3 = [];
    return next();
}
//post preparation function
function formatPost(post, req, sendingUserId) {
    let layout = {};
    layout.post_id = post._id;
    layout.interval = calculateInterval(post.date);
    layout.date = post.date;
    layout.is_private = post.is_private ? 1 : 0;
    layout.author = {};
    layout.author.user_id = post.user_id._id;
    layout.author.user_name = post.user_id.user_name;
    layout.can_comment = post.user_id.can_comment ? 1 : 0;
    layout.author.img = `${req.app.locals.dat.domain}/thumb/${post.user_id.thumb_image}`;
    layout.data = {};
    layout.data.file_array = [];
    layout.data.is_caption_only = post.is_text_only ? 1 : 0;
    if (!post.is_text_only)
        post.file_array.forEach(fl => {
            let temp = { image: fl };
            layout.data.file_array.push(temp);
        });
    layout.data.file_type = post.file_type;
    layout.data.file_count = post.file_count;
    layout.data.location = post.location;
    layout.data.caption = post.caption;
    layout.data.catagory = post.catagory;
    //like loading...
    layout.likes = {};
    layout.likes.isLiked = 0;
    layout.likes.count = post.likes.length;
     post.likes.forEach(lk => {
        if (lk._id.equals(sendingUserId))
            layout.likes.isLiked = 1;
    });
    //answer loading...
    layout.answers = {};
    layout.answers.isAnswered = 0;
    layout.answers.count = post.answers.length;
    post.answers.forEach(lk => {
        if (lk._id.equals(sendingUserId))
            layout.answers.isAnswered = 1;
    });
    return layout;
}

function comparePosts(post) {
    let credit = 0;

    credit += post.likes.length * post.likes.length / 1000;
    let timeValue = new Date(post.date), now = new Date();
    timeValue = (now.getTime() - timeValue.getTime()) / (1000 * 3600 * 12);
    if (timeValue < 1) {
        credit = post.date.getTime() + (credit / (timeValue + 0.1)) * 100;
    } else {
        credit = post.date.getTime();
    }
    return -credit;
}

//logical castomization of posts
function castomizePosts(posts) {
    let finalPosts = _.sortBy(posts, comparePosts);
    return finalPosts;
};

//checking if the post actually exists
exports.postExists = (id, res, cb) => {
    Post.count({ _id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `post does not exists : ${id}`, param: 'post_id' }],
                status: 0
            });
        }
    })
};

//conditional call if like exists which pass a boolean in the callback
exports.postLikeExists = (_id, user_id, cb) => {
    Post.findById(_id)
        .exec((err, post) => {
            if (err) console.log(err);
            if (post) {
                let user = mongoose.Types.ObjectId(user_id);
                let likes = [];
                //preparing the likes
                post.likes.forEach(l => {
                    likes.push(l.toString());
                });
                cb(_.contains(likes, user.toString()));
            }
        });
};
//conditional call if answer exists which pass a boolean in the callback
exports.postAnswerExists = (_id, user_id, cb) => {
    Post.findById(_id)
        .exec((err, post) => {
            if (err) console.log(err);
            if (post) {
                let user = mongoose.Types.ObjectId(user_id);
                let answers = [];
                //preparing the likes
                post.answers.forEach(a => {
                    answers.push(a.toString());
                });
                cb(_.contains(answers, user.toString()));
            }
        });
};


//checking if the story actually exists
exports.storyExists = (id, res, cb) => {
    Story.count({ _id: mongoose.Types.ObjectId(id) }, (err, num) => {
        if (err)
            res.json({
                errors: [{ msg: err }],
                status: 0
            });
        if (num > 0)
            cb();
        else {
            res.json({
                errors: [{ msg: `story does not exists : ${id}`, param: 'story_id' }],
                status: 0
            });
        }
    })
};






function calculateInterval(timestamp) {
    let dateTime = new Date(timestamp);
    let now = new Date();
    let millisecDifferance = now.getTime() - dateTime.getTime();
    let diff = new Date(millisecDifferance);
    let days = Math.floor(millisecDifferance / 1000 / 60 / (60 * 24));
    let years = Math.floor(millisecDifferance / 1000 / 60 / (60 * 24 * 365));
    let hrs = Math.floor(diff.getUTCHours());
    let mins = Math.floor(diff.getUTCMinutes());
    if (years > 1)
        return `${years} years ago`;
    else if (years == 1)
        return `1 year ago`;
    else if (days > 1)
        return `${days} days ago`;
    else if (days == 1)
        return `1 day ago`;
    else if (hrs > 1)
        return `${hrs} hours ago`;
    else if (hrs == 1)
        return `1 hour ago`;
    else if (mins > 1)
        return `${mins} minutes ago`;
    else if (mins == 1)
        return `1 minute ago`;
    else
        return `just now`;
}

//callback for loading post array
//subject to change
exports.loadPosts = (objectIdArrayOfUser, sendingUserId, req, cb) => {
    //console.log(objectIdArrayOfUser);
    //let postList = [];
    let FinalPostList = [];
    Post.find({ user_id: objectIdArrayOfUser })
        .sort({ date: -1 })
        .populate('user_id likes')
        .exec((err, posts) => {
            if (err) console.log(err);
            /* posts.forEach(post => {
                let layout = formatPost(post, req, sendingUserId);
                postList.push(layout);
            }); */
            //postList = _.sortBy(postList, function (o) { let dt = new Date(o.date); return -dt; });
            //cb(postList);
            async.each(posts, (post, callback) => {
                let temp = formatPost(post, req, sendingUserId);;
                Comment.find({ post_id: post._id })
                    .populate('user_id')
                    .sort({ date: -1 })
                    .exec((err, comments) => {
                        if (err) console.log(err);
                        //let commentList = [];
                        /*//preparing each comment
                                     comments.forEach(c => {        
                                         let cmt = {};
                                         cmt.comment_id = c._id;
                                         cmt.user_name = c.user_id.user_name;
                                         cmt.thumb = `${req.app.locals.dat.domain}/thumb/${c.user_id.thumb_image}`;
                                         cmt.text = c.text;
                                         commentList.push(cmt);
                                     }); */
                        temp.comment_count = comments.length;
                        //console.log(temp);
                        FinalPostList.push(temp);
                        FinalPostList = _.sortBy(FinalPostList, (p) => {
                            return -p.date.getTime();
                        });
                        callback();
                    });
            }, (err) => {
                if (err)
                    console.log(err);
                else {
                    cb(FinalPostList);
                }
            });
        });

};

//catagorywise relative posts
exports.loadRelatedPosts = (post_id, req, cb) => {
    let postList = [];
    let FinalPostList = [];
    Post.findById(post_id)
        .populate('user_id likes')
        .exec((err, special) => {
            if (err) console.log(err);
            Post.find({ catagory: special.catagory })
                .sort({ date: -1 })
                .populate('user_id likes')
                .exec((err, posts) => {
                    if (err) console.log(err);
                    //postList = _.sortBy(postList, function (o) { let dt = new Date(o.date); return -dt; });
                    //cb(postList);
                    async.each(posts, (post, callback) => {
                        let temp = formatPost(post, req, post.user_id);
                        Comment.find({ post_id: post.post_id })
                            .populate('user_id')
                            .sort({ date: -1 })
                            .exec((err, comments) => {
                                if (err) console.log(err);
                                //let commentList = [];
                                /*//preparing each comment
                                             comments.forEach(c => {        
                                                 let cmt = {};
                                                 cmt.comment_id = c._id;
                                                 cmt.user_name = c.user_id.user_name;
                                                 cmt.thumb = `${req.app.locals.dat.domain}/thumb/${c.user_id.thumb_image}`;
                                                 cmt.text = c.text;
                                                 commentList.push(cmt);
                                             }); */
                                temp.comment_count = comments.length;
                                //console.log(temp);
                                FinalPostList.push(temp);

                                callback();
                            });
                    }, (err) => {
                        if (err)
                            console.log(err);
                        else {
                            FinalPostList = _.reject(FinalPostList, (p) => {
                                if (p.post_id.equals(special._id))
                                    return true;
                                return false;
                            });
                            let firstEntry = formatPost(special, req, special._id);
                            FinalPostList = _.sortBy(FinalPostList, comparePosts);
                            //let firstTemplate = firstEntry;
                            Comment.find({ post_id: firstEntry.post_id })
                                .populate('user_id')
                                .exec((err, comments) => {
                                    if (err) console.log(err);
                                    firstEntry.comment_count = comments.length;
                                    FinalPostList.unshift(firstEntry);
                                    cb(FinalPostList);
                                })
                        }
                    });
                });
        });
};

//callback for loading trending post array
//subject to change
exports.trendingPosts = (sendingUserId, req, cb) => {
    let postList = [];
    Post.find({})
        .sort({ date: -1 })
        .populate('user_id likes')
        .exec((err, posts) => {
            if (err) console.log(err);
            //attaching all the comments to the post
            async.each(posts, (post, callback) => {
                let layout = {};
                layout.post_id = post._id;
                layout.interval = calculateInterval(post.date);
                layout.date = post.date;
                layout.is_private = post.is_private ? 1 : 0;
                layout.author = {};
                layout.author.user_id = post.user_id._id;
                layout.author.user_name = post.user_id.user_name;
                layout.can_comment = post.user_id.can_comment ? 1 : 0;
                layout.author.img = `${req.app.locals.dat.domain}/thumb/${post.user_id.thumb_image}`;
                layout.data = {};
                layout.data.file_array = [];
                layout.data.is_caption_only = post.is_text_only ? 1 : 0;
                if (!post.is_text_only)
                    post.file_array.forEach(fl => {
                        let temp = { image: fl };
                        layout.data.file_array.push(temp);
                    });
                layout.data.file_type = post.file_type;
                layout.data.file_count = post.file_count;
                layout.data.location = post.location;
                layout.data.caption = post.caption;
                layout.data.catagory = post.catagory;
                //like loading...
                layout.likes = {};
                layout.likes.count = post.likes.length;
                //layout.likes.users = [];
                layout.likes.isLiked = 0;
                post.likes.forEach(lk => {
                    if (lk._id.equals(sendingUserId))
                        layout.likes.isLiked = 1;
                });
                //answer loading
                layout.answers = {};
                layout.answers.count = post.answers.length;
                layout.answers.isAnswered = 0;
                 post.answers.forEach(lk => {
                    if (lk._id.equals(sendingUserId))
                        layout.answers.isAnswered = 1; 
                });
                if (post.is_text_only == false)
                    postList.push(layout);
                callback();

            }, (err) => {
                if (err)
                    console.log(err);
                else {
                    postList = _.sortBy(postList, function (o) { let dt = new Date(o.date); return -dt; })
                    cb(postList);
                }
            });
        });
};

//load likes for the post
exports.loadLikes = (post_id, sendingUserId, req, cb) => {
    Post.findById(post_id)
        .populate('likes')
        .exec((err, post) => {
            if (err) console.log(err);
            let likeArray = [];
            post.likes.forEach(lk => {
                //console.log(lk);
                let dat = {};
                dat.user_id = lk._id;
                /* if (lk._id.equals(sendingUserId))
                    dat.isLiked = 1; */
                dat.full_name = lk.full_name;
                dat.user_name = lk.user_name;
                dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${lk.thumb_image}`;
                likeArray.push(dat);
            });
            UD.assertFollowLikes(likeArray, sendingUserId, req, (likelist) => {
                cb(likelist);
            });
        });
}

//load answers for the post
exports.loadAnswers = (post_id, sendingUserId, req, cb) => {
    Post.findById(post_id)
        .populate('answers')
        .exec((err, post) => {
            if (err) console.log(err);
            let answerArray = [];
            post.answers.forEach(ans => {
                //console.log(lk);
                let dat = {};
                dat.user_id = ans._id;
                /* if (lk._id.equals(sendingUserId))
                    dat.isLiked = 1; */
                dat.full_name = ans.full_name;
                dat.user_name = ans.user_name;
                dat.thumb_image = `${req.app.locals.dat.domain}/thumb/${ans.thumb_image}`;
                answerArray.push(dat);
            });
            UD.assertFollowAnswers(answerArray, sendingUserId, req, (answerList) => {
                cb(answerList);
            });
        });
}
//load comments for the post
exports.loadComments = (post_id, sendingUserId, req, cb) => {
    Comment.find({ post_id: post_id })
        .populate('user_id')
        .exec((err, comments) => {
            if (err) console.log(err);
            let commentList = [];
            //preparing each comment
            comments.forEach(c => {
                let cmt = {};
                cmt.comment_id = c._id;
                cmt.date = c.date;
                cmt.user_id = c.user_id._id;
                cmt.user_name = c.user_id.user_name;
                cmt.thumb = `${req.app.locals.dat.domain}/thumb/${c.user_id.thumb_image}`;
                cmt.interval = calculateInterval(c.date);
                cmt.text = c.text;
                commentList.push(cmt);
            });
            Post.findById(post_id)
                .exec((err, p) => {
                    if (err) console.log(err);
                    //console.log(p.caption);
                    if (commentList.length > 0)
                        commentList[0].caption = p.caption;

                    if (p.caption)
                        cb(commentList, p.caption);
                    else
                        cb(commentList, '');
                });
        })
}


//loading stories
exports.loadStories = (objectIdArrayOfUser, req, cb) => {
    let postList = [];
    Story.find({ user_id: objectIdArrayOfUser })
        .sort({ date: -1 })
        .populate('user_id likes')
        .exec((err, posts) => {
            if (err) console.log(err);
            posts.forEach(post => {
                let layout = {};
                layout.post_id = post._id;
                layout.interval = calculateInterval(post.date);
                layout.date = post.date;
                layout.author = {};
                layout.author.user_id = post.user_id._id;
                layout.author.user_name = post.user_id.user_name;
                layout.author.img = `${req.app.locals.dat.domain}/thumb/${post.user_id.thumb_image}`;
                layout.data = {};
                layout.data.file_array = [];
                post.file_array.forEach(fl => {
                    let temp = { image: fl };
                    layout.data.file_array.push(temp);
                });
                layout.data.file_type = post.file_type;
                layout.data.file_count = post.file_count;
                /* //like loading...
                layout.likes = {};
                layout.likes.isLiked = 0;
                layout.likes.count = post.likes.length;
                post.likes.forEach(lk => {
                    if (lk._id.equals(sendingUserId))
                        layout.likes.isLiked = 1;
                }); */

                postList.push(layout);
            });
            postList = _.sortBy(postList, function (o) { let dt = new Date(o.date); return -dt; });
            cb(postList);
        });
};


//general function to load related user ids
function relatives(id, cb) {
    let objectIdArray = [];
    let ID = mongoose.Types.ObjectId(id);
    //pushing own id
    objectIdArray.push(ID);
    Follow.find({ user_id: ID })
        .exec((err, followList) => {
            if (err) console.log(err);
            followList.forEach(f => {
                objectIdArray.push(f.target_id);
            });
            cb(objectIdArray);
        });
};
exports.getRelativeObjectIdArray = relatives;

exports.pushMsg = (userIdArr, title, msg, cb) => {
    let deviceArray = [];
    async.each(userIdArr, (userId, callback) => {
        User.findById(userId)
        .exec((err, user) => {
            if(err) console.log(err);
            let device = {
                id : user.device_id,
                type : user.device_type
            };
            deviceArray.push(device);
        });
    }, (err) => {
        if(err) console.log(err);
        else{





            cb();
        }
    });
};