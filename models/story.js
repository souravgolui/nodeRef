const mongoose = require('mongoose');
const schema = mongoose.Schema;

const storySchema = new schema({
    user_id : {type : schema.Types.ObjectId, ref: 'user'},
    file_array :[{type : String, required: false}],
    date : {type: Date, required: true},
    file_type: {type: String, required: true},
    file_count: {type: Number, required: true}
});


module.exports = mongoose.model('story', storySchema);