const mongoose = require('mongoose');
const schema = mongoose.Schema;

let commentSchema = new schema({
    post_id : {type: schema.Types.ObjectId, ref: 'post'},
    date: {type: Date, default: Date.now},
    user_id : {type: schema.Types.ObjectId, ref: 'user'},
    text : {type: String, required: false}
});

let Comment = module.exports = mongoose.model('comment', commentSchema);

/*
documentation----






*/