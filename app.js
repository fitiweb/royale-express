// ROYALE EXPRESS - FULL PROFESSIONAL ADMIN + WAYBILL VERSION
const SUPABASE_URL = "https://wowhqrlioaqskiyowtun.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvd2hxcmxpb2Fxc2tpeW93dHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc4ODUsImV4cCI6MjEwNzY3Mzg4NX0.m0WU-ktZEtEA4jvaeDbIaTskMSvvcqUPyz03HvRNhFM";

function genTracking(){ return `RE-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100000+Math.random()*900000)}`; }
function genWaybill(){ return `WB-${Date.now().toString().slice(-8)}${Math.floor(100+Math.random()*900)}`; }

async function sbInsert(p){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shipments`,{method:'POST',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(p)});
  const d=await r.json(); if(!r.ok) throw new Error(JSON.stringify(d)); return d;
}
async function sbGetByTrack(code){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shipments?tracking_number=eq.${code}`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});
  const d=await r.json(); return d[0]||null;
}
async function sbGetAll(){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shipments?order=created_at.desc&limit=100`,{headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});
  return await r.json();
}
async function sbUpdate(code,upd){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shipments?tracking_number=eq.${code}`,{method:'PATCH',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(upd)});
  const d=await r.json(); if(!r.ok) throw new Error(JSON.stringify(d)); return d;
}
async function sbDelete(code){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/shipments?tracking_number=eq.${code}`,{method:'DELETE',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}});
  if(!r.ok){ const d=await r.text(); throw new Error(d); }
}

// CREATE SHIPMENT
window.createShipment = async function(){
  try{
    const sender = document.getElementById('senderName').value.trim();
    const sAddress = document.getElementById('senderAddress').value.trim();
    const receiver = document.getElementById('receiverName').value.trim();
    const rAddress = document.getElementById('receiverAddress').value.trim();
    const rPhone = document.getElementById('receiverPhone').value.trim();
    const origin = document.getElementById('origin').value.trim();
    const dest = document.getElementById('destination').value.trim();
    const content = document.getElementById('packageContent').value.trim();
    const weight = document.getElementById('packageWeight').value.trim();
    const fee = document.getElementById('shippingFee').value.trim();
    const shipDate = document.getElementById('shipmentDate').value;
    const expDate = document.getElementById('expectedDelivery').value;

    if(!sender || !receiver || !origin || !dest || !sAddress || !rAddress){ alert('Please fill Sender/Receiver Name, Addresses, Origin, Destination'); return; }

    const tracking = genTracking();
    const waybill = genWaybill();
    const btn=document.querySelector('.create-btn'); if(btn){btn.textContent='Saving...'; btn.disabled=true;}

    const payload={
      tracking_number: tracking,
      waybill_number: waybill,
      sender, sender_address: sAddress,
      receiver, receiver_address: rAddress,
      receiver_phone: rPhone,
      origin, destination: dest,
      package_content: content, package_weight: weight, shipping_fee: fee,
      shipment_date: shipDate ? new Date(shipDate).toISOString() : new Date().toISOString(),
      expected_delivery_date: expDate ? new Date(expDate).toISOString() : null,
      status: "Package Received",
      image:"logo.png", company_logo:"logo.png",
      company_name:"Royale Express - Delivery Company",
      company_email:"royalexpressdelivery011@gmail.com",
      company_phone:"+17122121378",
      is_cancelled:false,
      updates:[{date:new Date().toLocaleString(),location:origin,status:"Package Received",comment:`Shipment created - Waybill ${waybill}. From ${origin} to ${dest}`}],
    };

    await sbInsert(payload);
    if(btn){btn.textContent='Generate Tracking & Save to Cloud'; btn.disabled=false;}

    document.getElementById('generatedCode').style.display='block';
    document.getElementById('generatedCode').innerHTML=`✅ SAVED!<br>Tracking: <b style="font-size:20px;color:#D40511">${tracking}</b><br>Waybill: <b>${waybill}</b><br><a href="tracking.html?code=${tracking}" target="_blank">View Tracking →</a> | <a href="#" onclick="printWaybill('${tracking}');return false;">Print Waybill →</a>`;
    loadAllShipments();
    alert('Success! Tracking: '+tracking+' | Waybill: '+waybill);
  }catch(e){ alert('❌ '+e.message); console.error(e); const btn=document.querySelector('.create-btn'); if(btn){btn.textContent='Generate Tracking & Save to Cloud'; btn.disabled=false;} }
}

// UPDATE STATUS
window.addUpdate = async function(){
  try{
    const tracking=document.getElementById('updateTracking').value.trim();
    const status=document.getElementById('updateStatus').value;
    const location=document.getElementById('updateLocation').value.trim();
    const comment=document.getElementById('updateComment').value.trim();
    if(!tracking||!location){ alert('Enter tracking & location'); return; }
    const ex=await sbGetByTrack(tracking); if(!ex){ alert('Not found'); return; }
    const newUpdates=[{date:new Date().toLocaleString(),location,status,comment:comment||status},...ex.updates];
    await sbUpdate(tracking,{status,updates:newUpdates});
    alert('✅ Status updated!'); loadAllShipments();
  }catch(e){ alert('❌ '+e.message); }
}

// DELETE
window.deleteShipment = async function(tracking){
  if(!confirm(`DELETE shipment ${tracking}? This cannot be undone!`)) return;
  try{ await sbDelete(tracking); alert('🗑️ Deleted '+tracking); loadAllShipments(); }catch(e){ alert('❌ '+e.message); }
}

// CANCEL / UNCANCEL
window.toggleCancel = async function(tracking, currentCancelled){
  const action = currentCancelled ? 'UNCANCEL / RESTORE' : 'CANCEL';
  if(!confirm(`${action} shipment ${tracking}?`)) return;
  try{
    const ex=await sbGetByTrack(tracking);
    const newStatus = currentCancelled ? 'Package Received' : 'Cancelled';
    const newUpdates = [{date:new Date().toLocaleString(),location:ex.destination||ex.origin,status:newStatus,comment: currentCancelled ? 'Shipment restored by admin' : 'Shipment cancelled by admin'},...ex.updates];
    await sbUpdate(tracking,{is_cancelled:!currentCancelled,status:newStatus,updates:newUpdates});
    alert(`✅ ${action} done`); loadAllShipments();
  }catch(e){ alert('❌ '+e.message); }
}

// PRINT WAYBILL
window.printWaybill = async function(tracking){
  try{
    const s=await sbGetByTrack(tracking); if(!s){ alert('Not found'); return; }
    const win=window.open('','_blank','width=800,height=900');
    win.document.write(`
      <html><head><title>Waybill ${s.waybill_number||s.tracking_number}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;color:#222}
        .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #D40511;padding-bottom:12px}
        .header img{height:50px}
        .title{text-align:center;margin:14px 0;font-size:22px;font-weight:900;color:#D40511}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
        .box{border:1px solid #ccc;padding:12px;border-radius:8px}
        .box h4{background:#FFCC00;padding:6px 8px;margin:-12px -12px 10px -12px;border-radius:8px 8px 0 0;font-size:13px}
        .barcode{border:2px dashed #000;padding:10px;text-align:center;margin:16px 0;font-family:monospace;font-size:18px;letter-spacing:2px}
        .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:10px;font-size:11px;color:#666;display:flex;justify-content:space-between}
        @media print{button{display:none}}
      </style></head><body>
      <div class="header">
        <div><img src="logo.png"><br><b>Royale Express</b><br><span style="font-size:11px">Delivery Company</span></div>
        <div style="text-align:right;font-size:12px">Email: royalexpressdelivery011@gmail.com<br>Phone: +17122121378<br>Date: ${new Date().toLocaleString()}</div>
      </div>
      <div class="title">WAYBILL RECEIPT</div>
      <div class="barcode">*${s.waybill_number||s.tracking_number}* <br> ${s.tracking_number}<br>TRACKING: ${s.tracking_number}</div>
      <div class="grid">
        <div class="box"><h4>SHIPPER / SENDER</h4><b>${s.sender}</b><br>${s.sender_address||''}<br>Origin: ${s.origin}</div>
        <div class="box"><h4>RECEIVER / CONSIGNEE</h4><b>${s.receiver}</b><br>${s.receiver_address||''}<br>Dest: ${s.destination}<br>Phone: ${s.receiver_phone||''}</div>
        <div class="box"><h4>SHIPMENT DETAILS</h4>Content: ${s.package_content||''}<br>Weight: ${s.package_weight||''}<br>Fee: ${s.shipping_fee||''}<br>Status: ${s.status}</div>
        <div class="box"><h4>DATES</h4>Shipment Date: ${s.shipment_date ? new Date(s.shipment_date).toLocaleString() : new Date(s.created_at).toLocaleString()}<br>Expected Delivery: ${s.expected_delivery_date ? new Date(s.expected_delivery_date).toLocaleString() : 'N/A'}<br>Waybill: ${s.waybill_number||''}</div>
      </div>
      <div class="box"><h4>TERMS</h4><p style="font-size:11px">I confirm the details above are correct. Goods received in good condition. Subject to Royale Express terms.</p><br><br>Sender Signature: ____________________ &nbsp;&nbsp;&nbsp; Receiver Signature: ____________________</div>
      <div class="footer"><span>Track at: royale-express.vercel.app/tracking.html?code=${s.tracking_number}</span><span>Thank you for choosing Royale Express!</span></div>
      <button onclick="window.print()" style="margin-top:16px;padding:10px 20px;background:#D40511;color:#fff;border:none;border-radius:6px;font-weight:800;cursor:pointer">🖨️ Print This Waybill</button>
      </body></html>
    `);
    win.document.close();
  }catch(e){ alert('❌ '+e.message); }
}

window.trackShipment = function(){ const c=document.getElementById('trackingInput')?.value.trim(); if(c) location.href=`tracking.html?code=${c}`; }

export async function displayResult(code){
  const container=document.getElementById('trackingDetails'); if(!container) return;
  container.innerHTML='Searching cloud...';
  try{
    const s=await sbGetByTrack(code);
    if(!s){ container.innerHTML=`<div style="padding:30px;text-align:center"><h3 style="color:#D40511">❌ ${code} Not Found</h3></div>`; return; }
    setTimeout(()=>{ const qrDiv=document.getElementById('qrcode'); if(qrDiv && typeof QRCode!=='undefined'){ qrDiv.innerHTML=''; new QRCode(qrDiv,{text:window.location.href,width:100,height:100}); } },600);
    const timelineHTML=s.updates.map(u=>`<div class="timeline-item"><strong>${u.status}</strong> - ${u.location}<br><small>${u.date}</small><p>${u.comment||''}</p></div>`).join('');
    container.innerHTML=`
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:15px"><div><strong>Tracking:</strong> <span style="color:#D40511;font-weight:800">${s.tracking_number}</span><br><strong>Waybill:</strong> ${s.waybill_number||''} ${s.is_cancelled?'<span style="background:red;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px">CANCELLED</span>':''}</div><div><span class="status-badge ${s.is_cancelled?'delivered': s.status.toLowerCase().includes('delivered')?'delivered':'in-transit'}">${s.status}</span></div></div>
      <div class="info-grid"><div><b>From:</b> ${s.origin}<br><b>Sender:</b> ${s.sender}<br><small>${s.sender_address||''}</small></div><div><b>To:</b> ${s.destination}<br><b>Receiver:</b> ${s.receiver}<br><small>${s.receiver_address||''}<br>Phone: ${s.receiver_phone||''}</small></div><div><b>Content:</b> ${s.package_content||''}<br><b>Weight:</b> ${s.package_weight||''}</div><div><b>Shipment Date:</b> ${s.shipment_date?new Date(s.shipment_date).toLocaleString():''}<br><b>Expected:</b> ${s.expected_delivery_date?new Date(s.expected_delivery_date).toLocaleString():'N/A'}</div></div>
      <div style="margin:20px 0;text-align:center"><img src="${s.company_logo||'logo.png'}" style="max-width:200px;border:3px solid #FFCC00;border-radius:8px"></div>
      <h3>History / Comments</h3><div class="timeline">${timelineHTML}</div>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button onclick="printWaybill('${s.tracking_number}')" style="padding:8px 14px;background:#222;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Print Waybill</button></div>
    `;
    const wa=document.getElementById('waShare'); if(wa) wa.href=`https://wa.me/17122121378?text=Track ${s.tracking_number}: ${window.location.href}`;
  }catch(e){ container.innerHTML=`Error: ${e.message}`; }
}

async function loadAllShipments(){
  const div=document.getElementById('allShipments'); if(!div) return;
  try{
    const data=await sbGetAll();
    if(!data||!data.length){ div.innerHTML='<p>No shipments yet</p>'; return; }
    div.innerHTML=data.map(s=>`
      <div style="background:#fff;padding:14px;border-radius:8px;margin-bottom:10px;border-left:4px solid ${s.is_cancelled?'#999': s.status.toLowerCase().includes('delivered')?'#28a745':'#D40511'}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div><b style="color:#D40511">${s.tracking_number}</b> <small style="color:#666">WB:${s.waybill_number||''}</small> ${s.is_cancelled?'<span style="background:red;color:#fff;padding:2px 6px;border-radius:8px;font-size:10px">CANCELLED</span>':''}<br>${s.sender} → ${s.receiver} | ${s.origin} → ${s.destination}<br><small>Ship: ${s.shipment_date?new Date(s.shipment_date).toLocaleDateString():''} | Expected: ${s.expected_delivery_date?new Date(s.expected_delivery_date).toLocaleDateString():''} | Status: <b>${s.status}</b></small></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
            <a href="tracking.html?code=${s.tracking_number}" target="_blank" style="padding:6px 10px;background:#FFCC00;border-radius:6px;text-decoration:none;color:#000;font-weight:700;font-size:12px">View</a>
            <button onclick="printWaybill('${s.tracking_number}')" style="padding:6px 10px;background:#222;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">Waybill</button>
            <button onclick="toggleCancel('${s.tracking_number}',${s.is_cancelled})" style="padding:6px 10px;background:${s.is_cancelled?'#28a745':'#ff9800'};color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">${s.is_cancelled?'Restore':'Cancel'}</button>
            <button onclick="deleteShipment('${s.tracking_number}')" style="padding:6px 10px;background:#D40511;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">Delete</button>
          </div>
        </div>
        <div style="font-size:11px;color:#555;margin-top:6px">S-Addr: ${s.sender_address||''} | R-Addr: ${s.receiver_address||''}</div>
      </div>
    `).join('');
  }catch(e){ div.innerHTML=`<p style="color:red">Error: ${e.message}</p>`; }
}
loadAllShipments();
window.loadAllShipments=loadAllShipments;
