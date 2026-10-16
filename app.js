const SUPABASE_URL = "https://wowhqrlioaqskiyowtun.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvd2hxcmxpb2Fxc2tpeW93dHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc4ODUsImV4cCI6MjEwNzY3Mzg4NX0.m0WU-ktZEtEA4jvaeDbIaTskMSvvcqUPyz03HvRNhFM";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateTrackingNumber(){
  return `RE-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100000+Math.random()*900000)}`;
}

export async function createShipment(){
  try {
    const sender = document.getElementById('senderName').value.trim();
    const receiver = document.getElementById('receiverName').value.trim();
    const rPhone = document.getElementById('receiverPhone').value.trim();
    const origin = document.getElementById('origin').value.trim();
    const dest = document.getElementById('destination').value.trim();
    const content = document.getElementById('packageContent').value.trim();

    if(!sender ||!receiver ||!origin ||!dest){
      alert('Please fill Sender, Receiver, Origin, Destination');
      return;
    }

    const tracking = generateTrackingNumber();
    console.log("Trying to create:", tracking);

    // MINIMAL PAYLOAD - Works with ANY table version
    const payload = {
      tracking_number: tracking,
      sender: sender,
      receiver: receiver,
      receiver_phone: rPhone,
      origin: origin,
      destination: dest,
      package_content: content,
      status: "Package Received",
      image: "logo.png",
      updates: [{date: new Date().toLocaleString(), location: origin, status: "Package Received", comment: "Shipment created at "+origin}]
    };

    const btn = document.querySelector('.create-btn');
    if(btn){ btn.textContent = 'Saving to Supabase...'; btn.disabled = true; }

    const { data, error } = await supabase.from('shipments').insert([payload]).select();

    if(btn){ btn.textContent = 'Generate Tracking & Save to Cloud'; btn.disabled = false; }

    if(error){
      alert('❌ SUPABASE ERROR:\n' + error.message + '\n\nCode: ' + error.code + '\n\nGo to Supabase SQL Editor and run the SQL I gave you with DISABLE RLS.');
      console.error(error);
      return;
    }

    const div = document.getElementById('generatedCode');
    div.style.display = 'block';
    div.innerHTML = `✅ SAVED TO CLOUD SUCCESS!<br><br>Tracking: <b style="font-size:24px;color:#D40511">${tracking}</b><br><br><a href="tracking.html?code=${tracking}" target="_blank" style="background:#FFCC00;padding:10px 15px;border-radius:6px;text-decoration:none;color:#000;font-weight:800">View Receipt →</a><br><br>Share this with customer!`;

    loadAllShipments();

  } catch (e) {
    alert('JS Error: ' + e.message);
    console.error(e);
  }
}
window.createShipment = createShipment;

export async function addUpdate(){
  const tracking = document.getElementById('updateTracking').value.trim();
  const status = document.getElementById('updateStatus').value;
  const location = document.getElementById('updateLocation').value.trim();
  const comment = document.getElementById('updateComment').value.trim();
  if(!tracking ||!location){ alert('Enter tracking & location'); return; }
  const { data, error } = await supabase.from('shipments').select('*').eq('tracking_number', tracking).single();
  if(error ||!data){ alert('Not found: ' + tracking); return; }
  const newUpdates = [{date: new Date().toLocaleString(), location, status, comment: comment||status},...data.updates];
  const { error: upErr } = await supabase.from('shipments').update({status, updates: newUpdates}).eq('tracking_number', tracking);
  if(upErr){ alert(upErr.message); return; }
  alert('✅ Updated!');
  loadAllShipments();
}
window.addUpdate = addUpdate;
window.trackShipment = function(){ const code=document.getElementById('trackingInput').value.trim(); if(!code){alert('Enter tracking');return;} location.href=`tracking.html?code=${code}`; }

export async function displayResult(code){
  const container=document.getElementById('trackingDetails');
  container.innerHTML='Searching cloud...';
  const {data:s,[STRIPPED] supabase.from('shipments').select('*').eq('tracking_number',code).single();
  if(error||!s){container.innerHTML=`<div style="padding:30px;text-align:center"><h3 style="color:#D40511">❌ ${code} Not Found</h3></div>`;return;}
  setTimeout(()=>{const qrDiv=document.getElementById('qrcode');if(qrDiv&&typeof QRCode!=='undefined'){qrDiv.innerHTML='';new QRCode(qrDiv,{text:window.location.href,width:90,height:90});}},600);
  let timelineHTML=s.updates.map(u=>`<div class="timeline-item"><strong>${u.status}</strong> - ${u.location}<br><small>${u.date}</small><p>${u.comment||''}</p></div>`).join('');
  container.innerHTML=`<div><strong>Tracking:</strong> ${s.tracking_number} - ${s.status}</div><div>From: ${s.origin} To: ${s.destination}</div><div style="text-align:center;margin:15px"><img src="logo.png" style="max-width:180px"></div><div class="timeline">${timelineHTML}</div>`;
}
async function loadAllShipments(){
  const div=document.getElementById('allShipments');if(!div)return;
  const {data,error}=await supabase.from('shipments').select('*').order('created_at',{ascending:false}).limit(50);
  if(error){div.innerHTML='<p style="color:red">Error: '+error.message+'<br>Run SQL with DISABLE RLS</p>';return;}
  if(!data||!data.length){div.innerHTML='<p>No shipments yet</p>';return;}
  div.innerHTML=data.map(s=>`<div style="background:#fff;padding:10px;border-radius:6px;margin-bottom:8px"><b>${s.tracking_number}</b> - ${s.sender} → ${s.receiver} | ${s.status} <a href="tracking.html?code=${s.tracking_number}" target="_blank">View</a></div>`).join('');
}
loadAllShipments();
