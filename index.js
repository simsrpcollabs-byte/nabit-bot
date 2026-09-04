import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

const COLORS = {
  grape: 0x7257E8,
  yellow: 0xF8DD57,
  lilac: 0xE7E0FF,
  cream: 0xFFF9EE,
  ink: 0x24212C
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('nabit')
    .setDescription('Open Nabit')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Temporary in-memory carts/orders for UI testing.
// We will move these to Supabase once the app flow is approved.
const carts = new Map();
const orders = new Map();

function money(amount) {
  return `Ň${Number(amount).toFixed(2)}`;
}

function getCart(userId) {
  if (!carts.has(userId)) {
    carts.set(userId, {
      restaurant: null,
      items: [],
      note: '',
      deliveryLabel: 'Home',
      deliveryAddress: 'Not set',
      tip: 0
    });
  }
  return carts.get(userId);
}

function homeEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.grape)
    .setAuthor({ name: 'nabit' })
    .setTitle('Good food, delivered fast. 🍋')
    .setDescription(
      '📍 **Deliver to:** Home\n\n' +
      'Need dinner? Snacks? Something sweet?\n' +
      '**Need it? Nabit.**'
    )
    .addFields(
      { name: 'Popular near you', value: 'Your Nabit restaurants will appear here once we add them.' }
    )
    .setFooter({ text: 'nabit • Need it? Nabit.' });
}

function homeRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nabit_browse')
        .setLabel('Browse Restaurants')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('nabit_search')
        .setLabel('Search')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nabit_orders')
        .setLabel('Orders')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('nabit_favorites')
        .setLabel('Favorites')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('nabit_bag')
        .setLabel('Bag')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function backHomeRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('nabit_home')
      .setLabel('Home')
      .setStyle(ButtonStyle.Secondary)
  );
}

function browseEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.grape)
    .setAuthor({ name: 'nabit' })
    .setTitle('Browse restaurants')
    .setDescription(
      '**Nothing here yet — on purpose.**\n\n' +
      'This screen is ready for your actual RP restaurants. ' +
      'We’ll plug them in next instead of using fake placeholders.'
    )
    .setFooter({ text: 'nabit • Cravings covered.' });
}

function bagEmbed(userId) {
  const cart = getCart(userId);

  if (!cart.items.length) {
    return new EmbedBuilder()
      .setColor(COLORS.grape)
      .setAuthor({ name: 'nabit' })
      .setTitle('Your bag')
      .setDescription('Your bag is empty.\n\nBrowse a restaurant to start an order.')
      .setFooter({ text: 'nabit • Need it? Nabit.' });
  }

  const itemLines = cart.items.map(
    item => `**${item.name}** × ${item.quantity} — ${money(item.price * item.quantity)}`
  );

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return new EmbedBuilder()
    .setColor(COLORS.grape)
    .setAuthor({ name: 'nabit' })
    .setTitle('Your bag')
    .setDescription(itemLines.join('\n'))
    .addFields(
      { name: 'Subtotal', value: money(subtotal), inline: true },
      { name: 'Deliver to', value: cart.deliveryLabel, inline: true }
    )
    .setFooter({ text: 'nabit • Review before checkout.' });
}

function checkoutEmbed(userId) {
  const cart = getCart(userId);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 3.50;
  const serviceFee = 2.60;
  const total = subtotal + deliveryFee + serviceFee + cart.tip;

  const items = cart.items.length
    ? cart.items.map(item => `${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`).join('\n')
    : 'No items in bag.';

  return new EmbedBuilder()
    .setColor(COLORS.yellow)
    .setAuthor({ name: 'nabit • Checkout' })
    .setDescription(
      `📍 **Deliver to**\n${cart.deliveryLabel}\n${cart.deliveryAddress}\n\n` +
      `**Order summary**\n${items}\n\n` +
      `Subtotal — ${money(subtotal)}\n` +
      `Delivery fee — ${money(deliveryFee)}\n` +
      `Service fee — ${money(serviceFee)}\n` +
      (cart.tip ? `Tip — ${money(cart.tip)}\n` : '') +
      `\n**Total — ${money(total)} VUC**`
    )
    .addFields({
      name: '💳 VUC Wallet',
      value: 'Wallet balance integration comes with Equity Financial.',
      inline: false
    })
    .setFooter({ text: 'nabit • Secure checkout' });
}

