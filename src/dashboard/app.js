module.exports.load = async(client) => {

	/* Init express app */
	const express = require("express"),
		session = require("express-session"),
		path = require("path"),
		app = express();
    
	/* App configuration */
	app
		// For post methods
		.use(express.json())
		.use(express.urlencoded({ extended: true }))
		// Set the engine to html (for ejs template)
		.engine("html", require("ejs").renderFile)
		.set("view engine", "ejs")
		// Set the css and js folder to ./public
		.use(express.static(path.join(__dirname, "/public")))
		// Set the ejs templates to ./views
		.set("views", path.join(__dirname, "/views"))

};