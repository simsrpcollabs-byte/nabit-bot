import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('nabit')
    .setDescription('Open Nabit')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('Registering commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('Commands registered!');
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', () => {
  console.log(`Nabit is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'nabit') {
    const embed = new EmbedBuilder()
      .setTitle('NABIT')
      .setDescription(
        '**What are we nabbing?**\n\n' +
        '🍔 Browse Restaurants\n' +
        '🛍️ Your Bag\n' +
        '🧾 Your Orders'
      )
      .setFooter({ text: 'Nabit • Delivered your way.' });

    await interaction.reply({
      embeds: [embed]
    });
  }
});

await registerCommands();
client.login(process.env.DISCORD_TOKEN);