function checkoutButtons(userId) {
  const cart = getCart(userId);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + 3.50 + 2.60 + cart.tip;

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nabit_pay')
        .setLabel(`Pay ${money(total)} VUC`)
        .setStyle(ButtonStyle.Success)
        .setDisabled(cart.items.length === 0),
      new ButtonBuilder()
        .setCustomId('nabit_edit_bag')
        .setLabel('Edit Order')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('nabit_cancel_checkout')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function ordersEmbed(userId) {
  const userOrders = [...orders.values()].filter(o => o.userId === userId);

  if (!userOrders.length) {
    return new EmbedBuilder()
      .setColor(COLORS.grape)
      .setAuthor({ name: 'nabit' })
      .setTitle('Your orders')
      .setDescription('No orders yet.\n\nYour active and past Nabit orders will live here.')
      .setFooter({ text: 'nabit • Track it from here.' });
  }

  return new EmbedBuilder()
    .setColor(COLORS.grape)
    .setAuthor({ name: 'nabit' })
    .setTitle('Your orders')
    .setDescription(
      userOrders.slice(-5).reverse().map(order =>
        `**#${order.id}** • ${order.status}\n${money(order.total)} VUC`
      ).join('\n\n')
    );
}

function orderConfirmedEmbed(order) {
  return new EmbedBuilder()
    .setColor(COLORS.grape)
    .setAuthor({ name: 'nabit' })
    .setTitle('On the way! 🚀')
    .setDescription(
      `**Order #${order.id} confirmed**\n\n` +
      `Arriving in **18 min**\n` +
      `Your order is on its way to you.\n\n` +
      `🛵 **Rider assignment pending**`
    )
    .addFields({
      name: 'Order total',
      value: `${money(order.total)} VUC`,
      inline: true
    })
    .setFooter({ text: 'nabit • Need it? Nabit.' });
}

function trackingButtons(orderId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`nabit_track_${orderId}`)
      .setLabel('Track Order')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`nabit_details_${orderId}`)
      .setLabel('View Details')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('nabit_home')
      .setLabel('Home')
      .setStyle(ButtonStyle.Secondary)
  );
}

