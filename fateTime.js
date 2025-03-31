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

// Function to search for a servant by name and include artwork
async function searchServant(name, region) {
  try {
    const baseUrl = region === 'NA' ? NA_API_BASE : JP_API_BASE;
    
    // Get basic search results
    const response = await axios.get(`${baseUrl}/servant/search?name=${encodeURIComponent(name)}`);
    
    // If we got results, fetch detailed info for the first result to get artwork
    if (response.data.length > 0) {
      // Only get details for the top result to avoid too many API calls
      const topServant = response.data[0];
      const detailedInfo = await axios.get(`${baseUrl}/servant/${topServant.id}`);
      
      // Add artwork URLs to the search result
      topServant.artworks = {
        ascension1: detailedInfo.data?.extraAssets?.faces?.ascension?.[1],
        ascension2: detailedInfo.data?.extraAssets?.faces?.ascension?.[2],
        ascension3: detailedInfo.data?.extraAssets?.faces?.ascension?.[3],
        ascension4: detailedInfo.data?.extraAssets?.faces?.ascension?.[4],
        default: detailedInfo.data?.extraAssets?.faces?.default
      };
      
      // Replace first result with enhanced version
      response.data[0] = topServant;
    }
    
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

// Update the InteractionCreate event handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Existing command handlers...
  
  // Handle servant-check command
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
    
    let description = `**Servant Check: ${servantName}**\n\n`;
    
    if (naServant && jpServant) {
      description += `✅ **${naServant.name}** is available in both NA and JP\n`;
      
      // Check if they're the same servant
      if (naServant.collectionNo === jpServant.collectionNo) {
        description += `Collection No: ${naServant.collectionNo}\n`;
      } else {
        description += `NA Collection No: ${naServant.collectionNo}\n`;
        description += `JP Collection No: ${jpServant.collectionNo}\n`;
      }
    } else if (naServant) {
      description += `✅ **${naServant.name}** is available in NA only\n`;
      description += `Collection No: ${naServant.collectionNo}\n`;
    } else if (jpServant) {
      description += `⏳ **${jpServant.name}** is available in JP only (not yet in NA)\n`;
      description += `Collection No: ${jpServant.collectionNo}\n`;
    }
    
    // Get servant with artwork (prefer NA version if available)
    const servantWithArt = naServant || jpServant;
    
    // Create an embed with the image
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle(`${servantWithArt.name}`)
      .setDescription(description)
      .setColor('#0099ff');
    
    // Add artwork if available
    if (servantWithArt.artworks) {
      const imageUrl = servantWithArt.artworks.ascension1 || 
                      servantWithArt.artworks.ascension2 || 
                      servantWithArt.artworks.ascension3 || 
                      servantWithArt.artworks.ascension4 || 
                      servantWithArt.artworks.default;
      
      if (imageUrl) {
        embed.setImage(imageUrl);
      }
    }
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in servant-check command:', error);
    await interaction.editReply('An error occurred while checking the servant. Please try again later.');
  }
}
  

});



client.once("ready", async () => {
  console.log(`${client.user.tag} is online and monitoring tweets!`);
});



client.login(TOKEN);
