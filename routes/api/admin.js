const express = require('express');

const router = express.Router();

const Catagory = require('../../models/catagory');


//admin page to add catagories
router.get('/', (req,res)=>{
    res.sendFile(`${req.app.locals.dat.basePath}/views/admin.html`);
});

//to get catagory list
router.post('/catagory', (req, res) => {
    Catagory.find()
    .exec((err, cat) => {
        res.json({
            catagories : cat,
            status: 1
        });
    })
});

//to add a catagory
router.post('/catagory/add', (req, res) => {
    req.checkBody('catagory_name', 'catagory_name is empty').notEmpty();
    const error = req.validationErrors();
    if(error) {
        res.json({ errors: error, status: 0 }); // status 0 means that there is error
    }
    else {
        Catagory.count({name: req.body.catagory_name})
        .exec((err, num) => {
            if(err) console.log(err);
            if(num > 0) {
                res.json({
                    status: 0,
                    msg : `${req.body.catagory_name} already exists.` 
                })
            } else {
                let catagory = new Catagory();
                catagory.name = req.body.catagory_name;
                catagory.save((err, cat) => {
                    if(err) console.log(err);
                    res.json({
                        status: 1,
                        msg : `${req.body.catagory_name} added successfully.` 
                    })
                })
            }
        })
    }
});
//to remove a catagory
router.post('/catagory/remove', (req, res) =>{
    Catagory.findByIdAndRemove(req.body._id)
    .exec((err, x) => {
        if(err) console.log(err);
        res.json({
            status: 1,
            msg : `${x.name} removed successfully.` 
        })
    });
});


module.exports = router;