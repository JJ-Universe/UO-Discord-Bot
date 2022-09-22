// Dependencies
const { ActivityType, Client, Collection, GatewayIntentBits: FLAGS, Partials, PermissionsBitField: { Flags: PermissionFlag } } = require('discord.js'),
	path = require('path'),
	{ promisify } = require('util'),
	AudioManager = require('./Audio-Manager'),
	readdir = promisify(require('fs').readdir);

/**
 * Custom client
 * @extends {Client}
*/
class client extends Client {
	constructor() {
		super({
			partials: [Partials.GUILD_MEMBER, Partials.USER, Partials.MESSAGE, Partials.CHANNEL, Partials.REACTION, Partials.GUILD_SCHEDULED_EVENT],
			intents: [FLAGS.Guilds, FLAGS.GuildMembers, FLAGS.GuildBans, FLAGS.GuildEmojisAndStickers,
				FLAGS.GuildMessages, FLAGS.GuildMessageReactions, FLAGS.DirectMessages, FLAGS.GuildVoiceStates, FLAGS.GuildInvites,
				FLAGS.GuildScheduledEvents, FLAGS.MessageContent],
		});

		/**
 		 * The logger file
 	 	 * @type {function}
 	  */
		this.logger = require('../utils/Logger');

		/**
		 * The command data
		 * @type {Collection}
		 * @type {Collection}
		 * @type {Collection}
		 * @type {Collection}
		*/
		this.aliases = new Collection();
		this.commands = new Collection();
		this.interactions = new Collection();
		this.cooldowns = new Collection();
		this.dashboard = require("../dashboard/app");
		this.requests = {};

		/**
		 * The config file
		 * @type {object}
		*/
		this.config = require('../config.js');

		/**
		 * The Audio manager
		 * @type {Class}
		*/
		this.manager = new AudioManager(this);
	}

	/**
	 * Function for loading commands to the bot.
	 * @param {string} commandPath The path of where the command is located
	 * @param {string} commandName The name of the command
	 * @readonly
	*/
	loadCommand(commandPath, commandName) {
		const cmd = new (require(`.${commandPath}${path.sep}${commandName}`))(this);
		this.logger.log(`Loading Command: ${cmd.help.name}.`);
		cmd.conf.location = commandPath;
		this.commands.set(cmd.help.name, cmd);
		cmd.help.aliases.forEach((alias) => {
			this.aliases.set(alias, cmd.help.name);
		});
	}

	/**
	 * Function for fetching slash command data.
	 * @param {string} category The command category to get data from
	 * @returns {array}
	*/
	async loadInteractionGroup(category) {
		try {
			const commands = (await readdir('./src/commands/' + category + '/')).filter((v, i, a) => a.indexOf(v) === i);
			const arr = [];
			for (const cmd of commands) {
				if (!this.config.disabledCommands.includes(cmd.replace('.js', ''))) {
					const command = new (require(`../commands/${category}${path.sep}${cmd}`))(this);
					if (command.conf.slash) {
						const item = {
							name: command.help.name,
							description: command.help.description,
							defaultMemberPermissions: command.conf.userPermissions.length >= 1 ? command.conf.userPermissions : PermissionFlag.SendMessages,
						};
						if (command.conf.options[0]) item.options = command.conf.options;
						arr.push(item);
					}
				}
			}
			return arr;
		} catch (err) {
			console.log(err);
			return `Unable to load category ${category}: ${err}`;
		}
	}

	/**
	 * Function for deleting slash command category from guild.
	 * @param {string} category The command category to get data from
	 * @param {guild} guild The guild to delete the slash commands from
	 * @returns {?array}
	*/
	async deleteInteractionGroup(category, guild) {
		try {
			const commands = (await readdir('./src/commands/' + category + '/')).filter((v, i, a) => a.indexOf(v) === i);
			const arr = [];
			commands.forEach((cmd) => {
				if (!this.config.disabledCommands.includes(cmd.replace('.js', ''))) {
					const command = new (require(`../commands/${category}${path.sep}${cmd}`))(this);
					if (command.conf.slash) {
						arr.push({
							name: command.help.name,
							description: command.help.description,
							options: command.conf.options,
							defaultPermission: command.conf.defaultPermission,
						});
						guild.interactions.delete(command.help.name, command);
					}
				}
			});
			return arr;
		} catch (err) {
			return `Unable to load category ${category}: ${err}`;
		}
	}

	/**
	 * Function for unloading commands to the bot.
	 * @param {string} commandPath The path of where the command is located
	 * @param {string} commandName The name of the command
	 * @readonly
	*/
	async unloadCommand(commandPath, commandName) {
		let command;
		if (this.commands.has(commandName)) {
			command = this.commands.get(commandName);
		} else if (this.aliases.has(commandName)) {
			command = this.commands.get(this.aliases.get(commandName));
		}
		if (!command) return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`;
		delete require.cache[require.resolve(`.${commandPath}${path.sep}${commandName}.js`)];
		return false;
	}
}

module.exports = client;
