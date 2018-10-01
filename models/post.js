const mongoose = require('mongoose');
const schema = mongoose.Schema;

let postSchema = new schema({
    user_id : {type : schema.Types.ObjectId, ref: 'user'},
    location : {type : String, default:''},
    caption:  {type : String, default:''},
    is_text_only: {type: Boolean, default: false},
    file_array : [{type : String, required: false}],
    file_type : {type : String, required: true},
    file_count : {type : Number, default: 0},
    date: {type: Date, required: true},
    likes : [{type: schema.Types.ObjectId, ref: 'user'}],
    answers : [{type: schema.Types.ObjectId, ref: 'user'}],
    catagory: {type: String, default: ''},
    is_private: {type: Boolean, default: false}

});

let Post = module.exports = mongoose.model('post', postSchema);

/*
documentation -- 
file_type->
    image
    video
*/
