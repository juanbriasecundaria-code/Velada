const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(require('path').join(__dirname,'..',f),'utf8');
const context=c=>{c.window=c;vm.createContext(c);return c;};
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
(async()=>{
 const c=context({Date,Math});vm.runInContext(read('qld-turns.js'),c);
 let data={state:'open',fixture:{id:'question-1',active:true,teams:['0','1','2'],players:[{name:'Ana',side:'0'},{name:'Alex',side:'0'},{name:'Beto',side:'1'},{name:'Cami',side:'2'}]},queue:[],turn:0};
 let now=1000;
 for(const name of ['Ana','Beto','Cami'])data=c.QldTurns.buzz(data,'question-1',name,20,now);
 assert.deepEqual(JSON.parse(JSON.stringify(data.queue)).map(q=>q.name),['Ana','Beto','Cami']);assert.equal(data.winner.name,'Ana');assert.equal(c.QldTurns.remaining(data,now),30);
 assert.equal(c.QldTurns.buzz(data,'question-1','Alex',10,now),undefined);assert.equal(c.QldTurns.buzz(data,'old-question','Ana',10,now),undefined);
 assert.equal(c.QldTurns.advance(data,'question-1',0,now+29999,now+29999),undefined);
 now+=30000;data=c.QldTurns.advance(data,'question-1',0,now,now);assert.equal(data.winner.name,'Beto');assert.equal(c.QldTurns.remaining(data,now),30);
 assert.equal(c.QldTurns.advance(data,'question-1',0,now+30000,now+30000),undefined);
 now+=30000;data=c.QldTurns.advance(data,'question-1',1,now,now);assert.equal(data.winner.name,'Cami');assert.equal(c.QldTurns.remaining(data,now),30);
 now+=30000;data=c.QldTurns.advance(data,'question-1',2,now,now);assert.equal(data.state,'locked');assert(data.exhausted);assert.equal(data.winner,null);
 // Si el segundo equipo buzzea después del vencimiento del primero, también obtiene su turno completo.
 data={state:'open',fixture:{id:'question-2',active:true,teams:['0','1'],players:[{name:'Ana',side:'0'},{name:'Beto',side:'1'}]},queue:[],turn:0};data=c.QldTurns.buzz(data,'question-2','Ana',20,now);now+=30000;data=c.QldTurns.advance(data,'question-2',0,now,now);assert.equal(data.state,'open');assert.equal(data.winner,null);data=c.QldTurns.buzz(data,'question-2','Beto',30,now);assert.equal(c.QldTurns.remaining(data,now),30);
 const argentino=read('100_Argentinos_Dicen.html');
 const render=context({SLOTS:['a','b','c','d','e'],escapeHtml:String,pName:(snap,t)=>snap.names[t]});vm.runInContext(extract(argentino,'function pScoreRow(', 'function pStatus('),render);
 for(const count of [2,3,4,5]){const roster=Array.from({length:count},(_,i)=>({side:render.SLOTS[i],name:'Grupo '+i,score:i}));const html=render.pScoreRow({roster,names:{a:'Equipo 1',b:'Equipo 2'},score:{}},null);assert.equal((html.match(/class="rs-team /g)||[]).length,count);assert(html.includes('Grupo '+(count-1)));}
 assert(argentino.includes("fbDb.ref('argentinos/live').on"));assert(argentino.includes("fbDb.ref('argentinos/live').set"));
 // Formularios reales: misma cuadrícula y footer de dos acciones, sin links para abrir juegos.
 const els={};function el(){return {innerHTML:'',value:'2',classList:{add(){},remove(){}},setAttribute(){}};}
 const m=context({console,Date,Math,JSON,document:{getElementById:id=>els[id]||(els[id]=el()),body:{append(){}}},state:{f2:{},impostor:{rounds:[]}},TEAMS:['A / Ana','B / Beto'],PLAYERS:['Ana','Beto'],RULES_CONFIG:{impostor:{pts_noDescubierto:4,pts_descubierto:2}},F2_FIXTURE:[[1,0,1,0]],GAMES_F2:['Mario Party','Guess Movie/Song','100 Argentinos Dicen'],saveState(){},renderFase2(){},showToast(){}});
 vm.runInContext(read('puntos.js'),m);vm.runInContext(read('common-rounds.js'),m);
 for(const id of ['guess','argentinos','qld','impostor']){m.openCommonResultModal(id);const html=els['common-result-modal'].innerHTML;assert(html.includes('modal-player-btn common-result-card'));assert(html.includes('btn btn-ghost'));assert(html.includes('btn btn-primary'));assert(!html.includes('href='));assert(!html.includes('Abrir'));}
 m.openCommonResultModal('impostor');m.saveCommonResult();assert.equal(m.state.specialOverride[0],2);assert(m.commonRoundDone('impostor'));assert(!m.state.impostor.rounds.length);
 // No se anuncia un ganador provisional en el celular.
 assert(read('hub-rounds.js').includes('},false);'));assert(/\},false\);\n\}\n\n\/\/ ── SPLASH/.test(read('index.html')));
 const qld=read('quien_lo_dijo.html');assert(qld.includes('qld-timer.js'));assert(qld.includes('qld-turns.js'));
 console.log('OK: QLD cola de tres equipos, reloj 30/30/30, duplicados, turnos obsoletos, espera del siguiente; roster previo de 2–5 grupos y sincronización remota; cuatro modales sin Abrir juego; Impostor individual; transacciones sin avisos optimistas.');
})().catch(e=>{console.error(e);process.exitCode=1;});
