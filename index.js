import 'dotenv/config';
import {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  AttachmentBuilder
} from 'discord.js';
import { businesses, findBusiness, findItem } from './data.js';
import { renderCheckout } from './renderer.js';

const GRAPE = 0x7257E8;
const client = new Client({ intents:[GatewayIntentBits.Guilds] });
const rest = new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
const commands = [new SlashCommandBuilder().setName('nabit').setDescription('Open Nabit').toJSON()];

const sessions = new Map();
const carts = new Map();
const orders = new Map();

const money = n => `Ň${Number(n).toFixed(2)}`;

function sessionFor(uid){
  if(!sessions.has(uid)) sessions.set(uid,{name:null,deliveryLabel:'Home',deliveryAddress:'Vitara City'});
  return sessions.get(uid);
}
function cartFor(uid){
  if(!carts.has(uid)) carts.set(uid,{businessId:null,items:[]});
  return carts.get(uid);
}
function homeEmbed(uid){
  const s=sessionFor(uid);
  return new EmbedBuilder().setColor(GRAPE).setAuthor({name:'nabit'})
    .setTitle(`Hi, ${s.name || 'there'}. What are we nabbing?`)
    .setDescription('Browse restaurants and stores, build your bag, then Nabit will generate your checkout screen.')
    .addFields({name:'Popular near you',value:businesses.map(b=>`**${b.name}** • ${b.type}\\n${b.eta} • ${money(b.fee)} delivery`).join('\\n\\n')})
    .setFooter({text:'Need it? Nabit.'});
}
function homeButtons(){
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('browse').setLabel('Browse').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('bag').setLabel('Bag').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('orders').setLabel('Orders').setStyle(ButtonStyle.Secondary)
  )];
}
function backHome(){
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('home').setLabel('Home').setStyle(ButtonStyle.Secondary)
  );
}
function businessSelect(){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('business_select').setPlaceholder('Choose a restaurant or store')
      .addOptions(businesses.map(b=>({label:b.name,value:b.id,description:`${b.type} • ${b.eta}`})))
  );
}
function categorySelect(b){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(`category:${b.id}`).setPlaceholder('Choose a category')
      .addOptions(Object.keys(b.categories).map(c=>({label:c,value:c})))
  );
}
function itemSelect(b,cat){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(`item:${b.id}:${cat}`).setPlaceholder('Choose an item')
      .addOptions(b.categories[cat].slice(0,25).map(i=>({label:i.name.slice(0,100),value:i.id,description:money(i.price)})))
  );
}
function bagEmbed(uid){
  const c=cartFor(uid);
  if(!c.items.length) return new EmbedBuilder().setColor(GRAPE).setTitle('Your bag').setDescription('Your bag is empty.');
  const subtotal=c.items.reduce((s,i)=>s+i.price*i.qty,0);
  return new EmbedBuilder().setColor(GRAPE).setAuthor({name:'nabit • Bag'})
    .setTitle(findBusiness(c.businessId)?.name || 'Your order')
    .setDescription(c.items.map(i=>`**${i.name}** × ${i.qty} — ${money(i.price*i.qty)}`).join('\\n'))
    .addFields({name:'Subtotal',value:money(subtotal),inline:true});
}

client.once('ready',()=>console.log(`Nabit is online as ${client.user.tag}`));

