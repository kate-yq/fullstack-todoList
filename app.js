const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extend: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// model -item
const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

// create 3 default items
const item1 = new Item({
    name : "welcome to your ToDoList"
});

const item2 = new Item({
    name : "hit the + button to add new item"
});

const item3 = new Item({
    name : "<-- hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

// model - list
const ListSchema = {
    name : String,
    items : [itemsSchema]
}

const List = mongoose.model("List", ListSchema);


app.get("/", function(req, res){

    Item.find({}, function(err, foundItems){
        if (foundItems.length === 0){
            // add all default items into DB
            Item.insertMany(defaultItems, function(err){
                if (err){
                    console.log(err);
                } else {
                    console.log("successfully added all default items")
                }
            });
        }

        res.render("list", {listTitle: "Today", items: foundItems});
    });

});

// a dynamic rount so can get to any route
app.get("/:customeListName", function(req, res){
    const customeListName = _.capitalize(req.params.customeListName);

    List.findOne({name:customeListName}, function(err, foundList){
        if (err) {
            console.log(err);
        } else {
            if (!foundList){
                // show existing list
                const list = new List({
                    name : customeListName,
                    items : defaultItems
                });
                list.save();
                res.redirect("/" + customeListName);
            } else {
                // create a new list
                res.render("list",  {listTitle: foundList.name, items: foundList.items})
            }
        }
    });

});



app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName == "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
    
});

app.post("/delete", function(req, res){
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemID, function(err){
            if (err){
                console.log(err);
            } else {
                console.log("successfully deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, 
            {$pull: {items: {_id : checkedItemID}}},
            function(err, foundList){
            if (!err) {
                res.redirect("/" + listName);``
            }
        });
    }
});



app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("server is on port 3000")
});