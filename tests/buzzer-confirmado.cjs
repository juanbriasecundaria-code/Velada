const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(require('path').join(__dirname,'..',f),'utf8');
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
let data={state:'open',turn:0,queue:[],fixture:{id:'pregunta',active:true,group:true,game:'qld',teams:['0','1','2'],players:[{name:'Ana',side:'0'},{name:'Beto',side:'1'},{name:'Cami',side:'2'}]}};
const jobs=[],clients=[],index=read('index.html');
for(const name of ['Ana','Beto','Cami']){
 const status={textContent:'',className:''},button={classList:{add(){},remove(){}}};
 const c={console,Date,JSON,Math,window:null,currentGame:'quien',bzTeam:name,bzMyName:null,GAME_META:{quien:{individual:true}},_bzPhase:'open',_openedAt:100000,_remoteBuzzConnected:true,_confirmedBuzzFixture:'pregunta',_gTurnBuzzed:null,_resultShownFor:null,_earlyTaps:0,navigator:{},document:{getElementById:()=>status},nowServer:()=>100010,hideResult(){},hideBzCountdown(){},showBzCountdown(){},showEarlyWarning(){},sfxTin(){c.sounds++;},sounds:0,checkSpeedRecord(){},bzListener:snap=>c.applyGroupBuzz(snap.val(),button,status),fbRef:{transaction:(fn,cb,local)=>{assert.equal(local,false);jobs.push({fn,cb,client:name});}},firebase:{database:{ServerValue:{TIMESTAMP:100010}}}};
 c.window=c;vm.createContext(c);vm.runInContext(read('qld-turns.js'),c);vm.runInContext(extract(index,'function applyGroupBuzz(', '// ── BUZZER LISTENER'),c);vm.runInContext(extract(index,'let _legacyBuzzPending=false;', '// ── SPLASH'),c);c.status=status;clients.push(c);
 c.doBuzz();assert.equal(c.sounds,0);assert.equal(status.textContent,'Enviando toque…');assert.equal(c._bzPhase,'open');c.doBuzz();
}
assert.equal(jobs.length,3,'No duplica transacciones por toques repetidos mientras espera confirmación');
for(const who of ['Beto','Ana','Cami']){
 const job=jobs.find(j=>j.client===who);data=job.fn(structuredClone(data));assert(data);
 const snap={val:()=>structuredClone(data)};clients.forEach(c=>c.bzListener(snap));job.cb(null,true,snap);
}
assert.deepEqual(JSON.parse(JSON.stringify(data.queue)).map(q=>q.name),['Beto','Ana','Cami']);assert.equal(data.winner.name,'Beto');
for(const c of clients){assert(c.status.textContent.includes('Beto'));assert.equal(c.sounds,1);}
assert(clients[1].status.textContent.includes('1°'));assert(clients[0].status.textContent.includes('2°'));assert(clients[2].status.textContent.includes('3°'));
console.log('OK: funciones reales del index en tres clientes simulados esperan confirmación, servidor ordena B/A/C, todos muestran Beto primero; no hay ganador provisional ni transacciones duplicadas.');
