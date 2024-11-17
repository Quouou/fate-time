require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { DateTime } = require("luxon");
const { TwitterApi } = require("twitter-api-v2");

const client = new Client({
  intents: [GatewayIntentBits.Guilds], // No need for message intents for slash commands
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_USER_ID = process.env.TWITTER_USER_ID;

const twitterClient = new TwitterApi(TWITTER_BEARER_TOKEN);
const twitterReadonlyClient = twitterClient.readOnly;

let lastTweetId = null;

client.once("ready", async () => {
  console.log(`${client.user.tag} is online and monitoring tweets!`);

  // Set an interval to check tweets every 60 seconds
  setInterval(async () => {
    try {
      // Fetch recent tweets from the FateGO_USA Twitter account
      const userTweets = await twitterReadonlyClient.v2.userTimeline(
        TWITTER_USER_ID,
        {
          exclude: "retweets,replies", // Only original tweets
          max_results: 5,
        }
      );

      if (userTweets.data && userTweets.data.length > 0) {
        // Get the latest tweet
        const latestTweet = userTweets.data[0];

        // Check if it's a new tweet
        if (lastTweetId !== latestTweet.id) {
          // Temporarily bypass lastTweetId check
          lastTweetId = latestTweet.id;
          const channel = await client.channels.fetch(CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(
              `🚨 New Tweet from Fate/Grand Order NA: https://x.com/FateGO_USA/status/${latestTweet.id}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    }
  }, 3600000);
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
  } else if (commandName === "test-fetch") {
    const mockTweet = {
      id: "1234567890",
      text: "🚨 Simulated tweet content for testing.",
    };

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      await channel.send(
        `🚨 Testing Tweet Fetch: https://x.com/FakeAccount/status/${mockTweet.id}\n\nContent: ${mockTweet.text}`
      );
    }
    await interaction.reply("Tweet fetch test complete!");
  }
});

client.login(TOKEN);
