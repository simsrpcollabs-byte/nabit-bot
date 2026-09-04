import sharp from 'sharp';

const xml = (s='') => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&apos;');

const money = n => `Ň${Number(n).toFixed(2)}`;
const fit = (s,max=34) => String(s).length <= max ? String(s) : String(s).slice(0,max-1)+'…';

function totals(business, items){
  const subtotal = items.reduce((s,i)=>s+i.price*i.qty,0);
  const delivery = business.fee;
  const service = Math.max(1.50, subtotal*0.08);
  return {subtotal,delivery,service,total:subtotal+delivery+service};
}

export async function renderCheckout({customerName,business,items,deliveryLabel,deliveryAddress,note=''}) {
  const t = totals(business,items);
  const shown = items.slice(0,5);
  const rows = shown.map((i,n)=>{
    const y = 500+n*88;
    return `
      <rect x="112" y="${y}" width="68" height="68" rx="18" fill="#E7E0FF"/>
      <text x="146" y="${y+44}" text-anchor="middle" font-size="26" font-weight="800" fill="#7257E8">n</text>
      <text x="205" y="${y+27}" font-size="24" font-weight="700" fill="#24212C">${xml(fit(i.name,30))}</text>
      <text x="205" y="${y+55}" font-size="18" fill="#807A89">× ${i.qty}</text>
      <text x="790" y="${y+40}" text-anchor="end" font-size="23" font-weight="700" fill="#24212C">${money(i.price*i.qty)}</text>
      <line x1="205" y1="${y+75}" x2="790" y2="${y+75}" stroke="#EEE9F8"/>`;
  }).join('');

  const extra = items.length>5 ? `<text x="112" y="${500+5*88+15}" font-size="18" fill="#7257E8">+ ${items.length-5} more item(s)</text>` : '';
  const orderBoxH = Math.max(120, shown.length*88 + (items.length>5?35:0) + 20);
  const noteY = 500 + orderBoxH + 55;
  const promoY = noteY + 135;
  const payY = promoY + 135;
  const totalY = payY + 185;
  const H = totalY + 330;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">
    <rect width="900" height="${H}" fill="#FFF9EE"/>
    <rect x="35" y="28" width="830" height="${H-56}" rx="58" fill="#FFFDF8" stroke="#24212C" stroke-width="8"/>

    <text x="92" y="92" font-size="23" font-weight="700" fill="#24212C">9:41</text>
    <rect x="350" y="56" width="200" height="48" rx="24" fill="#111"/>
    <text x="450" y="163" text-anchor="middle" font-size="33" font-weight="800" fill="#4F31C8">Checkout</text>
    <rect x="758" y="120" width="62" height="62" rx="17" fill="#7257E8"/>
    <text x="789" y="163" text-anchor="middle" font-size="38" font-weight="800" fill="#FFF">n</text>
    <circle cx="807" cy="137" r="6" fill="#F8DD57"/>

    <line x1="92" y1="202" x2="808" y2="202" stroke="#E7E0FF"/>
    <text x="96" y="242" font-size="20" fill="#777280">Order for</text>
    <text x="205" y="242" font-size="21" font-weight="700" fill="#24212C">${xml(fit(customerName,30))}</text>

    <text x="96" y="300" font-size="27" font-weight="800" fill="#24212C">Delivery to</text>
    <rect x="96" y="325" width="708" height="102" rx="22" fill="#FFF" stroke="#D9CDF6" stroke-width="2"/>
    <rect x="116" y="344" width="64" height="64" rx="17" fill="#7257E8"/>
    <text x="148" y="386" text-anchor="middle" font-size="29" font-weight="700" fill="#FFF">⌂</text>
    <text x="205" y="368" font-size="24" font-weight="700" fill="#24212C">${xml(deliveryLabel)}</text>
    <text x="205" y="401" font-size="18" fill="#777280">${xml(fit(deliveryAddress,48))}</text>

    <text x="96" y="475" font-size="27" font-weight="800" fill="#24212C">Order summary</text>
    <rect x="96" y="490" width="708" height="${orderBoxH}" rx="24" fill="#FFF" stroke="#D9CDF6" stroke-width="2"/>
    ${rows}
    ${extra}

    <text x="96" y="${noteY}" font-size="22" font-weight="700" fill="#24212C">Add a note for the restaurant</text>
    <text x="430" y="${noteY}" font-size="19" fill="#777280">(optional)</text>
    <rect x="96" y="${noteY+22}" width="708" height="70" rx="19" fill="#FFF" stroke="#D9CDF6" stroke-width="2"/>
    <text x="120" y="${noteY+65}" font-size="18" fill="#AAA4B5">${xml(note ? fit(note,65) : 'E.g. No onions, please')}</text>

    <text x="96" y="${promoY}" font-size="22" font-weight="700" fill="#24212C">Promo code</text>
    <text x="245" y="${promoY}" font-size="19" fill="#777280">(optional)</text>
    <rect x="96" y="${promoY+22}" width="708" height="70" rx="19" fill="#FFF" stroke="#D9CDF6" stroke-width="2"/>
    <text x="120" y="${promoY+65}" font-size="18" fill="#AAA4B5">Enter promo code</text>
    <rect x="654" y="${promoY+22}" width="150" height="70" rx="19" fill="#EFE8FF"/>
    <text x="729" y="${promoY+65}" text-anchor="middle" font-size="21" font-weight="700" fill="#4F31C8">Apply</text>

    <text x="96" y="${payY}" font-size="22" font-weight="700" fill="#24212C">Payment method</text>
    <rect x="96" y="${payY+22}" width="170" height="120" rx="21" fill="#F8F3FF" stroke="#7257E8" stroke-width="3"/>
    <text x="181" y="${payY+72}" text-anchor="middle" font-size="22" font-weight="800" fill="#7257E8">VUC Wallet</text>
    <circle cx="181" cy="${payY+108}" r="11" fill="#7257E8"/>
    <rect x="280" y="${payY+22}" width="165" height="120" rx="21" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="363" y="${payY+72}" text-anchor="middle" font-size="21" fill="#24212C">Card</text>
    <rect x="459" y="${payY+22}" width="165" height="120" rx="21" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="542" y="${payY+72}" text-anchor="middle" font-size="19" fill="#24212C">Mobile Money</text>
    <rect x="638" y="${payY+22}" width="166" height="120" rx="21" fill="#FFF" stroke="#DDD7E8" stroke-width="2"/>
    <text x="721" y="${payY+72}" text-anchor="middle" font-size="21" fill="#24212C">Cash</text>

    <line x1="96" y1="${totalY}" x2="804" y2="${totalY}" stroke="#DDD7E8" stroke-dasharray="7 7"/>
    <text x="96" y="${totalY+48}" font-size="21" fill="#24212C">Subtotal</text>
    <text x="804" y="${totalY+48}" text-anchor="end" font-size="21" font-weight="700" fill="#24212C">${money(t.subtotal)}</text>
    <text x="96" y="${totalY+88}" font-size="21" fill="#24212C">Delivery fee</text>
    <text x="804" y="${totalY+88}" text-anchor="end" font-size="21" font-weight="700" fill="#24212C">${money(t.delivery)}</text>
    <text x="96" y="${totalY+128}" font-size="21" fill="#24212C">Service fee</text>
    <text x="804" y="${totalY+128}" text-anchor="end" font-size="21" font-weight="700" fill="#24212C">${money(t.service)}</text>
    <line x1="96" y1="${totalY+150}" x2="804" y2="${totalY+150}" stroke="#E7E0FF"/>
    <text x="96" y="${totalY+205}" font-size="29" font-weight="800" fill="#24212C">Total</text>
    <text x="804" y="${totalY+205}" text-anchor="end" font-size="31" font-weight="800" fill="#24212C">${money(t.total)} VUC</text>

    <rect x="96" y="${totalY+235}" width="708" height="76" rx="38" fill="#F8DD57"/>
    <text x="450" y="${totalY+284}" text-anchor="middle" font-size="27" font-weight="800" fill="#24212C">Place order</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderConfirmation({customerName,business,items,orderId,total,eta}) {
  const H = 1180;
  const shown = items.slice(0,4);
  const rows = shown.map((i,n)=>{
    const y = 600+n*75;
    return `
      <text x="125" y="${y}" font-size="22" font-weight="700" fill="#24212C">${xml(fit(i.name,34))} × ${i.qty}</text>
      <text x="780" y="${y}" text-anchor="end" font-size="22" font-weight="700" fill="#24212C">${money(i.price*i.qty)}</text>`;
  }).join('');
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="${H}" viewBox="0 0 900 ${H}">
    <rect width="900" height="${H}" fill="#FFF9EE"/>
    <rect x="35" y="28" width="830" height="${H-56}" rx="58" fill="#FFFDF8" stroke="#24212C" stroke-width="8"/>
    <text x="92" y="92" font-size="23" font-weight="700" fill="#24212C">9:41</text>
    <rect x="350" y="56" width="200" height="48" rx="24" fill="#111"/>
    <text x="450" y="165" text-anchor="middle" font-size="25" font-weight="700" fill="#24212C">Order #${xml(orderId)}</text>
    <rect x="758" y="120" width="62" height="62" rx="17" fill="#7257E8"/>
    <text x="789" y="163" text-anchor="middle" font-size="38" font-weight="800" fill="#FFF">n</text>
    <circle cx="807" cy="137" r="6" fill="#F8DD57"/>

    <text x="95" y="250" font-size="47" font-weight="900" fill="#24212C">Order confirmed! ✓</text>
    <text x="95" y="295" font-size="22" fill="#777280">${xml(customerName)}, ${xml(business.name)} has your order.</text>

    <rect x="95" y="345" width="710" height="190" rx="28" fill="#E7E0FF"/>
    <text x="130" y="405" font-size="24" fill="#4F31C8">Estimated arrival</text>
    <text x="130" y="470" font-size="48" font-weight="900" fill="#24212C">${xml(eta)}</text>
    <text x="130" y="510" font-size="20" fill="#6F6A7A">Confirmed → Preparing → Picked up → Delivered</text>

    <text x="95" y="575" font-size="27" font-weight="800" fill="#24212C">Order summary</text>
    ${rows}

    <line x1="95" y1="930" x2="805" y2="930" stroke="#E7E0FF"/>
    <text x="95" y="990" font-size="28" font-weight="800" fill="#24212C">Total</text>
    <text x="805" y="990" text-anchor="end" font-size="31" font-weight="900" fill="#24212C">${money(total)} VUC</text>

    <rect x="95" y="1030" width="710" height="78" rx="39" fill="#7257E8"/>
    <text x="450" y="1080" text-anchor="middle" font-size="27" font-weight="800" fill="#FFF">Need it? Nabit.</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
