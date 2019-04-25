var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
// Require all models
var db = require("./models");
var PORT = 5000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/sfcScraper", { useNewUrlParser: true });

// Routes

// A GET route for scraping the Complex Sports website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.sfchronicle.com/sports/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $('.collection').each(function (i, element) {
            var results = {};
        
            const title = $(element).find('h2.headline').text().trim();
            const link = $(element).find('h2.headline a').attr("href");
            const content = $(element).find('span').text().trim();;
            const image = $(element).find('.without_u').attr("href");

            // const image = $(element).find('.grid-article__img').attr('src');

            // results.push({
            //     title: title,
            //     link: link,
            //     // image: image
            // })

            var results1 = {
                title: title,
                link: link,
                content: content,
                image: image
            }
        
            console.log("THE BELOW IS THE RESULTS1")
            console.log(results1);

            db.Article.create(results1)

            // db.Article.push({
            //     title: title,
            //     link: link,
            //     // image: image

            // })
        })
    })

      // Save the text and href of each link enclosed in the current element
    //   const title = $(element).find('h2.headline').text();
    //   const link = $(element).find('h2.headline').attr('href');
    //   const image = $(element).find('.without_u').attr('href');
    //   const snippet = $(element).find('span').text().trim();

    //   results.title = title;
    //   results.link = link;
    //   results.image = image;
    //   results.snippet = snippet;

    //   console.log(results);

    //   db.Article.create(results)
    //     .then(function (dbArticle) {
    //       // View the added result in the console
    //       console.log(dbArticle);
    //     })
    //     .catch(function (err) {
    //       // If an error occurred, log it
    //       console.log(err);

    //       db.Article.create({
    //         title: title,
    //         link: link,
    //         image: image,
    //         snippet: snippet
    //       });
    //     });

    res.send('Scrape Complete');
});

app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

mongoose.connect("mongodb://localhost/sfcScraper", { useNewUrlParser: true });

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});