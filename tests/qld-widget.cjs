const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(require('path').join(__dirname,'..',f),'utf8');
(async()=>{
 let time=100000,data={},listeners=[];
 function resolve(v){if(!v||typeof v!=='object')return v;if(v['.sv']==='timestamp')return time;const out=Array.isArray(v)?[]:{};Object.entries(v).forEach(([k,x])=>{out[k]=resolve(x);});return out;}
 const snapshot=()=>({val:()=>structuredClone(data)}),emit=()=>listeners.slice().forEach(fn=>fn(snapshot()));
 const ref={on:(type,fn)=>{listeners.push(fn);fn(snapshot());return fn;},set:async value=>{data=resolve(value);emit();},transaction:async(fn,cb,local)=>{assert.equal(local,false,'No avisar un ganador provisional');const next=fn(structuredClone(data)),committed=next!==undefined;if(committed){data=resolve(next);emit();}if(cb)cb(null,committed,snapshot());return {committed,snapshot:snapshot()};}};
 function runtime(mode){const nodes={},parent={prepend(n){nodes[n.id]=n;},append(n){nodes[n.id]=n;}};const c={console,Math,Date:{now:()=>time},MODE:mode,teams:[{index:0,label:'Rojo',members:['Ana','Alex']},{index:1,label:'Azul',members:['Beto']},{index:2,label:'Verde',members:['Cami']}],fbBuzzerRef:ref,fbDb:{ref:path=>({on:(e,fn)=>fn({val:()=>path==='.info/connected'?true:0})})},firebase:{database:{ServerValue:{TIMESTAMP:{'.sv':'timestamp'}}}},BUZZ_COUNTDOWN_MS:3000,_buzzCountdownTimer:null,buzzerWinner:null,buzzerState:'locked',_winnerName:null,_winnerTeamIdx:null,_lastPhotoPopName:null,initFirebase(){},fbOpenBuzzer(){},fbLockBuzzer(){},applyBuzzerState(){},doAssign(){c.awards=(c.awards||0)+1;},closeAssign(){},toast(){},sfxBuzz(){},openAssignWithWinner(name){c.assignments.push(name);},assignments:[],renderBuzzerBanner(){},document:{getElementById:id=>nodes[id]||null,querySelector:()=>parent,body:parent,createElement:()=>({id:'',textContent:'',style:{}})},setInterval:fn=>{c.tick=fn;return 1;},clearTimeout(){},setTimeout:fn=>{c.open=fn;return 1;}};c.window=c;vm.createContext(c);vm.runInContext(read('qld-turns.js'),c);vm.runInContext(read('qld-timer.js'),c);c.nodes=nodes;return c;}
 const host=runtime('conductor'),tv=runtime('participant');ref.on('value',s=>host.applyBuzzerState(s.val()));
 await host.fbOpenBuzzer();assert.equal(data.state,'countdown');time+=3000;await host.open();assert.equal(data.state,'open');
 for(const name of ['Ana','Beto','Cami'])await ref.transaction(cur=>host.QldTurns.buzz(cur,cur.fixture.id,name,10,{'.sv':'timestamp'}),undefined,false);
 assert.equal(data.queue.length,3);assert.deepEqual(host.assignments,['Ana']);assert(host.nodes['qld-turn-clock'].textContent.includes('30 s'));assert(tv.nodes['qld-turn-clock'].textContent.includes('30 s'));
 time+=1000;host.tick();tv.tick();assert(tv.nodes['qld-turn-clock'].textContent.includes('29 s'));
 time+=29000;host.tick();await new Promise(setImmediate);assert.equal(data.winner.name,'Beto');assert(tv.nodes['qld-turn-clock'].textContent.includes('Beto · 30 s'));
 host.doAssign(0);assert(!host.awards);host.doAssign(1);assert.equal(host.awards,1);
 time+=30000;host.tick();await new Promise(setImmediate);assert.equal(data.winner.name,'Cami');assert(tv.nodes['qld-turn-clock'].textContent.includes('Cami · 30 s'));
 time+=30000;host.tick();await new Promise(setImmediate);assert(data.exhausted);assert(tv.nodes['qld-turn-clock'].textContent.includes('Nadie acertó'));
 await host.fbLockBuzzer();assert.equal(tv.nodes['qld-turn-clock'].style.display,'none');
 console.log('OK: widget real QLD conductor/TV, cuenta previa, cola confirmada, 30/29 segundos sincronizados, cambio automático, rechazo de equipo fuera de turno, cierre de pregunta.');
})().catch(e=>{console.error(e);process.exitCode=1;});
