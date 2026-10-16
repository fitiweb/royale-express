const SUPABASE_URL = "https://wowhqrlioaqskiyowtun.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvd2hxcmxpb2Fxc2tpeW93dHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTc4ODUsImV4cCI6MjEwNzY3Mzg4NX0.m0WU-ktZEtEA4jvaeDbIaTskMSvvcqUPyz03HvRNhFM";
const COMPANY = {name:"Royale Express - Delivery Company",email:"royalexpressdelivery011@gmail.com",phone:"+17122121378",whatsapp:"+17122121378",logo:"logo.png"};
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
function generateTrackingNumber(){return `RE-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(100000+Math.random()*900000)}`;}
export async function createShipment(){
  const sender=document.getElementById('senderName').value.trim();
  const receiver=document.getElementById('receiverName').value.trim();
  const rPhone=document.getElementById('receiverPhone').value.trim();
  const origin=document.getElementById('origin').value.trim();
  const dest=document.getElementById('destination').value.trim();
  const content=document.getElementById('packageContent').value.trim();
  const weight=document.getElementById('packageWeight')?.value.trim()||'';
  const fee=document.getElementById('shippingFee')?.value.trim()||'';
  if(!sender||!receiver||!origin||!dest){alert('Fill required');return;}
  const tracking=generateTrackingNumber();
  const payload={tracking_number:tracking,sender,receiver,receiver_phone:rPhone,origin,destination:dest,package_content:content,package_weight:weight,shipping_fee:fee,status:"Package Received",image:COMPANY.logo,company_logo:COMPANY.logo,company_name:COMPANY.name,company_email:COMPANY.email,company_phone:COMPANY.phone,updates:[{date:new Date().toLocaleString(),location:origin,status:"Package Received",comment:"Shipment created at "+origin}]};
  const {error}=await supabase.from('shipments').insert([payload]);
  if(error){alert(error.message);return;}
  const div=document.getElementById('generatedCode');div.style.display='block';
  div.innerHTML=`✅ SAVED!<br>Tracking: <b style="font-size:22px;color:#D40511">${tracking}</b><br><a href="tracking.html?code=${tracking}" target="_blank">View Receipt + QR →</a>`;
  loadAllShipments();
}
window.createShipment=createShipment;
export async function addUpdate(){
  const tracking=document.getElementById('updateTracking').value.trim();
  const status=document.getElementById('updateStatus').value;
  const location=document.getElementById('updateLocation').value.trim();
  const comment=document.getElementById('updateComment').value.trim();
  if(!tracking||!location){alert('Enter tracking & location');return;}
  const {data,error}=await supabase.from('shipments').select('*').eq('tracking_number',tracking).single();
  if(error||!data){alert('Not found');return;}
  const newUpdates=[{date:new Date().toLocaleString(),location,status,comment:comment||status},...data.updates];
  await supabase.from('shipments').update({status,updates:newUpdates}).eq('tracking_number',tracking);
  alert('✅ Updated!');loadAllShipments();
}
window.addUpdate=addUpdate;
window.trackShipment=function(){const code=document.getElementById('trackingInput').value.trim();if(!code){alert('Enter tracking');return;}location.href=`tracking.html?code=${code}`;}
export async function displayResult(code){
  const container=document.getElementById('trackingDetails');
  container.innerHTML='Searching cloud...';
  const {data:s,[STRIPPED] supabase.from('shipments').select('*').eq('tracking_number',code).single();
  if(error||!s){container.innerHTML=`<div style="padding:30px;text-align:center"><h3 style="color:#D40511">❌ ${code} Not Found</h3><p>Contact: ${COMPANY.email}</p></div>`;return;}
  setTimeout(()=>{const qrDiv=document.getElementById('qrcode');if(qrDiv&&typeof QRCode!=='undefined'){qrDiv.innerHTML='';new QRCode(qrDiv,{text:window.location.href,width:90,height:90});}},600);
  const statusClass=s.status.toLowerCase().includes('delivered')?'delivered':'in-transit';
  let timelineHTML=s.updates.map(u=>`<div class="timeline-item"><strong>${u.status}</strong> - ${u.location}<br><small>${u.date}</small><p>${u.comment||''}</p></div>`).join('');
  container.innerHTML=`<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:15px"><div><strong>Tracking:</strong> <span style="color:#D40511;font-weight:800">${s.tracking_number}</span></div><div><span class="status-badge ${statusClass}">${s.status.toUpperCase()}</span></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f9f9f9;padding:14px;border-radius:8px"><div><b>From:</b> ${s.origin}<br><b>Sender:</b> ${s.sender}</div><div><b>To:</b> ${s.destination}<br><b>Receiver:</b> ${s.receiver}</div><div><b>Content:</b> ${s.package_content}</div><div><b>Date:</b> ${new Date(s.created_at).toLocaleString()}</div></div><div style="margin:20px 0;text-align:center"><img src="${s.company_logo||'logo.png'}" style="max-width:200px;border:3px solid #FFCC00;border-radius:8px"></div><h3>History / Comments</h3><div class="timeline">${timelineHTML}</div><div style="margin-top:15px;background:#FFF9E6;padding:12px;border-radius:8px;border-left:4px solid #FFCC00"><b>${s.company_name}</b><br>${s.company_email}<br>${s.company_phone}</div>`;
  const wa=document.getElementById('waShare');if(wa)wa.href=`https://wa.me/${COMPANY.whatsapp.replace('+','')}?text=Track ${s.tracking_number}: ${window.location.href}`;
}
async function loadAllShipments(){const div=document.getElementById('allShipments');if(!div)return;const {data}=await supabase.from('shipments').select('*').order('created_at',{ascending:false}).limit(50);if(!data||!data.length){div.innerHTML='<p>No shipments</p>';return;}div.innerHTML=data.map(s=>`<div style="background:#fff;padding:10px;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between"><span><b style="color:#D40511">${s.tracking_number}</b><br>${s.sender} → ${s.receiver} | ${s.status}</span><a href="tracking.html?code=${s.tracking_number}" target="_blank">View</a></div>`).join('');}
loadAllShipments();
