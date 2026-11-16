// The server reference owns privacy. This page only renders its authorized projection.
const runtime=window.tendril,$=s=>document.querySelector(s);let assignment=null,pending=null,revision=0,booted=false,key='';
const read=()=>runtime.request('workflows/private-responses/mine',{method:'POST',body:{cid:crypto.randomUUID(),expected_generations:{},data:{}}});
function save(){if(!key)return;try{localStorage.setItem(key,JSON.stringify({text:$('#answer').value,pending}));}catch{$('#status').textContent='Draft storage unavailable; keep this page open until an outcome.';}}
function unavailable(text){assignment=null;$('#form').hidden=true;$('#answer').value='';$('#prompt').textContent='Response unavailable';$('#status').textContent=text;}
async function start(){if(booted)return;booted=true;if(!runtime.service?.workflows.some(w=>w.id==='private-responses')){unavailable('This task requires an explicitly installed private-response capability.');return;}
 try{const result=await read();assignment=result.assignments[0];if(!assignment){unavailable('No current assignment is available to this identity.');return;}
 $('#prompt').textContent=assignment.prompt;key=`private-answer:${runtime.identity.page}:${assignment.id}`;
 // Only inspect this cached draft after the current authorized projection returns its assignment ID.
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){$('#answer').value=String(saved.text||'');pending=saved.pending?.body?.data?.assignment===assignment.id?saved.pending:null;}}catch{}
 $('#form').hidden=false;$('#retry').hidden=!pending;$('#status').textContent=pending?'A previous response needs its original retry or review.':'Ready for your private answer.';
 }catch(error){unavailable(error.message);}}
async function send(){if(!pending)return;$('#submit').disabled=true;const sent=pending;
 try{const result=await runtime.request('workflows/private-responses/submit',{method:'POST',body:sent.body});if(assignment?.id!==sent.body.data.assignment)return;
 assignment.response=result;$('#receipt').hidden=false;$('#receipt').textContent=`Accepted revision ${result.revision}: ${sent.body.data.answer}`;
 if(revision===sent.draftRevision&&$('#answer').value===sent.body.data.answer)$('#answer').value='';pending=null;$('#retry').hidden=true;$('#status').textContent='Response accepted. New typing is a separate draft.';save();
 }catch(error){$('#receipt').hidden=false;$('#receipt').textContent=`Original response retained: ${sent.body.data.answer}`;$('#status').textContent=`Not accepted: ${error.message}. Retry keeps the original command and generation.`;$('#retry').hidden=false;save();}finally{$('#submit').disabled=false;}}
$('#answer').addEventListener('input',()=>{revision++;save();});$('#form').addEventListener('submit',event=>{event.preventDefault();if(!assignment||pending)return;const answer=$('#answer').value.trim();if(!answer)return;pending={draftRevision:revision,body:{cid:crypto.randomUUID(),...runtime.scopes.capture('private-responses:round'),data:{assignment:assignment.id,answer,expected_revision:assignment.response?.revision||0}}};save();void send();});$('#retry').addEventListener('click',()=>void send());
runtime.on('role',()=>{if(!booted)return;assignment=null;pending=null;key='';$('#answer').value='';booted=false;void start();});if(runtime.connected)void start();else runtime.on('connect',()=>void start());
