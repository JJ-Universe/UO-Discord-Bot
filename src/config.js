require('dotenv').config()

const config = {
	ownerID: [''],
	token: process.env.TOKEN,
	// For looking up Twitch, Fortnite, Steam accounts
	api_keys: {
		spotify: {
			iD: '',
			secret: '',
		},
	},
};

module.exports = config;