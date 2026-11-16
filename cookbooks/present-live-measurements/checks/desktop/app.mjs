// Page-owned adaptation: a dense exact-value observatory. No component mount API.
const api=window.tendril,limit=60,key=`observatory:${api.identity.page}:${api.device.id}:v1`;
const $=s=>document.querySelector(s),blank=()=>({version:1,cursor:0,gap:false,discarded:0,records:[]});
let model=blank(),scheduled=false,started=false,stop=()=>{},persistence='';
function valid(m){return m&&m.version===1&&Number.isSafeInteger(m.cursor)&&m.cursor>=0&&typeof m.gap==='boolean'&&Number.isSafeInteger(m.discarded)&&m.discarded>=0&&Array.isArray(m.records)&&m.records.length<=limit&&m.records.every(r=>Number.isSafeInteger(r.seq)&&r.seq>0&&r.seq<=m.cursor&&Number.isFinite(r.x)&&(r.y===null||Number.isFinite(r.y))&&[r.source,r.run,r.unit].every(v=>typeof v==='string'));}
function paint(){
 scheduled=false;
 try{localStorage.setItem(key,JSON.stringify(model));persistence='';}catch{persistence=' Persistence unavailable; the previous checkpoint remains.';}
 const groups=new Map();for(const r of model.records){const id=JSON.stringify([r.source,r.run,r.unit]);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);}
 const panels=[];for(const records of groups.values()){
  const first=records[0],x=Number($('#inspect').value),exact=records.findLast(r=>r.x===x),panel=document.createElement('article');panel.className='panel';
  const title=document.createElement('h2');title.textContent=`${first.source} / ${first.run}`;const value=document.createElement('strong');value.textContent=exact?.y===null||!exact?'Missing':String(exact.y);
  const note=document.createElement('p');note.textContent=`${first.unit} · step ${x}${$('#log').checked&&exact&&exact.y!==null&&exact.y<=0?' · not plotted on log scale':''}`;panel.append(title,value,note);panels.push(panel);
 }
 $('#series').replaceChildren(...panels);$('#raw').replaceChildren(...model.records.map(r=>{const tr=document.createElement('tr');for(const text of [`${r.source} / ${r.run}`,r.x,r.y===null?'Missing':r.y,r.unit]){const td=document.createElement('td');td.textContent=String(text);tr.append(td);}return tr;}));
 $('#gap').hidden=!model.gap;$('#budget').textContent=`Cursor ${model.cursor} · ${model.records.length} retained · ${model.discarded} evicted from this display`;$('#budget').dataset.cursor=String(model.cursor);
 $('#status').textContent=`Authorized · ${groups.size} source/run series.${persistence}`;
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(paint);}}
function ingest(record){
 if(record.seq<=model.cursor)return;const d=record.data;
 if(!d||!Number.isFinite(d.x)||![d.source,d.run,d.unit].every(v=>typeof v==='string'))throw Error('Unexpected instrument schema');
 model.records.push({seq:record.seq,x:d.x,y:Number.isFinite(d.y)?d.y:null,source:d.source,run:d.run,unit:d.unit});if(model.records.length>limit){model.records.shift();model.discarded++;}model.cursor=record.seq;schedule();
}
async function start(){if(started)return;started=true;
 try{await api.streams.info('measurements');try{const data=localStorage.getItem(key);if(data){const saved=JSON.parse(data);if(!valid(saved))throw Error('Invalid checkpoint');model=saved;}}catch{model=blank();persistence=' Rebuilt both cursor and view after unusable checkpoint.';}
 paint();stop=api.streams.subscribe('measurements',ingest,{after:model.cursor,onGap(){model.gap=true;schedule();},onError(error){$('#status').textContent=error.message;}});
 }catch(error){$('#status').textContent=`Unavailable: ${error.message}`;}
}
$('#inspect').addEventListener('input',schedule);$('#log').addEventListener('change',schedule);
addEventListener('pagehide',()=>{stop();if(scheduled)paint();});
if(api.connected)void start();else api.on('connect',()=>void start());

api.on('role',async()=>{if(!started)return;try{await api.streams.info('measurements');}catch{model=blank();paint();try{localStorage.removeItem(key);}catch{}$('#status').textContent='Access is unavailable; private cached readings were cleared.';}});
