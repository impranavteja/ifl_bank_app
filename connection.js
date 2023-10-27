const mysql = require('mysql');
const dotenv = require('dotenv');

// Load the environment variables from .env file
dotenv.config();


const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

conn.connect(function (error) {
    if (error) throw error;
    console.log("Connected to the database");
});

module.exports = conn;
