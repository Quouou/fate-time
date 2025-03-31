require("dotenv").config();
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Add GUILD_ID in .env for testing

const commands = [
  {
    name: "server-time",
    description: "Get the Fate/Grand Order NA server time.",
  },
  {
    name: "ping",
    description: "Check if the bot is responsive.",
  },
  {
    name: "help",
    description: "Get a list of available commands.",
  },
  {
    name: "servant-check",
    description: "Check if a servant exists in NA, JP, or both",
    options: [{
      name: "name",
      description: "The name of the servant to check",
      type: 3, // STRING type
      required: true
    }]
  },
  {
    name: "future-banners",
    description: "Check upcoming banners for a servant",
    options: [{
      name: "name",
      description: "The name of the servant to check",
      type: 3, // STRING type
      required: true
    }]
  }
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    // For testing in a single server
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
