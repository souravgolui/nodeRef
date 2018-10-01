//importing the modules
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const _ = require('underscore');
const async = require('async');

const UD = require('../../function/userData');
const FUNC = require('../../function/functional');
const jimp = require('jimp');

const router = express.Router();

//databases
const User = require('../../models/user');
const Follow = require('../../models/follow');
const Post = require('../../models/post');
const Comment = require('../../models/comment');
const Story = require('../../models/story');

//route authentication
const auth = require('../../function/authenticate');
//router.use(auth.kick);
//story clean up
router.use(auth.storyCleanup);

//-----------------------------multer storage defination-------------------------------------
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        UD.fetchUserMin(req.body.user_id, req, (dataSet) => {
            //console.log(req.body.user_id);
            req.body.folder = dataSet.folder;
            cb(null, `./public/users/${dataSet.folder}/posts`);
        })
    },
    filename: (req, file, cb) => {
        let nameFile = FUNC.randomName() + path.extname(file.originalname);
        //pushing the path to the iamge array
        req.img_collection.push(`${req.app.locals.dat.domain}/users/${req.body.folder}/posts/${nameFile}`);
        req.img_collection2.push(`public/users/${req.body.folder}/posts/${nameFile}`);
        //console.log(nameFile);
        cb(null, nameFile);
    }
});
//-----------------------------------------------------------------------------------------------
//-------------------------------routes associated with post-------------------------------------

