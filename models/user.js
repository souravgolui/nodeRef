const mongoose = require('mongoose');
const schema = mongoose.Schema;

let userSchema = new schema({
    full_name: { type: String, required: true },
    account_type : {type : String, default: 'normal'},
    user_name: {type: String, required: true },
    image: { type: String, default: "default.png" },
    thumb_image: { type: String, required: true },
    email: { type: String, required: false, default:'N/A'},
    account : {type: String, required : false},
    password: { type: String, required: true },
    date: { type: Date, default: Date.now },
    folder: { type: String, required: true },
    latitude : { type: Number, required: true},
    longitude : { type: Number, required: true},
    phone : {type: String, default: ''},
    website : {type: String, default: ''},
    bio : {type: String, default: ''},
    religious_afiliation : {type: String, default: ''},
    church_info : {type: String, default: ''},
    pastor : {type: String, default: ''},
    adderss : {type: String, default: ''},
    services : {type: String, default: ''},
    should_show_suggestion :{type : Boolean, default: true},
    can_comment : {type: Boolean, default: true},
    connection_string :{type: String, default: 'IeatPioson'},
    device_type: {type : String, default: 'ios'},
    device_id : {type : String, required: false},
});

let User = module.exports = mongoose.model('user', userSchema);

/*
documentation----

rules for this database->
email must be unique
folder string is unique for all the users . so it can be useed in naming unique 
items such as thumb_image

I really don't know what services is ?

the empty fields are left empty as default intentionally.

in case of fb or google login rather than email, account is used.

*/