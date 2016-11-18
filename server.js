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

// allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/*  "/parks"
 *    GET: finds all parks given a GeoJSON object
 */

app.get("/parks", function(req, res) {

  if(!(req.params.lat || req.params.lng)) {
    handleError(res, "Invalid user input", "Must provide a lat and lng.", 400);
  } else {
    db.collection('parks').aggregate([
              { "$geoNear": {
                  "near": {
                      "type": "Point",
                      "coordinates": [ req.params.lng, req.params.lat ]
                  }, 
                  "maxDistance": 1 * 1609,
                  "spherical": true,
                  "distanceField": "distance",
                  "distanceMultiplier": 0.000621371
              }}
    ]).toArray((err, docs) => {
        if (err) {
          handleError(res, err.message, "Failed to get parks.");
        } else {
          res.status(200).json(docs);
        }
      });
  } 

});