//api route for posting a post
//might be subject to change
router.post('/',
    FUNC.postPrepare,
    multer({
        storage: imageStorage
    }).array('file_array', 10),
    (req, res) => {
        //console.log('post call');
        //checking for the existance of the fields
        req.checkBody('user_id', 'user_id is required!').notEmpty();
        req.checkBody('file_count', 'file_number is required!').notEmpty();
        req.checkBody('file_type', 'file_type is required!').notEmpty();
        req.checkBody('location', 'location(can be a blank string) is required!').exists();
        req.checkBody('caption', 'caption(can be a blank string) is required!').exists();
        req.checkBody('catagory', 'catagory(can be a blank string) is required!').exists();
        req.checkBody('is_private', 'is_private is required!').exists();
        let errors = req.validationErrors();
        if (errors) {
            console.log(errors);
            errors.push({ msg: 'file_array is required!', param: 'file_array' });
            res.json({ errors: errors, status: 0 }); // status 0 means that there is error
        } else {
            //checking if user do exist
            UD.existsUser(req.body.user_id, 'user_id', res, () => {
                if (req.body.file_type == 'image') {
                    if (req.body.file_count == req.img_collection.length) {

                        //processing uploaded images
                        async.each(req.img_collection2, (image, callback) => {
                            jimp.read(image, function (err, lenna) {
                                if (err) throw err;
                                lenna
                                    .resize(680, jimp.AUTO)
                                    .quality(90)                 // set JPEG quality
                                    .write(image); // save
                            });
                            //console.log(`processing...`);
                            callback();
                        }, (err) => {
                            if (err)
                                console.log(err);
                            else {
                                //creationg the new post
                                let post = new Post();
                                post.user_id = mongoose.Types.ObjectId(req.body.user_id);
                                post.file_count = req.body.file_count;
                                post.is_text_only = false;
                                post.file_array = req.img_collection; // comes from FUNC.postPreparation
                                post.file_type = req.body.file_type;
                                post.location = req.body.location;
                                post.caption = req.body.caption;
                                post.date = new Date();
                                post.is_private = req.body.is_private == 1 ? true : false;
                                if (req.body.catagory && req.body.catagory != undefined)
                                    post.catagory = req.body.catagory;
                                post.save((err, p) => {
                                    if (err) console.log(err);
                                    if (p) {
                                        res.json({
                                            post_summary: p,
                                            status: 1
                                        })
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({
                            errors: [{ msg: ' file_count is wrong', param: 'file_count' }],
                            status: 0
                        });
                    }
                }
                else if (req.body.file_type == 'video') {
                    if (req.body.file_count == 1) {
                        //video thumbnail extraction
                        //creating the new post
                        let post = new Post();
                        post.user_id = mongoose.Types.ObjectId(req.body.user_id);
                        post.file_count = req.body.file_count;
                        post.is_text_only = false;
                        post.file_array = req.img_collection; // comes from FUNC.postPreparation
                        post.file_type = req.body.file_type;
                        post.location = req.body.location;
                        post.caption = req.body.caption;
                        post.date = Date.now();
                        post.is_private = req.body.is_private == 1 ? true : false;
                        if (req.body.catagory && req.body.catagory != undefined)
                            post.catagory = req.body.catagory;
                        post.save((err, p) => {
                            if (err) console.log(err);
                            if (p) {
                                res.json({
                                    post_summary: p,
                                    status: 1
                                })
                            }
                        });
                    } else {
                        res.json({
                            errors: [{ msg: 'in case of video file_count must be 1', param: 'file_count' }],
                            status: 0
                        });
                    }
                } else if (req.body.file_type == 'nodata') {
                    let post = new Post();
                    post.user_id = mongoose.Types.ObjectId(req.body.user_id);
                    post.file_count = req.body.file_count;
                    post.is_text_only = true;
                    //post.file_array = req.img_collection; // comes from FUNC.postPreparation
                    post.file_type = req.body.file_type;
                    post.location = req.body.location;
                    post.caption = req.body.caption;
                    post.date = Date.now();
                    post.is_private = req.body.is_private == 1 ? true : false;
                    if (req.body.catagory && req.body.catagory != undefined)
                        post.catagory = req.body.catagory;
                    post.save((err, p) => {
                        if (err) console.log(err);
                        if (p) {
                            res.json({
                                post_summary: p,
                                status: 1
                            })
                        }
                    });
                }
                else {
                    res.json({
                        errors: [{ msg: 'we receive only image or video as file_type', param: 'file_type' }],
                        status: 0
                    });
                }
            });
        }
    });

//api route for loading all posts ewlated to _id (of user)
router.post('/load', (req, res) => {
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body.user_id, '_id', res, () => {
            FUNC.getRelativeObjectIdArray(req.body.user_id, (objectIdArr) => {
                FUNC.loadPosts(objectIdArr, req.body.user_id, req, (postList) => {
                    res.json({
                        posts: postList,
                        status: 1
                    });
                });
            });
        });
    }
});

//api for indentical filtered loading of posts
router.post('/load/identical', (req, res) => {
    req.checkBody('post_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        FUNC.postExists(req.body.post_id, res, () => {
            FUNC.loadRelatedPosts(req.body.post_id, req, (postList) => {
                res.json({
                    posts: postList,
                    status: 1
                });
            });
        });
    }
});


//api route for deleteing a post
router.post('/delete', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        let ID = mongoose.Types.ObjectId(req.body.post_id);
        //delete all the comments first
        Comment.remove({ post_id: ID }, (err, cmt) => {
            if (err) console.log(err);
            Post.findByIdAndRemove(ID, (err, d) => {
                res.json({
                    success: `post deleted successfully`,
                    status: 1
                });
            })
        });
    }
});
//api route for posting a post
router.post('/trending', (req, res) => {
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        FUNC.trendingPosts(req.body.user_id, req, (postList) => {
            res.json({
                posts: postList,
                status: 1
            });
        });
    }
});

