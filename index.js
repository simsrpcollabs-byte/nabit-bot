import 'dotenv/config';
import {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} from 'discord.js';
import { businesses, findBusiness, findItem } from './data.js';

const GRAPE = 0x7257E8;
const client = new Client({ intents:[GatewayIntentBits.Guilds] });
const rest = new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
const commands = [new SlashCommandBuilder().setName('nabit').setDescription('Open Nabit').toJSON()];

const sessions = new Map();
const carts = new Map();
const orders = new Map();

const money = n => `Ň${Number(n).toFixed(2)}`;
const clean = s => String(s ?? '').replace(/[`*_~|]/g,'').trim();
const short = (s,n=42) => clean(s).length <= n ? clean(s) : clean(s).slice(0,n-1)+'…';

function sessionFor(uid){
  if(!sessions.has(uid)) sessions.set(uid,{
    name:null,
    deliveryLabel:'Home',
    deliveryAddress:'Vitara City',
    note:''
  });
  return sessions.get(uid);
}
function cartFor(uid){
  if(!carts.has(uid)) carts.set(uid,{businessId:null,items:[]});
  return carts.get(uid);
}
function totals(uid){
  const c=cartFor(uid), b=findBusiness(c.businessId);
  const subtotal=c.items.reduce((s,i)=>s+i.price*i.qty,0);
  const delivery=b?.fee || 0;
  const service=Math.max(1.50, subtotal*0.08);
  return {subtotal,delivery,service,total:subtotal+delivery+service};
}
function homeEmbed(uid){
  const s=sessionFor(uid);
  return new EmbedBuilder()
    .setColor(GRAPE)
    .setAuthor({name:'nabit'})
    .setTitle(`Hi, ${short(s.name || 'there',30)}. What are we nabbing?`)
    .setDescription(`📍 **${short(s.deliveryLabel,18)}:** ${short(s.deliveryAddress,55)}\n\nShopping stays private. Your final receipt posts publicly in this channel.`)
    .addFields({
      name:'Popular near you',
      value:businesses.map(b=>`**${b.name}** • ${b.type}\n${b.eta} • ${money(b.fee)} delivery`).join('\n\n')
    })
    .setFooter({text:'Need it? Nabit.'});
}
function homeButtons(){
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('browse').setLabel('Browse').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bag').setLabel('Bag').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('orders').setLabel('Orders').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('delivery').setLabel('Delivery Info').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('change_name').setLabel('Change Name').setStyle(ButtonStyle.Secondary)
    )
  ];
}
function backHome(){
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('home').setLabel('Home').setStyle(ButtonStyle.Secondary)
  );
}
function businessSelect(){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('business_select')
      .setPlaceholder('Choose a restaurant or store')
      .addOptions(businesses.map(b=>({
        label:b.name,
        value:b.id,
        description:`${b.type} • ${b.eta}`.slice(0,100)
      })))
  );
}
function categorySelect(b){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`category:${b.id}`)
      .setPlaceholder('Choose a category')
      .addOptions(Object.keys(b.categories).map(c=>({label:c,value:c})))
  );
}
function itemSelect(b,cat){
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`item:${b.id}:${cat}`)
      .setPlaceholder('Choose an item')
      .addOptions(b.categories[cat].slice(0,25).map(i=>({
        label:i.name.slice(0,100),
        value:i.id,
        description:money(i.price)
      })))
  );
}
function bagEmbed(uid){
  const c=cartFor(uid);
  if(!c.items.length){
    return new EmbedBuilder().setColor(GRAPE).setTitle('Your bag').setDescription('Your bag is empty.');
  }
  const subtotal=c.items.reduce((s,i)=>s+i.price*i.qty,0);
  return new EmbedBuilder()
    .setColor(GRAPE)
    .setAuthor({name:'nabit • Bag'})
    .setTitle(findBusiness(c.businessId)?.name || 'Your order')
    .setDescription(c.items.map((i,n)=>`**${n+1}. ${i.name}** × ${i.qty} — ${money(i.price*i.qty)}`).join('\n'))
    .addFields({name:'Subtotal',value:money(subtotal),inline:true});
}
function bagControls(uid){
  const c=cartFor(uid), rows=[];
  if(c.items.length){
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('review_order').setLabel('Review Order').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('remove_item').setLabel('Remove Item').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('clear').setLabel('Clear Bag').setStyle(ButtonStyle.Secondary)
    ));
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('order_note').setLabel('Add Note').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('browse').setLabel('Add More').setStyle(ButtonStyle.Secondary)
    ));
  }
  rows.push(backHome());
  return rows;
}
function removeSelect(uid){
  const c=cartFor(uid);
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('remove_select')
      .setPlaceholder('Choose an item to remove')
      .addOptions(c.items.slice(0,25).map(i=>({
        label:`${i.name} × ${i.qty}`.slice(0,100),
        value:i.id
      })))
  );
}
function reviewEmbed(uid){
  const c=cartFor(uid), b=findBusiness(c.businessId), s=sessionFor(uid), t=totals(uid);
  return new EmbedBuilder()
    .setColor(GRAPE)
    .setAuthor({name:'nabit • Review'})
    .setTitle('Ready to place this order?')
    .setDescription(
      `**For:** ${short(s.name,40)}\n` +
      `**From:** ${b?.name}\n` +
      `**Deliver to:** ${short(s.deliveryAddress,70)}\n\n` +
      c.items.map(i=>`${i.qty} × ${i.name} — ${money(i.price*i.qty)}`).join('\n') +
      `\n\nSubtotal — ${money(t.subtotal)}` +
      `\nDelivery fee — ${money(t.delivery)}` +
      `\nService fee — ${money(t.service)}` +
      `\n\n**Total — ${money(t.total)} VUC**` +
      (s.note ? `\n\n**Note:** ${short(s.note,160)}` : '')
    )
    .setFooter({text:'The receipt will be posted publicly after confirmation.'});
}
function center(text,width=40){
  const s=String(text);
  if(s.length>=width) return s;
  const left=Math.floor((width-s.length)/2);
  return ' '.repeat(left)+s;
}
function receiptLine(left,right,width=40){
  left=String(left);
  right=String(right);
  const dots=Math.max(1,width-left.length-right.length);
  return left + '.'.repeat(dots) + right;
}
function publicReceipt(order,business,session){
  const width=44;
  const stars='*'.repeat(width);
  const dashes='-'.repeat(width);
  const itemLines=[];
  for(const item of order.items){
    const title=`${item.qty} x ${item.name}`;
    itemLines.push(short(title,width));
    itemLines.push(receiptLine('  ',money(item.price*item.qty),width));
  }

  const noteBlock=session.note ? `\nNOTE: ${short(session.note,150)}\n` : '';
  const body = [
    stars,
    center('🍋 NABIT',width),
    center('ORDER RECEIVED',width),
    stars,
    center(business.name.toUpperCase(),width),
    '',
    `For: ${short(order.name,36)}`,
    `Order #: ${order.id}`,
    `ETA: ${business.eta}`,
    `Deliver to: ${short(session.deliveryAddress,31)}`,
    dashes,
    ...itemLines,
    dashes,
    receiptLine('SUBTOTAL',money(order.subtotal),width),
    receiptLine('DELIVERY',money(order.delivery),width),
    receiptLine('SERVICE',money(order.service),width),
    dashes,
    receiptLine('TOTAL',`${money(order.total)} VUC`,width),
    noteBlock,
    dashes,
    'Status: Sent to restaurant',
    center('Need it? Nabit.',width),
    stars
  ].filter(x=>x!==null);

  return '```text\n' + body.join('\n') + '\n```';
}

