const mongoose = require('mongoose');
const schema = mongoose.Schema;

let catagorySchema = new schema({
    name : {type : String, required: true}
});

let Catagory = module.exports = mongoose.model('catagory', catagorySchema);

/*
documentation----

mode: ->
0. the person isn't following back
1. the person is following back.

target_id represents the id if the user , the person is following 





*/