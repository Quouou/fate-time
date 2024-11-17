require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { DateTime } = require("luxon");

const client = new Client({
  intents: [GatewayIntentBits.Guilds], // No need for message intents for slash commands
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

client.once("ready", () => {
  console.log("Bot is ready!");

  client.user.setPresence({
    activities: [{ name: "Testing Presence", type: "PLAYING" }],
    status: "online",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "server-time") {
    const pacificTime = DateTime.now().setZone("America/Los_Angeles");
    const formattedTime = pacificTime.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ");

    await interaction.reply(
      `Fate/Grand Order NA Server Time: ${formattedTime}`
    );
  } else if (commandName === "ping") {
    await interaction.reply("Pong! The bot is online and responsive.");
  } else if (commandName === "help") {
    const commandsList = `
      **Available Commands:**
      - /server-time: Get the Fate/Grand Order NA server time.
      - /ping: Check if the bot is responsive.
    `;
    await interaction.reply(commandsList);
  }
});

client.login(TOKEN);
