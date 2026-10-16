// ROYALE EXPRESS - FINAL FETCH VERSION - 100% WORKS ON VERCEL
const SUPABASE_URL = "https://wowhqrlioaqskiyowtun.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvd2hxcmxpb2Fxc2tpeW93dHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc4ODUsImV4cCI6MjEwNzY3Mzg4NX0.m0WU-ktZEtEA4jvaeDbIaTskMSvvcqUPyz03HvRNhFM";

function generateTrackingNumber(){
  return `RE-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100000+Math.random()*900000)}`;
}

// Helper for Supabase REST API
async function supabaseInsert(payload){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shipments`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if(!res.ok) throw new Error(JSON.stringify(data));
  return data;
}
async function supabaseGetByTracking(code){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shipments?tracking_number=eq.${code}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  return data[0] || null;
}
async function supabaseGetAll(){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shipments?order=created_at.desc&limit=50`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return await res.json();
}
async function supabaseUpdate(code, updateData){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shipments?tracking_number=eq.${code}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if(!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// CREATE
window.createShipment = async function(){
  try{
    const sender = document.getElementById('senderName').value.trim();
    const receiver = document.getElementById('receiverName').value.trim();
    const rPhone = document.getElementById('receiverPhone')?.value.trim() || '';
    const origin = document.getElementById('origin').value.trim();
    const dest = document.getElementById('destination').value.trim();
    const content = document.getElementById('packageContent').value.trim();
    const weight = document.getElementById('packageWeight')?.value.trim() || '';
    const fee = document.getElementById('shippingFee')?.value.trim() || '';

    if(!sender || !receiver || !origin || !dest){
      alert('Fill Sender, Receiver, Origin, Destination');
      return;
    }

    const tracking = generateTrackingNumber();
    const btn = document.querySelector('.create-btn');
    if(btn){ btn.textContent = 'Saving...'; btn.disabled = true; }

    const payload = {
      tracking_number: tracking,
      sender, receiver, receiver_phone: rPhone,
      origin, destination: dest,
      package_content: content,
      package_weight: weight,
      shipping_fee: fee,
      status: "Package Received",
      image: "logo.png",
      company_logo: "logo.png",
      company_name: "Royale Express - Delivery Company",
      company_email: "royalexpressdelivery011@gmail.com",
      company_phone: "+17122121378",
      updates: [{date: new Date().toLocaleString(), location: origin, status: "Package Received", comment: "Shipment created at "+origin}]
    };

    await supabaseInsert(payload);

    if(btn){ btn.textContent = 'Generate Tracking & Save to Cloud'; btn.disabled = false; }

    const div = document.getElementById('generatedCode');
    div.style.display = 'block';
    div.innerHTML = `✅ SAVED TO CLOUD!<br>Tracking: <b style="font-size:22px;color:#D40511">${tracking}</b><br><a href="tracking.html?code=${tracking}" target="_blank">View Receipt + QR →</a>`;

    loadAllShipments();
    alert('Success! Tracking: '+tracking);
  }catch(e){
    alert('❌ ERROR: '+ e.message);
    console.error(e);
    const btn = document.querySelector('.create-btn');
    if(btn){ btn.textContent = 'Generate Tracking & Save to Cloud'; btn.disabled = false; }
  }
}

// UPDATE
window.addUpdate = async function(){
  try{
    const tracking = document.getElementById('updateTracking').value.trim();
    const status = document.getElementById('updateStatus').value;
    const location = document.getElementById('updateLocation').value.trim();
    const comment = document.getElementById('updateComment').value.trim();
    if(!tracking || !location){ alert('Enter tracking & location'); return; }

    const existing = await supabaseGetByTracking(tracking);
    if(!existing){ alert('Not found: '+tracking); return; }

    const newUpdates = [{date: new Date().toLocaleString(), location, status, comment: comment||status}, ...existing.updates];
    await supabaseUpdate(tracking, {status, updates: newUpdates});

    alert('✅ Comment added!');
    loadAllShipments();
  }catch(e){
    alert('❌ ERROR: '+e.message);
  }
}

window.trackShipment = function(){
  const code = document.getElementById('trackingInput')?.value.trim();
  if(!code){ alert('Enter tracking'); return; }
  location.href = `tracking.html?code=${code}`;
}

export async function displayResult(code){
  const container = document.getElementById('trackingDetails');
  if(!container) return;
  container.innerHTML = 'Searching cloud...';
  try{
    const s = await supabaseGetByTracking(code);
    if(!s){ container.innerHTML = `<div style="padding:30px;text-align:center"><h3 style="color:#D40511">❌ ${code} Not Found</h3></div>`; return; }

    setTimeout(()=>{
      const qrDiv=document.getElementById('qrcode');
      if(qrDiv && typeof QRCode!=='undefined'){
        qrDiv.innerHTML='';
        new QRCode(qrDiv,{text: window.location.href, width:90, height:90});
      }
    },600);

    const timelineHTML = s.updates.map(u=>`<div class="timeline-item"><strong>${u.status}</strong> - ${u.location}<br><small>${u.date}</small><p>${u.comment||''}</p></div>`).join('');

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:15px">
        <div><strong>Tracking:</strong> <span style="color:#D40511;font-weight:800">${s.tracking_number}</span></div>
        <div><span class="status-badge ${s.status.toLowerCase().includes('delivered')?'delivered':'in-transit'}">${s.status}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f9f9f9;padding:14px;border-radius:8px">
        <div><b>From:</b> ${s.origin}<br><b>Sender:</b> ${s.sender}</div>
        <div><b>To:</b> ${s.destination}<br><b>Receiver:</b> ${s.receiver}</div>
        <div><b>Content:</b> ${s.package_content}</div>
        <div><b>Date:</b> ${s.created_at ? new Date(s.created_at).toLocaleString() : ''}</div>
      </div>
      <div style="margin:20px 0;text-align:center"><img src="${s.company_logo||'logo.png'}" style="max-width:200px;border:3px solid #FFCC00;border-radius:8px"></div>
      <h3>History / Comments</h3><div class="timeline">${timelineHTML}</div>
    `;

    const wa=document.getElementById('waShare');
    if(wa) wa.href=`https://wa.me/17122121378?text=Track ${s.tracking_number}: ${window.location.href}`;

  }catch(e){
    container.innerHTML = `Error: ${e.message}`;
  }
}

async function loadAllShipments(){
  const div=document.getElementById('allShipments');
  if(!div) return;
  try{
    const data = await supabaseGetAll();
    if(!data || !data.length){ div.innerHTML='<p>No shipments yet</p>'; return; }
    div.innerHTML=data.map(s=>`<div style="background:#fff;padding:10px;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between"><span><b style="color:#D40511">${s.tracking_number}</b><br>${s.sender} → ${s.receiver} | ${s.status}</span><a href="tracking.html?code=${s.tracking_number}" target="_blank">View</a></div>`).join('');
  }catch(e){
    div.innerHTML = `<p style="color:red">Error: ${e.message}<br>Run SQL with DISABLE RLS</p>`;
  }
}
loadAllShipments();
