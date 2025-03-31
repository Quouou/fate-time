require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { TwitterApi } = require("twitter-api-v2");

const client = new Client({
  intents: [GatewayIntentBits.Guilds], // No need for message intents for slash commands
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

const axios = require('axios');
const { DateTime } = require('luxon');

// Atlas Academy API base URLs
const NA_API_BASE = 'https://api.atlasacademy.io/nice/NA';
const JP_API_BASE = 'https://api.atlasacademy.io/nice/JP';

// Function to search for a servant by name
async function searchServant(name, region) {
  try {
    const baseUrl = region === 'NA' ? NA_API_BASE : JP_API_BASE;
    const response = await axios.get(`${baseUrl}/servant/search?name=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error searching for servant in ${region}:`, error);
    return [];
  }
}

// Function to get servant details
async function getServantDetails(id, region) {
  try {
    const baseUrl = region === 'NA' ? NA_API_BASE : JP_API_BASE;
    const response = await axios.get(`${baseUrl}/servant/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting servant details in ${region}:`, error);
    return null;
  }
}

// Function to get future banners for a servant
async function getServantBanners(id, region) {
  try {
    const baseUrl = region === 'NA' ? NA_API_BASE : JP_API_BASE;
    // Fix: Change 'servant' to 'svt' in the endpoint path
    const response = await axios.get(`${baseUrl}/svt/${id}/summons`);
    
    // Filter to only include future banners
    const now = DateTime.now();
    const futureBanners = response.data.filter(banner => {
      const endDate = DateTime.fromISO(banner.endDate);
      return endDate > now;
    });
    
    return futureBanners;
  } catch (error) {
    console.error(`Error getting servant banners in ${region}:`, error);
    return [];
  }
}

// Update the InteractionCreate event handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Existing command handlers...
  
  // Handle servant-check command
  if (commandName === "servant-check") {
    await interaction.deferReply();
    const servantName = interaction.options.getString('name');
    
    try {
      // Search in both regions
      const naResults = await searchServant(servantName, 'NA');
      const jpResults = await searchServant(servantName, 'JP');
      
      if (naResults.length === 0 && jpResults.length === 0) {
        await interaction.editReply(`Couldn't find any servant matching "${servantName}" in either NA or JP.`);
        return;
      }
      
      // Find best match in each region
      const naServant = naResults.length > 0 ? naResults[0] : null;
      const jpServant = jpResults.length > 0 ? jpResults[0] : null;
      
      let reply = `**Servant Check: ${servantName}**\n\n`;
      
      if (naServant && jpServant) {
        reply += `✅ **${naServant.name}** is available in both NA and JP\n`;
        
        // Check if they're the same servant
        if (naServant.collectionNo === jpServant.collectionNo) {
          reply += `Collection No: ${naServant.collectionNo}\n`;
        } else {
          reply += `NA Collection No: ${naServant.collectionNo}\n`;
          reply += `JP Collection No: ${jpServant.collectionNo}\n`;
        }
      } else if (naServant) {
        reply += `✅ **${naServant.name}** is available in NA only\n`;
        reply += `Collection No: ${naServant.collectionNo}\n`;
      } else if (jpServant) {
        reply += `⏳ **${jpServant.name}** is available in JP only (not yet in NA)\n`;
        reply += `Collection No: ${jpServant.collectionNo}\n`;
      }
      
      await interaction.editReply(reply);
    } catch (error) {
      console.error('Error in servant-check command:', error);
      await interaction.editReply('An error occurred while checking the servant. Please try again later.');
    }
  }
  
  // Handle future-banners command
  else if (commandName === "future-banners") {
    await interaction.deferReply();
    const servantName = interaction.options.getString('name');
    
    try {
      // First search for the servant
      const naResults = await searchServant(servantName, 'NA');
      const jpResults = await searchServant(servantName, 'JP');
      
      if (naResults.length === 0 && jpResults.length === 0) {
        await interaction.editReply(`Couldn't find any servant matching "${servantName}" in either NA or JP.`);
        return;
      }
      
      let reply = `**Future Banners for "${servantName}"**\n\n`;
      let foundBanners = false;
      
      // Check NA banners first
      if (naResults.length > 0) {
        const naServant = naResults[0];
        const naBanners = await getServantBanners(naServant.id, 'NA');
        
        if (naBanners.length > 0) {
          foundBanners = true;
          reply += `**NA Banners for ${naServant.name}:**\n`;
          
          naBanners.forEach((banner, index) => {
            const startDate = DateTime.fromISO(banner.startDate).toFormat('yyyy-MM-dd');
            const endDate = DateTime.fromISO(banner.endDate).toFormat('yyyy-MM-dd');
            
            reply += `${index + 1}. **${banner.title || 'Unnamed Banner'}**\n`;
            reply += `   Dates: ${startDate} to ${endDate}\n`;
          });
          
          reply += '\n';
        }
      }
      
      // Check JP banners (future content for NA)
      if (jpResults.length > 0) {
        const jpServant = jpResults[0];
        const jpBanners = await getServantBanners(jpServant.id, 'JP');
        
        if (jpBanners.length > 0) {
          foundBanners = true;
          reply += `**JP Banners for ${jpServant.name} (future content for NA):**\n`;
          
          jpBanners.forEach((banner, index) => {
            const startDate = DateTime.fromISO(banner.startDate).toFormat('yyyy-MM-dd');
            const endDate = DateTime.fromISO(banner.endDate).toFormat('yyyy-MM-dd');
            
            reply += `${index + 1}. **${banner.title || 'Unnamed Banner'}**\n`;
            reply += `   JP Dates: ${startDate} to ${endDate}\n`;
            // Approximate NA date (JP is roughly 2 years ahead)
            const estimatedNaDate = DateTime.fromISO(banner.startDate).plus({years: 2}).toFormat('yyyy-MM');
            reply += `   Estimated NA: ~${estimatedNaDate}\n`;
          });
        }
      }
      
      if (!foundBanners) {
        reply += "No future banners found for this servant.";
      }
      
      await interaction.editReply(reply);
    } catch (error) {
      console.error('Error in future-banners command:', error);
      await interaction.editReply('An error occurred while checking future banners. Please try again later.');
    }
  }
});



client.once("ready", async () => {
  console.log(`${client.user.tag} is online and monitoring tweets!`);
});



client.login(TOKEN);
