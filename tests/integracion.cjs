const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(require('path').join(__dirname,'..',f),'utf8');
function context(extra={}){const c={console,Date,Math,JSON,...extra};c.window=c;vm.createContext(c);return c;}
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
function node(){const classes=new Set();return {innerHTML:'',textContent:'',value:'0',style:{},classList:{add:(...x)=>x.forEach(v=>classes.add(v)),remove:(...x)=>x.forEach(v=>classes.delete(v)),contains:x=>classes.has(x)},addEventListener(){}};}
(async()=>{
 let data,listeners=[],timer;
 function prune(value){
  if(value===undefined)throw Error('Firebase rechaza valores undefined');
  if(value===null)return null;
  if(typeof value!=='object')return value;
  const result=Array.isArray(value)?[]:{};
  Object.entries(value).forEach(([k,v])=>{const clean=prune(v);if(clean!==null)result[k]=clean;});
  return Object.keys(result).length?result:null;
 }

 const snap=()=>({val:()=>JSON.parse(JSON.stringify(data))});
 const ref={on:(e,fn)=>{listeners.push(fn);fn(snap());},transaction:async(fn,cb)=>{const next=fn(JSON.parse(JSON.stringify(data)));const committed=next!==undefined;if(committed){data=prune(next);if(data.countdownStart?.['.sv'])data.countdownStart=Date.now();listeners.slice().forEach(f=>f(snap()));}if(cb)cb(null,committed,snap());return {committed,snapshot:snap()};}};
 const phone=context({currentGame:'movies',bzTeam:'A',navigator:{},hideResult(){},hideBzCountdown(){},showBzCountdown(start,ms){phone.countdown={start,ms};},nowServer:Date.now,_bzPhase:'waiting',_gTurnBuzzed:null,_resultShownFor:null,_earlyTaps:0,_openedAt:null});
 const btn=node(),status=node();
 vm.runInContext(extract(read('index.html'),'function applyGroupBuzz(', '// ── BUZZER LISTENER'),phone);
 const host=context({setTimeout:fn=>{timer=fn;return 1;},clearTimeout:()=>{timer=null;},fbRef:ref,firebase:{database:{ServerValue:{TIMESTAMP:{'.sv':'timestamp'}}}},GROUP:true,gResetQueue(){},_buzzBlocked:null,_buzzCountdownTimer:null,BUZZ_COUNTDOWN_MS:3000,nameA:'A',nameB:'B',showToast(){}});
 vm.runInContext(read('team-maps.js'),host);vm.runInContext(read('buzzer-rounds.js'),host);
 data=host.BuzzerRounds.initial(host.BuzzerRounds.buildGroup(7,{teams:['A','B','C'],players:['A','B','C']},'round-seven'));data=prune(data);
 vm.runInContext(read('round-host.js'),host);host.attachRoundHost(ref,()=>{});
 listeners.push(s=>phone.applyGroupBuzz(s.val(),btn,status));
 vm.runInContext(extract(read('guess_Movies_Songs.html'),'async function fbOpenBuzzer(', '// Bloquear el buzzer'),host);
 assert(!Object.hasOwn(data.fixture,'names'),'Firebase elimina names vacío');
 await host.fbOpenBuzzer();assert.equal(data.state,'countdown');assert.equal(phone._bzPhase,'countdown');assert.equal(phone.countdown.ms,3000);assert(Number.isFinite(phone.countdown.start));assert(timer);
 await timer();assert.equal(data.state,'open');assert.equal(phone._bzPhase,'open');
 for(const [i,t] of ['A','B','C'].entries()){phone.bzTeam=t;await ref.transaction(cur=>host.BuzzerRounds.buzz(cur,'round-seven',t,t,100+i,cur.buzzId));assert.equal(phone._bzPhase,'won');assert(status.textContent.includes((i+1)+'°'));}
 assert.equal(data.queue.length,3);assert.equal((await ref.transaction(cur=>host.BuzzerRounds.buzz(cur,'round-seven','A','A',200,cur.buzzId))).committed,false);
 assert.equal((await ref.transaction(cur=>host.BuzzerRounds.buzz(cur,'old-round','B','B',200,cur.buzzId))).committed,false);
 const oldOpening=data.buzzId;await host.fbOpenBuzzer();assert.equal((data.queue||[]).length,0);assert.equal(data.state,'countdown');await timer();assert.equal(data.state,'open');assert.equal(host.BuzzerRounds.buzz(data,'round-seven','A','A',50,oldOpening),undefined,'Rechaza un toque atrasado de la apertura anterior');
 data.fixture.active=false;timer=null;await host.fbOpenBuzzer();assert.equal(timer,null);
 // Finalización real de Guess y recepción sin depender de rondas anteriores pendientes.
 let published;
 Object.assign(host,{GROUP:true,gTeams:['A','B','C'],gScores:{A:9,B:3,C:2},gFixtureId:'round-seven',confirm:()=>true,localStorage:{setItem(){}},fbDb:{ref:()=>({set:async r=>{published=r;}})}});
 vm.runInContext(extract(read('guess_Movies_Songs.html'),'async function gFinishRound(', 'function gBonusBtns('),host);await host.gFinishRound();assert.equal(published.byTeam.A,4);assert.equal(published.byTeam.B,1);
 Object.assign(host,{state:{f2:{},roundOrder:['duel:1','guess','argentinos','impostor','qld']},F2_FIXTURE:[[1,0,1,0]],GAMES_F2:['Mario Party','Guess Movie/Song','100 Argentinos Dicen'],TEAMS:['A','B','C'],saveState(){},_commonResults:{guess:published}});
 vm.runInContext(read('puntos.js'),host);vm.runInContext(read('common-rounds.js'),host);
 const row=host.commonAutoRows().find(r=>r.common==='guess');assert(row);assert(host.applyCommonAutoRow(row));assert.equal(host.state.guessRound.byTeam.A,4);
 // La publicación real de cartas y resultados acepta nombres con barra, puntos y otros caracteres.
 const assertKeys=value=>{if(!value||typeof value!=='object')return;Object.entries(value).forEach(([k,v])=>{assert(!/[.#$\/\[\]]/.test(k),'Clave inválida para Firebase: '+k);assertKeys(v);});};
 let live;host.fbStateRef={set:async value=>{assertKeys(value);live=value;}};host._lastFbStateJson=null;
 vm.runInContext(extract(read('guess_Movies_Songs.html'),'function fbPushState(', 'function startPartStateListener('),host);
 const label='Martín / Valentín',special='Equipo [2].#';
 host.fbPushState({type:'state',revealed:true,group:{teams:[label,special],scores:{[label]:3,[special]:1},queue:[],turn:-1}});
 assertKeys(live);assert.equal(host.FirebaseTeamMaps.fromWire(live).group.scores[label],3);
 host.gTeams=[label,special];host.gScores={[label]:8,[special]:1};await host.gFinishRound();assertKeys(published);
 assert.equal(host.FirebaseTeamMaps.fromWire(published).byTeam[label],4);
 // El editor se renderiza con todas las estaciones originales, incluso sin bonus_label.
 const els={};const rules=context({bracketQTexto:()=>'',document:{getElementById:id=>els[id]||(els[id]=node())},setTimeout(){},_reglasAllExpanded:false,_rulesEditMode:true,_ctrlPanelOpen:false,FINAL_CONFIG:null,FINAL_CONFIG_DEFAULT:{nota:'',intro:'',formato:'',puntos:''},COMODINES:[],COMODIN_WHEN_LABEL:{},F1_FIXTURE:[],F2_FIXTURE:[],TEAMS:['A','B','C'],state:{f1:{},f2:{}},canEditStations:()=>true,initReglasScrollSpy(){},RoundPlan:{order:()=>[]}});
 const html=read('velada.html');vm.runInContext(extract(html,'const RULES_DEFAULT =','function _applyRulesParsed'),rules);vm.runInContext('RULES_CONFIG=JSON.parse(JSON.stringify(RULES_DEFAULT));GAMES_F2=RULES_CONFIG.f2.map(g=>g.name);',rules);
 Object.assign(rules,{F1_FIXTURE:[],GAMES_F1:[],PLAYERS:rules.PLAYERS||[],TEAMS:rules.TEAMS||[],state:rules.state||{f1:{},f2:{}}});
 vm.runInContext(extract(html,'// Fases con cruces: f1','function computeAutoResultadosRows'),rules);
 vm.runInContext(extract(html,'function renderReglas()','// ── Chips sticky'),rules);
 // Todas las referencias de interfaz adicionales se resuelven explícitamente debajo.
 rules.renderReglas();assert(els['reglas-root'].innerHTML.includes('rule-edit-f2-7-bonus_label'));
 const output=els['reglas-root'].innerHTML;assert(output.indexOf('id="reglas-fase2"')<output.indexOf('id="reglas-impostor"'));assert(output.indexOf('id="reglas-impostor"')<output.indexOf('id="reglas-final"'));assert(output.includes('qld-rule-desc'));
 console.log('OK: cuenta regresiva conductor/celular, apertura, orden de tres equipos, duplicados, ronda obsoleta, reinicio de cola, publicación Guess e importación con ronda anterior pendiente; editor de reglas completo.');
})().catch(e=>{console.error(e);process.exitCode=1;});
