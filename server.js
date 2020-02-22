const ejs = require("ejs").__express;
const http = require("http");
const express = require('express');
const app = express();
const cookie = require("cookie");
const cookieParser = require('cookie-parser');
var path = require('path');

app.use(cookieParser());
app.engine('.ejs', ejs);

app.set("views", path.join(__dirname,"views"));
app.set("view engine", "ejs");

// Following the "Single query" approach from: https://node-postgres.com/features/pooling#single-query

const { Pool } = require("pg"); // This is the postgres database connection module.

// This says to use the connection string from the environment variable, if it is there,
// otherwise, it will use a connection string that refers to a local postgres DB
const connectionString = process.env.DATABASE_URL;

// Establish a new connection to the data source specified the connection string.
const pool = new Pool({connectionString: connectionString});


app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => res.render('pages/home'));
app.get("/login", (req, res) => res.render('pages/login'));
app.get('/validlogin', login);
app.get("/user", (req, res) => res.render('pages/userMaint'));
app.get("/position", (req, res) => res.render('pages/posMaint'));
app.get("/organization", (req, res) => res.render('pages/orgMaint'));
app.post("/addorg", insertOrg);
app.get("/member", (req, res) => res.render('pages/mbrMaint'));
app.get('/calling', (req, res) => res.render('pages/submitCalling'));

// Start the server running
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// Function to login in the user validating their password and
// assigning their permissions
function login(request, response) {
  var username = request.query.username;
  var password = request.query.password;

  validateLogin(username,password, function(error, result) {
    console.log('error: ' + error);
    console.log('result: ' + result);
    console.log('result.length: ' + result.length);
    if (error || result == null || result.length != 1) {
      console.log('Error validating user');
      response.render('pages/loginfail');
    } else {
      console.log("User " + username + " successfully logged in.");
      var userAccess = result.useraccessrights;
      var userId = result.userid;
      console.log(userAccess);
      console.log(userId);
      var parameters = {uname: username};
      response.render('pages/loggedin', parameters);
    }
  });
}

function validateLogin(username,password, callback) {
  console.log("Validating user login with user name: " + username);

  // Set up the SQL that we will use for our query. Note that we can make
  // use of parameter placeholders just like with PHP's PDO.
  var sql = "SELECT userid, useraccessrights FROM users WHERE username = $1 and password = $2";

  // We now set up an array of all the parameters we will pass to fill the
  // placeholder spots we left in the query.
  var params = [username,password];

  // This runs the query, and then calls the provided anonymous callback function
  // with the results.
  pool.query(sql, params, function(err, result) {
    // If an error occurred...
    if (err) {
      console.log("Error in query: ")
      console.log(err);
      callback(err, null);
    }

    // Log this to the console for debugging purposes.
    if (result.length == 1)
      console.log("Valid user found");
    else
      console.log('User not found');


    // When someone else called this function, they supplied the function
    // they wanted called when we were all done. Call that function now
    // and pass it the results.

    // (The first parameter is the error variable, so we will pass null.)
    callback(null, result.rows);
  });

}

function insertOrg (request, response) {
  var organization = request.query.organization;
  console.log("Inserting organization: " + organization);

  // Set up the SQL that we will use for our query. Note that we can make
  // use of parameter placeholders just like with PHP's PDO.
  var sql = "INSERT INTO organizations (orgname) values ( $1)";

  // We now set up an array of all the parameters we will pass to fill the
  // placeholder spots we left in the query.
  var params = [organization];

  // This runs the query, and then calls the provided anonymous callback function
  // with the results.
  pool.query(sql, params, (err,res)=> {
    // If an error occurred...
    if (err) {
      console.log("Error in query: ")
      console.log(err);
      pool.end();
    }

    // Log this to the console for debugging purposes.
    console.log(res);
    var insresult;
    if (1 == 1) {
      console.log("Organization " + organization + " successfully added.");
      insresult = 'Y';
    } else {
      console.log("Organization " + organization + " insert failed");
      insresult = "N";
    }


    // When someone else called this function, they supplied the function
    // they wanted called when we were all done. Call that function now
    // and pass it the results.

    // (The first parameter is the error variable, so we will pass null.)
    pool.end()
  });
}