async function registerCommands() {
  console.log('Registering Nabit commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('Commands registered!');
}

client.once('ready', () => {
  console.log(`Nabit is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'nabit') {
        await interaction.reply({
          embeds: [homeEmbed()],
          components: homeRows(),
          ephemeral: true
        });
      }
      return;
    }

    if (interaction.isButton()) {
      const userId = interaction.user.id;

      if (interaction.customId === 'nabit_home') {
        await interaction.update({
          embeds: [homeEmbed()],
          components: homeRows()
        });
        return;
      }

      if (interaction.customId === 'nabit_browse') {
        await interaction.update({
          embeds: [browseEmbed()],
          components: [backHomeRow()]
        });
        return;
      }

      if (interaction.customId === 'nabit_search') {
        const modal = new ModalBuilder()
          .setCustomId('nabit_search_modal')
          .setTitle('Search Nabit');

        const input = new TextInputBuilder()
          .setCustomId('query')
          .setLabel('What are you craving?')
          .setPlaceholder('Restaurant, cuisine, dish...')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === 'nabit_favorites') {
        const embed = new EmbedBuilder()
          .setColor(COLORS.grape)
          .setAuthor({ name: 'nabit' })
          .setTitle('Favorites')
          .setDescription('Your saved restaurants will appear here.')
          .setFooter({ text: 'nabit • Your go-to spots.' });

        await interaction.update({
          embeds: [embed],
          components: [backHomeRow()]
        });
        return;
      }

      if (interaction.customId === 'nabit_bag' || interaction.customId === 'nabit_edit_bag') {
        const bag = bagEmbed(userId);
        const cart = getCart(userId);

        const components = [];
        if (cart.items.length) {
          components.push(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('nabit_checkout')
                .setLabel('Checkout')
                .setStyle(ButtonStyle.Primary)
            )
          );
        }
        components.push(backHomeRow());

        await interaction.update({
          embeds: [bag],
          components
        });
        return;
      }

      if (interaction.customId === 'nabit_checkout') {
        await interaction.update({
          embeds: [checkoutEmbed(userId)],
          components: checkoutButtons(userId)
        });
        return;
      }

      if (interaction.customId === 'nabit_cancel_checkout') {
        await interaction.update({
          embeds: [bagEmbed(userId)],
          components: [backHomeRow()]
        });
        return;
      }

      if (interaction.customId === 'nabit_pay') {
        const cart = getCart(userId);

        if (!cart.items.length) {
          await interaction.reply({
            content: 'Your bag is empty.',
            ephemeral: true
          });
          return;
        }

        const subtotal = cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const total = subtotal + 3.50 + 2.60 + cart.tip;
        const id = Math.floor(100000 + Math.random() * 900000).toString();

        const order = {
          id,
          userId,
          items: [...cart.items],
          total,
          status: 'Confirmed'
        };

        orders.set(id, order);
        carts.set(userId, {
          restaurant: null,
          items: [],
          note: '',
          deliveryLabel: 'Home',
          deliveryAddress: 'Not set',
          tip: 0
        });

        await interaction.update({
          embeds: [orderConfirmedEmbed(order)],
          components: [trackingButtons(id)]
        });
        return;
      }

      if (interaction.customId === 'nabit_orders') {
        await interaction.update({
          embeds: [ordersEmbed(userId)],
          components: [backHomeRow()]
        });
        return;
      }

      if (interaction.customId.startsWith('nabit_track_')) {
        const id = interaction.customId.replace('nabit_track_', '');
        const order = orders.get(id);

        const embed = new EmbedBuilder()
          .setColor(COLORS.grape)
          .setAuthor({ name: `nabit • Order #${id}` })
          .setTitle('On the way! 🚀')
          .setDescription(
            '**Arriving in 18 min**\n' +
            'Your order is on its way to you.\n\n' +
            '🟡 Confirmed\n' +
            '🟣 Preparing\n' +
            '⚪ Picked up\n' +
            '⚪ Nearby\n' +
            '⚪ Delivered'
          )
          .setFooter({ text: 'nabit • Live rider map comes next.' });

        await interaction.update({
          embeds: [embed],
          components: [trackingButtons(id)]
        });
        return;
      }

      if (interaction.customId.startsWith('nabit_details_')) {
        const id = interaction.customId.replace('nabit_details_', '');
        const order = orders.get(id);

        const lines = order?.items?.length
          ? order.items.map(i => `${i.name} × ${i.quantity} — ${money(i.price * i.quantity)}`).join('\n')
          : 'Order details unavailable.';

        const embed = new EmbedBuilder()
          .setColor(COLORS.grape)
          .setAuthor({ name: `nabit • Order #${id}` })
          .setTitle('Order details')
          .setDescription(`${lines}\n\n**Total — ${money(order?.total ?? 0)} VUC**`);

        await interaction.update({
          embeds: [embed],
          components: [trackingButtons(id)]
        });
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'nabit_search_modal') {
        const query = interaction.fields.getTextInputValue('query');

        const embed = new EmbedBuilder()
          .setColor(COLORS.grape)
          .setAuthor({ name: 'nabit • Search' })
          .setTitle(`Results for “${query}”`)
          .setDescription(
            'No restaurants are configured yet.\n\n' +
            'Once we add your RP restaurants and menus, matching results will show here.'
          );

        await interaction.reply({
          embeds: [embed],
          components: [backHomeRow()],
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error('Nabit interaction error:', error);

    if (interaction.isRepliable()) {
      const payload = {
        content: 'Nabit hit a snag. Try that again in a second.',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }
});

await registerCommands();
client.login(process.env.DISCORD_TOKEN);