//------------------------------------------------------------------------------------------------------------------
//---------------------------routes associated with events due to post----------------------------------------------
//api route to like a post
router.post('/like', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //if the post exists
        FUNC.postExists(req.body.post_id, res, () => {
            //if the user exists
            UD.existsUser(req.body.user_id, 'user_id', res, () => {
                //checking if the user has already liked the post
                FUNC.postLikeExists(req.body.post_id, req.body.user_id, (condition) => {
                    //console.log(condition);
                    //if like doesn't exist
                    if (!condition) {
                        Post.findByIdAndUpdate(req.body.post_id, { $addToSet: { likes: mongoose.Types.ObjectId(req.body.user_id) } })
                            .exec((err, p) => {
                                if (err) console.log(err);
                                if (p) {
                                    
                                    res.json({
                                        success: `like added successfully : ${req.body.user_id}`,
                                        status: 1
                                    })
                                }
                            })
                    } else {//if like exists
                        Post.findByIdAndUpdate(req.body.post_id, { $pull: { likes: mongoose.Types.ObjectId(req.body.user_id) } })
                            .exec((err, p) => {
                                if (err) console.log(err);
                                if (p) {
                                    res.json({
                                        success: `like removed successfully : ${req.body.user_id}`,
                                        status: 1
                                    })
                                }
                            });
                    }
                });
            });
        });
    }
});
router.post('/like/load', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    }
    else {
        //if the user exists
        UD.existsUser(req.body.user_id, 'user_id', res, () => {
            //if post exists
            FUNC.postExists(req.body.post_id, res, () => {
                FUNC.loadLikes(req.body.post_id, req.body.user_id, req, (likeList) => {
                    res.json({
                        likes: likeList,
                        status: 1
                    });
                });
            });
        });
    }
});
//================================answer aapis================================================
//api route to like a post
router.post('/answer', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //if the post exists
        FUNC.postExists(req.body.post_id, res, () => {
            //if the user exists
            UD.existsUser(req.body.user_id, 'user_id', res, () => {
                //checking if the user has already liked the post
                FUNC.postAnswerExists(req.body.post_id, req.body.user_id, (condition) => {
                    console.log(condition);
                    //if like doesn't exist
                    if (!condition) {
                        Post.findByIdAndUpdate(req.body.post_id, { $addToSet: { answers: mongoose.Types.ObjectId(req.body.user_id) } })
                            .exec((err, p) => {
                                if (err) console.log(err);
                                if (p) {
                                    res.json({
                                        success: `answer added successfully : ${req.body.user_id}`,
                                        status: 1
                                    })
                                }
                            })
                    } else {//if like exists
                        Post.findByIdAndUpdate(req.body.post_id, { $pull: { answers: mongoose.Types.ObjectId(req.body.user_id) } })
                            .exec((err, p) => {
                                if (err) console.log(err);
                                if (p) {
                                    res.json({
                                        success: `answer removed successfully : ${req.body.user_id}`,
                                        status: 1
                                    })
                                }
                            });
                    }
                });
            });
        });
    }
});
//api to load answer list
router.post('/answer/load', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    }
    else {
        //if the user exists
        UD.existsUser(req.body.user_id, 'user_id', res, () => {
            //if post exists
            FUNC.postExists(req.body.post_id, res, () => {
                FUNC.loadAnswers(req.body.post_id, req.body.user_id, req, (likeList) => {
                    res.json({
                        likes: likeList,
                        status: 1
                    });
                });
            });
        });
    }
});
//================================comment apis================================================
//api route to comment on a post
router.post('/comment', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty(); //id of the post
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    req.checkBody('text', 'text is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body.user_id, 'user_id', res, () => {
            FUNC.postExists(req.body.post_id, res, () => {
                let comment = new Comment();
                comment.post_id = mongoose.Types.ObjectId(req.body.post_id);
                comment.user_id = mongoose.Types.ObjectId(req.body.user_id);
                comment.text = req.body.text;
                comment.date = Date.now();
                comment.save((err, cmnt) => {
                    if (err) console.log(err);
                    if (cmnt) {
                        res.json({
                            success: `comment added successfully`,
                            status: 1
                        });
                    }
                });
            });
        });
    }
});
//api to load commments
router.post('/comment/load', (req, res) => {
    req.checkBody('post_id', 'post_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id (of user) is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    }
    else {
        //if the user exists
        UD.existsUser(req.body.user_id, 'user_id', res, () => {
            //if post exists
            FUNC.postExists(req.body.post_id, res, () => {
                FUNC.loadComments(req.body.post_id, req.body.user_id, req, (commentList, caption) => {
                    res.json({
                        comments: commentList,
                        caption: caption,
                        status: 1
                    });
                });
            });
        });
    }
});

//api to delete a comment
router.post('/comment/delete', (req, res) => {
    req.checkBody('comment_id', 'comment_id is required!').notEmpty(); //id of the comment
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        Comment.findByIdAndRemove(req.body.comment_id)
            .exec((err, comment) => {
                if (err) console.log(err);
                res.json({
                    success: `comment deleted successfully!`,
                    status: 1
                })
            });
    }
});

//api to edit the comment
router.post('/comment/edit', (req, res) => {
    req.checkBody('comment_id', 'comment_id is required!').notEmpty(); //id of the comment
    req.checkBody('text', 'text is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        Comment.findByIdAndUpdate(req.body.comment_id, { $set: { text: req.body.text, date: Date.now() } })
            .exec((err, comment) => {
                if (err) console.log(err);
                res.json({
                    success: `comment edited successfully!`,
                    status: 1
                })
            });
    }
});

