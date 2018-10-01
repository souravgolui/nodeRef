const mongoose = require('mongoose');
const schema = mongoose.Schema;

let notificationSchema = new schema({
    user_id : {type : schema.Types.ObjectId, ref: 'user'},
    messsages : [
        {
            msg : {type : String , required : true},
            time : {type : Date, default : Date.now} 
        }
    ]
});