client.once('ready',()=>console.log(`Nabit is online as ${client.user.tag}`));

client.on('interactionCreate', async interaction=>{
  try{
    const uid=interaction.user.id;

    if(interaction.isChatInputCommand() && interaction.commandName==='nabit'){
      const modal=new ModalBuilder().setCustomId('start_modal').setTitle('Welcome to Nabit');
      const name=new TextInputBuilder()
        .setCustomId('order_name').setLabel('Name for this order')
        .setPlaceholder('e.g. Dèja').setStyle(TextInputStyle.Short)
        .setRequired(true).setMaxLength(40);
      const address=new TextInputBuilder()
        .setCustomId('address').setLabel('Delivery address / location')
        .setPlaceholder('e.g. St. Marlowe Dorms').setStyle(TextInputStyle.Short)
        .setRequired(true).setMaxLength(80);
      modal.addComponents(
        new ActionRowBuilder().addComponents(name),
        new ActionRowBuilder().addComponents(address)
      );
      await interaction.showModal(modal);
      return;
    }

    if(interaction.isModalSubmit()){
      if(interaction.customId==='start_modal'){
        const s=sessionFor(uid);
        s.name=interaction.fields.getTextInputValue('order_name').trim();
        s.deliveryAddress=interaction.fields.getTextInputValue('address').trim();
        carts.set(uid,{businessId:null,items:[]});
        await interaction.reply({embeds:[homeEmbed(uid)],components:homeButtons(),ephemeral:true});
        return;
      }
      if(interaction.customId==='delivery_modal'){
        const s=sessionFor(uid);
        s.deliveryLabel=interaction.fields.getTextInputValue('label').trim() || 'Home';
        s.deliveryAddress=interaction.fields.getTextInputValue('address').trim();
        await interaction.reply({content:'Delivery info updated.',ephemeral:true});
        return;
      }
      if(interaction.customId==='name_modal'){
        sessionFor(uid).name=interaction.fields.getTextInputValue('order_name').trim();
        await interaction.reply({content:'Order name updated.',ephemeral:true});
        return;
      }
      if(interaction.customId==='note_modal'){
        sessionFor(uid).note=interaction.fields.getTextInputValue('note').trim();
        await interaction.reply({content:'Order note saved.',ephemeral:true});
        return;
      }
    }

    if(interaction.isButton()){
      if(interaction.customId==='home'){
        await interaction.update({content:'',embeds:[homeEmbed(uid)],components:homeButtons()}); return;
      }
      if(interaction.customId==='change_name'){
        const modal=new ModalBuilder().setCustomId('name_modal').setTitle('Change order name');
        const input=new TextInputBuilder()
          .setCustomId('order_name').setLabel('Name for this order')
          .setValue(sessionFor(uid).name || '').setStyle(TextInputStyle.Short)
          .setRequired(true).setMaxLength(40);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }
      if(interaction.customId==='delivery'){
        const s=sessionFor(uid);
        const modal=new ModalBuilder().setCustomId('delivery_modal').setTitle('Delivery info');
        const label=new TextInputBuilder()
          .setCustomId('label').setLabel('Location label')
          .setPlaceholder('Home, Dorm, Work').setValue(s.deliveryLabel || 'Home')
          .setStyle(TextInputStyle.Short).setRequired(true);
        const address=new TextInputBuilder()
          .setCustomId('address').setLabel('Address / location')
          .setValue(s.deliveryAddress || '').setStyle(TextInputStyle.Short)
          .setRequired(true).setMaxLength(80);
        modal.addComponents(
          new ActionRowBuilder().addComponents(label),
          new ActionRowBuilder().addComponents(address)
        );
        await interaction.showModal(modal);
        return;
      }
      if(interaction.customId==='browse'){
        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle('Browse Nabit').setDescription(
            businesses.map(b=>`**${b.name}**\n${b.description}\n${b.eta} • ${money(b.fee)} delivery`).join('\n\n')
          )],
          components:[businessSelect(),backHome()]
        });
        return;
      }
      if(interaction.customId==='bag' || interaction.customId==='edit_order'){
        await interaction.update({content:'',embeds:[bagEmbed(uid)],components:bagControls(uid)});
        return;
      }
      if(interaction.customId==='remove_item'){
        const c=cartFor(uid);
        if(!c.items.length){
          await interaction.reply({content:'Your bag is empty.',ephemeral:true});
          return;
        }
        await interaction.update({embeds:[bagEmbed(uid)],components:[removeSelect(uid),backHome()]});
        return;
      }
      if(interaction.customId==='clear'){
        carts.set(uid,{businessId:null,items:[]});
        sessionFor(uid).note='';
        await interaction.update({content:'',embeds:[bagEmbed(uid)],components:[backHome()]});
        return;
      }
      if(interaction.customId==='order_note'){
        const modal=new ModalBuilder().setCustomId('note_modal').setTitle('Order note');
        const note=new TextInputBuilder()
          .setCustomId('note').setLabel('Note for the restaurant')
          .setPlaceholder('e.g. No onions, please').setStyle(TextInputStyle.Paragraph)
          .setRequired(false).setMaxLength(200);
        if(sessionFor(uid).note) note.setValue(sessionFor(uid).note);
        modal.addComponents(new ActionRowBuilder().addComponents(note));
        await interaction.showModal(modal);
        return;
      }
      if(interaction.customId==='review_order'){
        if(!cartFor(uid).items.length){
          await interaction.reply({content:'Your bag is empty.',ephemeral:true});
          return;
        }
        await interaction.update({
          content:'',
          embeds:[reviewEmbed(uid)],
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
        sessionFor(uid).note='';
        await interaction.update({content:'Order canceled.',embeds:[],components:[backHome()]});
        return;
      }
      if(interaction.customId==='place_order'){
        const c=cartFor(uid);
        if(!c.items.length){
          await interaction.reply({content:'Your bag is empty.',ephemeral:true});
          return;
        }
        const b=findBusiness(c.businessId);
        const s=sessionFor(uid);
        const t=totals(uid);
        const id=Math.floor(10000+Math.random()*90000).toString();
        const order={
          id,
          userId:uid,
          businessId:c.businessId,
          items:[...c.items],
          total:t.total,
          subtotal:t.subtotal,
          delivery:t.delivery,
          service:t.service,
          status:'Confirmed',
          name:s.name,
          eta:b.eta
        };
        orders.set(id,order);

        // PUBLIC channel receipt.
        await interaction.channel.send({
          content: publicReceipt(order,b,s)
        });

        carts.set(uid,{businessId:null,items:[]});
        s.note='';

        await interaction.update({
          content:`Order #${id} placed! Your Nabit receipt was posted publicly in this channel.`,
          embeds:[],
          components:[new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('orders').setLabel('View Orders').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('home').setLabel('Home').setStyle(ButtonStyle.Secondary)
          )]
        });
        return;
      }
      if(interaction.customId==='orders'){
        const mine=[...orders.values()].filter(o=>o.userId===uid);
        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle('Your orders').setDescription(
            mine.length
              ? mine.slice(-8).reverse().map(o=>`**#${o.id}** • ${findBusiness(o.businessId)?.name}\n${o.status} • ${money(o.total)} • ${o.eta}`).join('\n\n')
              : 'No orders yet.'
          )],
          components:[backHome()]
        });
        return;
      }
    }

    if(interaction.isStringSelectMenu()){
      if(interaction.customId==='business_select'){
        const b=findBusiness(interaction.values[0]);
        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setAuthor({name:'nabit'}).setTitle(b.name)
            .setDescription(`${b.description}\n\n**${b.eta}** • ${money(b.fee)} delivery`)
            .addFields(Object.entries(b.categories).map(([cat,items])=>({
              name:cat,
              value:items.slice(0,8).map(i=>`${i.name} — **${money(i.price)}**`).join('\n')
            })))],
          components:[categorySelect(b),backHome()]
        });
        return;
      }

      if(interaction.customId.startsWith('category:')){
        const bid=interaction.customId.split(':')[1];
        const b=findBusiness(bid);
        const cat=interaction.values[0];
        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setAuthor({name:`nabit • ${b.name}`}).setTitle(cat)
            .setDescription(b.categories[cat].map(i=>`**${i.name}** — ${money(i.price)}`).join('\n\n'))],
          components:[itemSelect(b,cat),categorySelect(b),backHome()]
        });
        return;
      }

      if(interaction.customId.startsWith('item:')){
        const [,bid]=interaction.customId.split(':');
        const b=findBusiness(bid);
        const item=findItem(b,interaction.values[0]);
        let c=cartFor(uid);

        if(c.businessId && c.businessId!==bid){
          carts.set(uid,{businessId:bid,items:[]});
          c=cartFor(uid);
        }

        c.businessId=bid;
        const existing=c.items.find(i=>i.id===item.id);
        if(existing) existing.qty+=1;
        else c.items.push({...item,qty:1});

        await interaction.update({
          content:'',
          embeds:[new EmbedBuilder().setColor(GRAPE).setTitle(`${item.name} added`)
            .setDescription(`${money(item.price)}\n\nYour bag has ${c.items.reduce((s,i)=>s+i.qty,0)} item(s).`)],
          components:[new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bag').setLabel('View Bag').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('browse').setLabel('Keep Browsing').setStyle(ButtonStyle.Secondary)
          )]
        });
        return;
      }

      if(interaction.customId==='remove_select'){
        const c=cartFor(uid);
        const id=interaction.values[0];
        const item=c.items.find(i=>i.id===id);
        if(item){
          if(item.qty>1) item.qty-=1;
          else c.items=c.items.filter(i=>i.id!==id);
        }
        if(!c.items.length) c.businessId=null;
        await interaction.update({embeds:[bagEmbed(uid)],components:bagControls(uid)});
        return;
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

await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID),
  {body:commands}
);

console.log('Commands registered!');
client.login(process.env.DISCORD_TOKEN);
