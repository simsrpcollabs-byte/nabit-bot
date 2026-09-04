import sharp from 'sharp';

const escapeXml = (s='') => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&apos;');

const money = n => `Ň${Number(n).toFixed(2)}`;

function fitText(text, max=32){
  const s = String(text);
  return s.length <= max ? s : s.slice(0,max-1) + '…';
}

export async function renderCheckout({ customerName, business, items, deliveryLabel='Home', deliveryAddress='Vitara City' }) {
  const subtotal = items.reduce((s,i)=>s+i.price*i.qty,0);
  const delivery = business.fee;
  const service = Math.max(1.50, subtotal*0.08);
  const total = subtotal + delivery + service;

  const shown = items.slice(0,5);
  const rowStart = 480;
  const rowH = 92;

  const rows = shown.map((i,idx)=>{
    const y = rowStart + idx*rowH;
    return `
      <g>
        <rect x="110" y="${y}" width="72" height="72" rx="18" fill="#E7E0FF"/>
        <text x="146" y="${y+45}" text-anchor="middle" font-size="26" font-weight="700" fill="#7257E8">n</text>
        <text x="205" y="${y+27}" font-size="26" font-weight="700" fill="#24212C">${escapeXml(fitText(i.name,29))}</text>
        <text x="205" y="${y+57}" font-size="20" fill="#7B7686">× ${i.qty}</text>
        <text x="800" y="${y+42}" text-anchor="end" font-size="25" font-weight="700" fill="#24212C">${money(i.price*i.qty)}</text>
        <line x1="205" y1="${y+78}" x2="800" y2="${y+78}" stroke="#EEE9F8"/>
      </g>`;
  }).join('');

  const extra = items.length > 5 ? `<text x="110" y="${rowStart+5*rowH+15}" font-size="20" fill="#7257E8">+ ${items.length-5} more item(s)</text>` : '';
  const boxBottom = rowStart + shown.length*rowH + (items.length>5?28:0) + 20;
  const noteY = boxBottom + 70;
  const promoY = noteY + 145;
  const paymentY = promoY + 145;
  const totalsY = paymentY + 190;
  const height = Math.max(1500, totalsY + 310);

  const svg = `
  <svg width="900" height="${height}" viewBox="0 0 900 ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="900" height="${height}" fill="#FFF9EE"/>
    <rect x="35" y="35" width="830" height="${height-70}" rx="60" fill="#FFFDF8" stroke="#24212C" stroke-width="8"/>
    <text x="90" y="105" font-size="24" font-weight="700" fill="#24212C">9:41</text>
    <rect x="350" y="68" width="200" height="48" rx="24" fill="#111"/>
    <text x="450" y="170" text-anchor="middle" font-size="34" font-weight="800" fill="#4F31C8">Checkout</text>
    <rect x="760" y="128" width="62" height="62" rx="18" fill="#7257E8"/>
    <text x="791" y="171" text-anchor="middle" font-size="38" font-weight="800" fill="#FFF">n</text>
    <circle cx="809" cy="144" r="6" fill="#F8DD57"/>

    <line x1="90" y1="210" x2="810" y2="210" stroke="#E9E3F5"/>
    <text x="95" y="250" font-size="22" fill="#6F6A7A">Order for</text>
    <text x="202" y="250" font-size="22" font-weight="700" fill="#24212C">${escapeXml(fitText(customerName,28))}</text>

    <text x="95" y="310" font-size="28" font-weight="800" fill="#24212C">Delivery to</text>
    <rect x="95" y="335" width="710" height="100" rx="22" fill="#FFF" stroke="#DCCFF8" stroke-width="2"/>
    <rect x="115" y="355" width="65" height="65" rx="18" fill="#7257E8"/>
    <text x="147" y="397" text-anchor="middle" font-size="28" font-weight="700" fill="#FFF">⌂</text>
    <text x="205" y="378" font-size="25" font-weight="700" fill="#24212C">${escapeXml(deliveryLabel)}</text>
    <text x="205" y="410" font-size="19" fill="#777280">${escapeXml(deliveryAddress)}</text>

    <text x="95" y="470" font-size="28" font-weight="800" fill="#24212C">Order summary</text>
    <rect x="95" y="${rowStart-15}" width="710" height="${boxBottom-rowStart+25}" rx="24" fill="#FFF" stroke="#DCCFF8" stroke-width="2"/>
    ${rows}
    ${extra}

    <text x="95" y="${noteY}" font-size="23" font-weight="700" fill="#24212C">Add a note for the restaurant</text>
    <text x="430" y="${noteY}" font-size="20" fill="#777280">(optional)</text>
    <rect x="95" y="${noteY+25}" width="710" height="72" rx="20" fill="#FFF" stroke="#DCCFF8" stroke-width="2"/>
    <text x="120" y="${noteY+70}" font-size="19" fill="#AAA4B5">E.g. No onions, please</text>

    <text x="95" y="${promoY}" font-size="23" font-weight="700" fill="#24212C">Promo code</text>
    <text x="245" y="${promoY}" font-size="20" fill="#777280">(optional)</text>
    <rect x="95" y="${promoY+25}" width="710" height="72" rx="20" fill="#FFF" stroke="#DCCFF8" stroke-width="2"/>
    <text x="120" y="${promoY+70}" font-size="19" fill="#AAA4B5">Enter promo code</text>
    <rect x="655" y="${promoY+25}" width="150" height="72" rx="20" fill="#F0E9FF"/>
    <text x="730" y="${promoY+69}" text-anchor="middle" font-size="22" font-weight="700" fill="#4F31C8">Apply</text>

    <text x="95" y="${paymentY}" font-size="23" font-weight="700" fill="#24212C">Payment method</text>
    <rect x="95" y="${paymentY+25}" width="168" height="120" rx="22" fill="#F8F3FF" stroke="#7257E8" stroke-width="3"/>
    <text x="179" y="${paymentY+72}" text-anchor="middle" font-size="23" font-weight="800" fill="#7257E8">VUC Wallet</text>
    <circle cx="179" cy="${paymentY+112}" r="12" fill="#7257E8"/>

    <rect x="278" y="${paymentY+25}" width="168" height="120" rx="22" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="362" y="${paymentY+72}" text-anchor="middle" font-size="22" fill="#24212C">Card</text>
    <circle cx="362" cy="${paymentY+112}" r="12" fill="#FFF" stroke="#8B8793" stroke-width="2"/>

    <rect x="461" y="${paymentY+25}" width="168" height="120" rx="22" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="545" y="${paymentY+72}" text-anchor="middle" font-size="20" fill="#24212C">Mobile Money</text>
    <circle cx="545" cy="${paymentY+112}" r="12" fill="#FFF" stroke="#8B8793" stroke-width="2"/>

    <rect x="644" y="${paymentY+25}" width="161" height="120" rx="22" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="724" y="${paymentY+72}" text-anchor="middle" font-size="22" fill="#24212C">Cash</text>
    <circle cx="724" cy="${paymentY+112}" r="12" fill="#FFF" stroke="#8B8793" stroke-width="2"/>

    <line x1="95" y1="${totalsY}" x2="805" y2="${totalsY}" stroke="#DDD7E8" stroke-dasharray="7 7"/>
    <text x="95" y="${totalsY+55}" font-size="22" fill="#24212C">Subtotal</text>
    <text x="805" y="${totalsY+55}" text-anchor="end" font-size="22" font-weight="700" fill="#24212C">${money(subtotal)}</text>
    <text x="95" y="${totalsY+95}" font-size="22" fill="#24212C">Delivery fee</text>
    <text x="805" y="${totalsY+95}" text-anchor="end" font-size="22" font-weight="700" fill="#24212C">${money(delivery)}</text>
    <text x="95" y="${totalsY+135}" font-size="22" fill="#24212C">Service fee</text>
    <text x="805" y="${totalsY+135}" text-anchor="end" font-size="22" font-weight="700" fill="#24212C">${money(service)}</text>
    <line x1="95" y1="${totalsY+160}" x2="805" y2="${totalsY+160}" stroke="#E7E0FF"/>
    <text x="95" y="${totalsY+215}" font-size="30" font-weight="800" fill="#24212C">Total</text>
    <text x="805" y="${totalsY+215}" text-anchor="end" font-size="32" font-weight="800" fill="#24212C">${money(total)} VUC</text>

    <rect x="95" y="${totalsY+245}" width="710" height="78" rx="38" fill="#F8DD57"/>
    <text x="450" y="${totalsY+295}" text-anchor="middle" font-size="28" font-weight="800" fill="#24212C">Place order</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
