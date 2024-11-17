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
    name: "test-fetch",
    description: "Simulate fetching a tweet for testing purposes.",
  },
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
