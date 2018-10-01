//database file
const User = require('../models/user');
const Story = require('../models/story');
//constants
const authToken = 'i_am_a_mini_battle_hero'; 

//authentication for log route
exports.init = (req, res, next) => {
    if(req.headers.hasOwnProperty('i_am_working')) {
        if(req.headers.i_am_working == authToken) {
            return next();
        }
        else{  
            res.redirect('/error');
        }  
    }
    else{
        res.redirect('/error');
    } 
};

//authentication for all other routes
exports.kick = (req, res, next) => {
    if(req.headers.hasOwnProperty('i_am_working') && req.headers.hasOwnProperty('user_id') && req.headers.hasOwnProperty('connection_string')) {
        if(req.headers.i_am_working == authToken) {
            User.findById(req.headers.user_id)
            .exec((err, user) => {
                if(err) console.log(err);
                if(user.connection_string == req.headers.connection_string) {
                    return next();
                }
                else {
                    res.redirect('/error'); 
                }
            });
        }
        else{
            res.redirect('/error');
        }  
    }
    else{
        res.redirect('/error');
    }
};

//call to clean up old stories
exports.storyCleanup = (req, res, next) => {
    let removeDate =new Date();
    removeDate.setDate(removeDate.getDate() - 1);
    Story.remove({ date: {$lte : removeDate}})
    .exec((err, removedStories) => {
        if(err) console.log(err);
        console.log(removedStories.length);
        return next();
    });
};