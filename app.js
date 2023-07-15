//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const env = require("dotenv").config();


const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
const PORT = process.env.PORT || 3000;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } 
  catch (error) {
    console.log(error);
    process.exit(1);
  }
}


const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

  const Item = mongoose.model("Item", itemsSchema);
  const List = mongoose.model("List", listSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!",
  });

  const item2 = new Item({
    name: "Hit the + button to add a new item.",
  });

  const item3 = new Item({
    name: "<-- Hit this to delete an item.",
  });

  const defaultItems = [item1, item2, item3];


// Routes here
  app.get("./views/list.ejs", function (req, res) {
    async function getItem() {
      let foundItems = await Item.find({});
      try {
        if (foundItems === 0) {
          await Item.insertMany(defaultItems)
            .then(function () {})
            .catch(function (err) {
              console.log(err);
            });
          res.redirect("/");
        } else {
          res.render("./views/list.ejs", {
            listTitle: "Today",
            newListItems: foundItems,
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
    getItem();
  });

  app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    async function newPage() {
      try {
        let results = await List.findOne({ name: customListName });
        if (!results) {
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          res.render("list", {
            listTitle: results.name,
            newListItems: results.items,
          });
        }
      } catch (error) {
        console.log(error);
      }
      newPage();
    }
  });

  app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName,
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      async function updateCustomList() {
        var foundList = await List.findOne({ name: listName });
        try {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        } catch (err) {
          console.log(err);
        }
      }
      updateCustomList();
    }
  });

  app.post("/delete", function (req, res) {
    const checkItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
      Item.findByIdAndRemove(checkItemId)
        .then(function (deleted) {
          res.redirect("/");
        })
        .catch(function (err) {
          console.log(err);
        });
    } else {
      async function deleteFromCustomList() {
        const results = await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkItemId } } }
        );
        try {
          res.redirect("/" + listName);
        } catch (error) {
          console.log(error);
        }
      }
      deleteFromCustomList();
    }
  });

  app.get("/about", function (req, res) {
    res.render("about");
  });


  // Connection to db 
connectDB()
.then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})