/* 
//not nessessary as like itself works as toggle
//api route to remove like a post
router.post('/de_like', (req, res) => {
    req.checkBody('_id', '_id is required!').notEmpty();
    req.checkBody('user_id', 'user_id is required!').notEmpty();

    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        //if the post exists
        FUNC.postExists(req.body._id, res, () => {
            //if the user exists
            UD.existsUser(req.body.user_id, res, () => {
                Post.findByIdAndUpdate(req.body._id, { $pull: { likes: mongoose.Types.ObjectId(req.body.user_id) } })
                    .exec((err, p) => {
                        if (err) console.log(err);
                        if (p) {
                            console.log(p);
                            res.json({
                                success: `like removed successfully : ${req.body.user_id}`,
                                status: 1
                            })
                        }
                    })
            });

        });
    }
});
 */


//=============================story=================================================

//api to post a story
router.post('/story',
    FUNC.postPrepare,
    multer({
        storage: imageStorage
    }).array('file_array', 10),
    (req, res) => {
        //checking for the existance of the fields
        req.checkBody('user_id', 'user_id is required!').notEmpty();
        req.checkBody('file_count', 'file_number is required!').notEmpty();
        req.checkBody('file_type', 'file_type is required!').notEmpty();
        let errors = req.validationErrors();
        if (errors) {
            console.log(errors);
            errors.push({ msg: 'file_array is required!', param: 'file_array' });
            res.json({ errors: errors, status: 0 }); // status 0 means that there is error
        } else {
            //checking if user do exist
            UD.existsUser(req.body.user_id, 'user_id', res, () => {
                if (req.body.file_type == 'image') {
                    if (req.body.file_count == req.img_collection.length) {

                        //processing uploaded images
                        async.each(req.img_collection2, (image, callback) => {
                            jimp.read(image, function (err, lenna) {
                                if (err) throw err;
                                lenna
                                    .resize(680, jimp.AUTO)
                                    .quality(90)                 // set JPEG quality
                                    .write(image); // save
                            });
                            //console.log(`processing...`);
                            callback();
                        }, (err) => {
                            if (err)
                                console.log(err);
                            else {
                                //creationg the new post
                                let story = new Story();
                                story.user_id = mongoose.Types.ObjectId(req.body.user_id);
                                story.file_count = req.body.file_count;
                                story.file_array = req.img_collection; // comes from FUNC.postPreparation
                                story.file_type = req.body.file_type;
                                story.date = new Date();
                                story.save((err, p) => {
                                    if (err) console.log(err);
                                    if (p) {
                                        res.json({
                                            story_summary: p,
                                            status: 1
                                        })
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({
                            errors: [{ msg: ' file_count is wrong', param: 'file_count' }],
                            status: 0
                        });
                    }
                }
                else if (req.body.file_type == 'video') {
                    if (req.body.file_count == 1) {
                        //video thumbnail extraction
                        //creating the new post
                        let story = new Story();
                        story.user_id = mongoose.Types.ObjectId(req.body.user_id);
                        story.file_count = req.body.file_count;
                        story.file_array = req.img_collection; // comes from FUNC.postPreparation
                        story.file_type = req.body.file_type;
                        story.date = Date.now();
                        story.save((err, p) => {
                            if (err) console.log(err);
                            if (p) {
                                res.json({
                                    story_summary: p,
                                    status: 1
                                })
                            }
                        });
                    } else {
                        res.json({
                            errors: [{ msg: 'in case of video file_count must be 1', param: 'file_count' }],
                            status: 0
                        });
                    }
                }
                else {
                    res.json({
                        errors: [{ msg: 'we receive only image or video as file_type', param: 'file_type' }],
                        status: 0
                    });
                }
            });
        }
    });

//api to load stories
router.post('/story/load', (req, res) => {
    req.checkBody('user_id', 'user_id is required!').notEmpty();
    let errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        res.json({ errors: errors, status: 0 }); // status 0 means that there is error
    } else {
        UD.existsUser(req.body.user_id, '_id', res, () => {
            FUNC.getRelativeObjectIdArray(req.body.user_id, (objectIdArr) => {
                FUNC.loadStories(objectIdArr, req, (postList) => {

                    res.json({
                        posts: postList,
                        status: 1
                    });
                });
            });
        });
    }
});

//api route fo




//-------------------------------------------------------------------------------------------------------------

module.exports = router;