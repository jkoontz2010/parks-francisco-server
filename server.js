var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var METERS_PER_MILE = 1609.34

var app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/parks"
 *    GET: finds all parks given a GeoJSON object
 */

app.get("/parks", function(req, res) {

    db.collection('parks').find({ location: 
                    { $nearSphere: 
                      { $geometry: 
                        { type: "Point", coordinates: [ -122.4194, 37.7749 ] }, 
                        $maxDistance: 5 * METERS_PER_MILE 
                      } 
                    } 
                  }).toArray((err, docs) => {
                    if (err) {
                      handleError(res, err.message, "Failed to get contacts.");
                    } else {
                      res.status(200).json(docs);
                    }
                  });
});