client.on('interactionCreate', async interaction=>{
  try{
    const uid=interaction.user.id;

    if(interaction.isChatInputCommand() && interaction.commandName==='nabit'){
      const modal=new ModalBuilder().setCustomId('name_modal').setTitle('Welcome to Nabit');
      const input=new TextInputBuilder().setCustomId('order_name').setLabel('Name for this order')
        .setPlaceholder('e.g. Dèja').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(40);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if(interaction.isModalSubmit() && interaction.customId==='name_modal'){
      const name=interaction.fields.getTextInputValue('order_name').trim();
      sessionFor(uid).name=name;
      carts.set(uid,{businessId:null,items:[]});
      await interaction.reply({embeds:[homeEmbed(uid)],components:homeButtons(),ephemeral:true});
      return;
    }

    if(interaction.isButton()){
      if(interaction.customId==='home'){
        await interaction.update({embeds:[homeEmbed(uid)],components:homeButtons(),attachments:[]}); return;
      }
      if(interaction.customId==='browse'){
        await interaction.update({
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle('Browse Nabit').setDescription(
            businesses.map(b=>`**${b.name}**\\n${b.description}\\n${b.eta} • ${money(b.fee)} delivery`).join('\\n\\n')
          )],
          components:[businessSelect(),backHome()],attachments:[]
        }); return;
      }
      if(interaction.customId==='bag' || interaction.customId==='edit_order'){
        const c=cartFor(uid);
        const rows=[];
        if(c.items.length){
          rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('generate_checkout').setLabel('Generate Checkout').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('clear').setLabel('Clear Bag').setStyle(ButtonStyle.Secondary)
          ));
        }
        rows.push(backHome());
        await interaction.update({embeds:[bagEmbed(uid)],components:rows,attachments:[]}); return;
      }
      if(interaction.customId==='clear'){
        carts.set(uid,{businessId:null,items:[]});
        await interaction.update({embeds:[bagEmbed(uid)],components:[backHome()],attachments:[]}); return;
      }
      if(interaction.customId==='generate_checkout'){
        const c=cartFor(uid);
        if(!c.items.length){ await interaction.reply({content:'Your bag is empty.',ephemeral:true}); return; }
        const b=findBusiness(c.businessId), s=sessionFor(uid);
        await interaction.deferUpdate();
        const png=await renderCheckout({
          customerName:s.name || interaction.user.displayName,
          business:b,
          items:c.items,
          deliveryLabel:s.deliveryLabel,
          deliveryAddress:s.deliveryAddress
        });
        const attachment=new AttachmentBuilder(png,{name:'nabit-checkout.png'});
        await interaction.editReply({
          content:'**Review your Nabit checkout.**',
          embeds:[],
          files:[attachment],
          attachments:[],
          components:[new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('place_order').setLabel('Place Order').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('edit_order').setLabel('Edit Order').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('cancel_order').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
          )]
        });
        return;
      }
      if(interaction.customId==='cancel_order'){
        carts.set(uid,{businessId:null,items:[]});
        await interaction.update({content:'Order canceled.',embeds:[],components:[backHome()],attachments:[]}); return;
      }
      if(interaction.customId==='place_order'){
        const c=cartFor(uid), b=findBusiness(c.businessId);
        const subtotal=c.items.reduce((s,i)=>s+i.price*i.qty,0);
        const service=Math.max(1.50,subtotal*0.08);
        const total=subtotal+(b?.fee||0)+service;
        const id=Math.floor(100000+Math.random()*900000).toString();
        orders.set(id,{id,userId:uid,businessId:c.businessId,items:[...c.items],total,status:'Confirmed',name:sessionFor(uid).name});
        carts.set(uid,{businessId:null,items:[]});
        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setAuthor({name:'nabit'}).setTitle('Order confirmed')
            .setDescription(`**Order #${id}**\\n${sessionFor(uid).name}, your order was sent to **${b?.name}**.\\n\\n**Total: ${money(total)} VUC**`)
            .setFooter({text:'Need it? Nabit.'})],
          components:[backHome()],
          attachments:[]
        }); return;
      }
      if(interaction.customId==='orders'){
        const mine=[...orders.values()].filter(o=>o.userId===uid);
        await interaction.update({
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle('Your orders').setDescription(
            mine.length ? mine.slice(-8).reverse().map(o=>`**#${o.id}** • ${findBusiness(o.businessId)?.name}\\n${o.status} • ${money(o.total)}`).join('\\n\\n') : 'No orders yet.'
          )],
          components:[backHome()],attachments:[]
        }); return;
      }
    }

    if(interaction.isStringSelectMenu()){
      if(interaction.customId==='business_select'){
        const b=findBusiness(interaction.values[0]);
        await interaction.update({
          embeds:[new EmbedBuilder().setColor(GRAPE).setAuthor({name:'nabit'}).setTitle(b.name)
            .setDescription(`${b.description}\\n\\n**${b.eta}** • ${money(b.fee)} delivery`)
            .addFields(Object.entries(b.categories).map(([cat,items])=>({name:cat,value:items.slice(0,8).map(i=>`${i.name} — **${money(i.price)}**`).join('\\n')})))],
          components:[categorySelect(b),backHome()],attachments:[]
        }); return;
      }
      if(interaction.customId.startsWith('category:')){
        const bid=interaction.customId.split(':')[1], b=findBusiness(bid), cat=interaction.values[0];
        await interaction.update({
          embeds:[new EmbedBuilder().setColor(GRAPE).setAuthor({name:`nabit • ${b.name}`}).setTitle(cat)
            .setDescription(b.categories[cat].map(i=>`**${i.name}** — ${money(i.price)}`).join('\\n\\n'))],
          components:[itemSelect(b,cat),categorySelect(b),backHome()],attachments:[]
        }); return;
      }
      if(interaction.customId.startsWith('item:')){
        const [,bid,cat]=interaction.customId.split(':');
        const b=findBusiness(bid), item=findItem(b,interaction.values[0]);
        let c=cartFor(uid);
        if(c.businessId && c.businessId!==bid){ carts.set(uid,{businessId:bid,items:[]}); c=cartFor(uid); }
        c.businessId=bid;
        const existing=c.items.find(i=>i.id===item.id);
        if(existing) existing.qty+=1; else c.items.push({...item,qty:1});
        await interaction.update({
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle(`${item.name} added`).setDescription(`${money(item.price)}\\n\\nYour bag has ${c.items.reduce((s,i)=>s+i.qty,0)} item(s).`)],
          components:[new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bag').setLabel('View Bag').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('browse').setLabel('Keep Browsing').setStyle(ButtonStyle.Secondary)
          )],
          attachments:[]
        }); return;
      }
    }
  }catch(err){
    console.error('Nabit interaction error:',err);
    if(interaction.isRepliable()){
      const p={content:'Nabit hit a snag. Try that again in a second.',ephemeral:true};
      if(interaction.replied||interaction.deferred) await interaction.followUp(p).catch(()=>{});
      else await interaction.reply(p).catch(()=>{});
    }
  }
});

await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID),{body:commands});
console.log('Commands registered!');
client.login(process.env.DISCORD_TOKEN);
