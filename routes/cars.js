var express = require("express");
var router = express.Router({mergeParams: true});
var car = require("../models/car");
var comment = require("../models/comment");
var middleware = require("../middleware/index");


router.get("/", function(req, res){
	//Get all camprounds from DataBase
	car.find({}, function(err, car){
		if (err){
			console.log(err);
		}else{
			 res.render("./cars/index",{cars:car});
			}
	});
});

router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to cars array
    var name = req.body.name;
    var image = req.body.image;
	var description = req.body.description;
	var price = req.body.price;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	//create a new car and save to database
	car.create(
	{
	name: name,
	image: image,
	price: price,	
	description: description,
	author: author
	}, function(err, newcar){
		if(err || !newcar){
		console.log(err);
		req.flash("error", "car not created");
		} else{
			newcar.populate("author");
			req.flash("success", "car was successfully added");
		}
	
	
	});
    //redirect back to cars page
    res.redirect("/cars");
});

router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("./cars/new.ejs"); 
});

router.get("/:id", function(req, res){
	//find car with provided id
	var id = req.params.id;
	car.findById(id).populate("comments").exec(function (err, foundcar){
		if(err || !foundcar){
			console.log(err); 
			req.flash("error", "car not found");
			return res.redirect("/camprounds");
		} else{
			// console.log(foundcar);
			//render show template with that id
			res.render("./cars/show",{car:foundcar});
		}
	});
});

// EDIT carS
router.get("/:id/edit", middleware.checkcarOwnership,  function(req, res){
	var id = req.params.id;
	car.findById(id, function (err, foundcar){
		res.render("./cars/edit",{car:foundcar});
	});
});


// UPDATE car ROUTE
router.put("/:id", middleware.checkcarOwnership, function(req, res){
    // find and update the correct car
    car.findByIdAndUpdate(req.params.id, req.body.car, function(err, updatedcar){
       if(err || !updatedcar){
		   console.log(err);
           res.redirect("/cars");
       } else {
           //redirect somewhere(show page)
           res.redirect("/cars/" + req.params.id);
       }
    });
});

// DESTROY carS
router.delete("/:id", middleware.checkcarOwnership, (req, res) => {
    car.findByIdAndRemove(req.params.id, (err, carRemoved) => {
        if (err) {
            console.log(err);
        }
        comment.deleteMany( {_id: { $in: carRemoved.comments } }, (err) => {
            if (err) {
                console.log(err);
            }
			req.flash("success", "car deleted");
            res.redirect("/cars");
        });
    });
});


module.exports = router;