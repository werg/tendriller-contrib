// Independently authored mobile model: latest reading plus twenty raw records.
const runtime=window.tendril,storageKey=`instrument:${runtime.identity.page}:${runtime.device.id}:v1`;
const view=document.querySelector('#reading'),select=document.querySelector('#run');
let checkpoint={schema:1,after:0,incomplete:false,observations:[],removed:0},painting=false,started=false,unsubscribe=()=>{};
const text=(selector,value)=>{document.querySelector(selector).textContent=value;};
function draw(){painting=false;const identities=[...new Set(checkpoint.observations.map(r=>JSON.stringify([r.source,r.run,r.unit])))],chosen=select.value;
 select.replaceChildren(...identities.map(key=>{const option=document.createElement('option'),[source,run]=JSON.parse(key);option.value=key;option.textContent=`${source} / ${run}`;return option;}));if(identities.includes(chosen))select.value=chosen;
 const selected=checkpoint.observations.filter(r=>JSON.stringify([r.source,r.run,r.unit])===select.value),latest=selected.at(-1);
 view.textContent=latest?(latest.y===null?'Missing':String(latest.y)):'—';text('#units',latest?.unit||'');text('#freshness',latest?`Observed at step ${latest.x}`:'Waiting for an observation');
 document.querySelector('#values').replaceChildren(...selected.map(r=>{const li=document.createElement('li');li.textContent=`Step ${r.x}: ${r.y===null?'Missing':r.y} ${r.unit}`;return li;}));
 document.querySelector('#gap').hidden=!checkpoint.incomplete;const budget=document.querySelector('#budget');budget.textContent=`Cursor ${checkpoint.after}; ${checkpoint.observations.length}/20 displayed, ${checkpoint.removed} evicted`;budget.dataset.cursor=String(checkpoint.after);
 try{localStorage.setItem(storageKey,JSON.stringify(checkpoint));text('#status','Authorized reading. Display and cursor saved together.');}catch{text('#status','Persistence unavailable. Current reading remains visible.');}
}
function queue(){if(!painting){painting=true;requestAnimationFrame(draw);}}
async function begin(){if(started)return;started=true;try{
 await runtime.streams.info('measurements'); // Cached values stay hidden until current access succeeds.
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved){if(saved.schema!==1||!Number.isSafeInteger(saved.after)||saved.after<0||typeof saved.incomplete!=='boolean'||!Number.isSafeInteger(saved.removed)||saved.removed<0||!Array.isArray(saved.observations)||saved.observations.length>20||saved.observations.some(r=>!Number.isSafeInteger(r.seq)||r.seq<1||r.seq>saved.after||!Number.isFinite(r.x)||!(r.y===null||Number.isFinite(r.y))||![r.source,r.run,r.unit].every(v=>typeof v==='string')))throw Error('Invalid instrument checkpoint');checkpoint=saved;}}catch{checkpoint={schema:1,after:0,incomplete:false,observations:[],removed:0};}
 draw();unsubscribe=runtime.streams.subscribe('measurements',record=>{if(record.seq<=checkpoint.after)return;const d=record.data;if(!d||!Number.isFinite(d.x)||![d.source,d.run,d.unit].every(v=>typeof v==='string'))throw Error('Invalid instrument observation');checkpoint.observations.push({seq:record.seq,x:d.x,y:Number.isFinite(d.y)?d.y:null,source:d.source,run:d.run,unit:d.unit});if(checkpoint.observations.length>20){checkpoint.observations.shift();checkpoint.removed++;}checkpoint.after=record.seq;queue();},{after:checkpoint.after,onGap(){checkpoint.incomplete=true;queue();},onError(error){text('#status',error.message);}});
 }catch(error){text('#status',`Unavailable: ${error.message}`);}}
select.addEventListener('change',draw);addEventListener('pagehide',()=>{unsubscribe();if(painting)draw();});if(runtime.connected)void begin();else runtime.on('connect',()=>void begin());

runtime.on('role',async()=>{if(!started)return;try{await runtime.streams.info('measurements');}catch{checkpoint={schema:1,after:0,incomplete:false,observations:[],removed:0};draw();try{localStorage.removeItem(storageKey);}catch{}text('#status','Access is unavailable; private cached readings were cleared.');}});
