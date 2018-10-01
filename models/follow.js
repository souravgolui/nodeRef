const mongoose = require('mongoose');
const schema = mongoose.Schema;

let followSchema = new schema({
    user_id : {type : schema.Types.ObjectId, ref: 'user'},
    target_id : {type : schema.Types.ObjectId, ref: 'user'},
    mode: {type: Number, default: 0}
});

let Follow = module.exports = mongoose.model('follow', followSchema);

/*
documentation----

mode: ->
0. the person isn't following back
1. the person is following back.

target_id represents the id if the user , the person is following 





*/