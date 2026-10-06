// Fases nuevas conectadas a los juegos digitales: activar ronda desde su fixture y cargar resultados desde Firebase (simulado).
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=read('velada.html');
const core=html.slice(html.indexOf('// <fases-core>'),html.indexOf('// </fases-core>'));
function el(tag){const e={tag,children:[],attrs:{},innerHTML:'',className:'',id:'',parentNode:null,
 setAttribute(k,v){this.attrs[k]=v;},remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);},
 insertBefore(n,ref){n.parentNode=this;const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);},
 querySelectorAll(sel){return this.children.filter(c=>sel==='[data-fx]'&&c.attrs['data-fx']);},get nextSibling(){const i=this.parentNode.children.indexOf(this);return this.parentNode.children[i+1]||null;}};return e;}
const nav=el('nav'),body=el('body'),f2tab=el('div');f2tab.attrs['data-tab']='fase2';nav.insertBefore(f2tab);f2tab.parentNode=nav;
const finalPage=el('div');finalPage.id='page-final';body.insertBefore(finalPage);
const ctx={console,JSON,Math,Date,PLAYERS:['Ana','Beto','Cami','Dani'],TEAMS:['Ana / Beto','Cami / Dani','Eli / Fer'],FULL_NAMES:{},
 GAMES_F2:['Mario Party','Palabras a Tiempo','Beer Pong'],GAMES_F1:[],F1_FIXTURE:[],F2_FIXTURE:[[1,0,1,1]],toasts:[],confirm:()=>true,prompt:()=>'x',tabs:[]};
ctx.window=ctx;ctx.showToast=(i,m)=>ctx.toasts.push(m);ctx.saveState=()=>{};ctx.goTab=t=>ctx.tabs.push(t);ctx.activateTab=t=>ctx.tabs.push('act:'+t);
ctx.document={querySelector:s=>s==='.nav-tabs'?nav:s==='.nav-tab[data-tab="fase2"]'?f2tab:null,querySelectorAll:s=>s==='.page[data-fx]'?body.children.filter(c=>c.attrs['data-fx']):[],
 getElementById:id=>id==='page-final'?finalPage:body.children.find(c=>c.id===id)||null,createElement:el};
vm.createContext(ctx);
vm.runInContext('var state={f1:{},f2:{},lastTab:null};'+core+'ensurePhases();',ctx);
for(const f of ['buzzer-rounds.js','fases-view.js'])vm.runInContext(read(f),ctx);
// helpers y funciones reales del hub para el modal de resultados
vm.runInContext(html.slice(html.indexOf('function primeraRondaNoCargada'),html.indexOf("// 'a'/'b'/'empate'")),ctx);
vm.runInContext(html.slice(html.indexOf("// 'a'/'b'/'empate'"),html.indexOf('async function openAutoResultadosModal')),ctx);
vm.runInContext(html.slice(html.indexOf('function gameConfigByName'),html.indexOf('let modalCtx')),ctx);
vm.runInContext(html.slice(html.indexOf('function bonusPtsExtra'),html.indexOf('function previewPts')),ctx);
vm.runInContext(html.slice(html.indexOf('function applyResultadoSilencioso'),html.indexOf('// CARGAR RESULTADOS AUTOM')),ctx);
ctx.commonAutoRows=()=>[];ctx.ensureCommonRoundOrder=()=>[];ctx.commonRoundDone=()=>true;ctx.resolvePendingComodines=()=>[];
ctx.commonRoundNumber=id=>Number(String(id).replace('duel:',''));
ctx.RULES_CONFIG=null;
vm.runInContext(read('fases-extra.js'),ctx);
const FX=ctx.FasesExtra;

// Fase nueva grupal con Palabras a Tiempo (digital) y Beer Pong (físico)
vm.runInContext("getPhases().push({id:'f3',nombre:'Duelos <b>',tipo:'grupal',emoji:'🏁',games:['Palabras a Tiempo','Beer Pong'],fixture:[[1,0,1,0],[1,2,2,1],[2,0,2,1]],clasifican:{cantidad:0,tamanoGrupo:1}});ensurePhases();",ctx);
FX.init();
const page=FX.render&&ctx.document.getElementById('page-fx-f3');
FX.render('f3');
const pg=ctx.document.getElementById('page-fx-f3').innerHTML;
assert(pg.includes('activateBuzzerRound(\'f3\',1,this)'),'botón Activar ronda en la ronda con juego digital');
assert(!pg.includes('activateBuzzerRound(\'f3\',2,'),'sin botón si la ronda solo tiene juegos físicos');
assert(pg.includes('openAutoResultadosModal()'),'botón Cargar resultados automáticamente');

// 1) Activación: se publica en la estación del juego con la fase nueva, y se cierran las otras estaciones
let updates;ctx._rtdb={ref:()=>({update:async u=>{updates=u;}})};
vm.runInContext(read('velada-rounds.js'),ctx);
(async()=>{
  await ctx.activateBuzzerRound('f3',1,null);
  const st=updates[ctx.BuzzerRounds.paths.palabras];
  assert(st&&st.fixture&&st.fixture.phase==='f3'&&st.fixture.round===1&&st.fixture.key==='1-0-1','estación Palabras con cruce de f3');
  assert.deepEqual(st.fixture.names,{a:'Ana / Beto',b:'Cami / Dani'});
  assert(st.fixture.players.some(p=>p.name==='Ana'&&p.side==='a'));
  assert.equal(updates[ctx.BuzzerRounds.paths.erudito+'/fixture'].active,false);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.state.activeMatches)),[{phase:'f3',key:'1-0-1'}]);

  // 2) El fixture publicado incluye la fase nueva (syncFixtureToFirebase real)
  vm.runInContext(html.slice(html.indexOf('window._fixtureFirma = null;'),html.indexOf('function computeLiveTotals')),ctx);
  let fixPayload;ctx._rtdb={ref:p=>({set:async v=>{if(p==='velada/fixture')fixPayload=JSON.parse(JSON.stringify(v));}})};
  ctx.syncFixtureToFirebase();
  assert(fixPayload&&fixPayload.f3&&fixPayload.f3.games[0]==='Palabras a Tiempo'&&fixPayload.f3.fixture.length===3&&fixPayload.f3.teams.length===3,'fixture de f3 en velada/fixture');
  assert(fixPayload.f2&&fixPayload.f2.fixture.length===1,'f2 sigue publicándose igual');

  // 3) Carga automática: marcador del juego en velada/resultados → fila 'auto' de f3, solo ganador/empate
  ctx._autoResultados={'f3-1-0-1':{winner:'a',marcador:{a:7,b:2},bonusInfo:{},t:1}};
  const rows=ctx.computeAutoResultadosRows();
  const auto=rows.find(r=>r.matchId==='f3-1-0-1');
  assert(auto&&auto.status==='auto'&&auto.phase==='f3'&&/Duelos/.test(auto.phaseLabel)&&!/[<>]/.test(auto.phaseLabel),'fila automática de f3 con nombre de fase escapado');
  assert.equal(ctx.resultadoWinnerIdx(auto),0);
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.computeBonus(auto))),{bonus:true,adjust:null},'bonus por juego también en fases nuevas (Palabras a Tiempo, 7-2)');
  vm.runInContext("state.f3=state.f3||{};",ctx);
  ctx.state.f3={};ctx.state.f2={};
  assert(rows.some(r=>r.matchId==='f3-1-2-2'&&r.status==='pending'),'juego físico queda pendiente de carga manual');
  assert(!rows.some(r=>r.phase==='f3'&&r.round===2),'la ronda 2 no aparece hasta cargar la 1');
  ctx.applyResultadoSilencioso('f3','1-0-1',0,true);
  assert.equal(ctx.state.f3['1-0-1'].winner,0);assert.equal(ctx.state.f3['1-0-1'].bonus,true,'el bonus se guarda en fases nuevas');assert.equal(ctx.state.f3['1-0-1'].bp,1,'bonus de 1 pt por defecto');
  assert.equal(JSON.stringify(ctx.state.f2),'{}','no toca la Fase grupal');
  ctx.applyResultadoSilencioso('f3','1-2-2','empate',false);
  const rk=ctx.FasesView.rank(vm.runInContext("phaseById('f3')",ctx),ctx.state,ctx.PLAYERS,ctx.TEAMS);
  assert.equal(rk[0].n,'Ana / Beto');assert.equal(rk[0].pts,4,'victoria 3 + bonus 1');
  // sin repetir: con la ronda 1 cargada, ahora aparece la 2 y el cruce aplicado no vuelve
  ctx.state.autoResultadosAplicados={'f3-1-0-1':JSON.stringify(ctx._autoResultados['f3-1-0-1'])};
  const rows2=ctx.computeAutoResultadosRows();
  assert(!rows2.some(r=>r.matchId==='f3-1-0-1'),'no se duplica un resultado ya cargado');
  assert(rows2.some(r=>r.matchId==='f3-2-0-2'),'aparece la ronda 2');
  // vista previa de puntos con la configuración de la fase
  vm.runInContext("phaseById('f3').pts={win:5,draw:2}",ctx);
  assert.equal(ctx.previewPts('f3',0,0,false),5);assert.equal(ctx.previewPts('f3',0,'empate',false),2);

  // 4) Apuestas: ventana por fase, puntos por acierto y anulación si pierde su propio duelo
  vm.runInContext("state.betWindowX=undefined;state.betsX=undefined;",ctx);
  ctx.state.f3={'1-0-1':{winner:0},'1-2-2':{winner:'empate'}};ctx.state.adjust=ctx.state.adjust||{};
  FX.openBets('f3');
  const bw=ctx.state.betWindowX.f3;assert(bw.open&&bw.round===2,'abre la primera ronda con cruces sin resultado (2)');
  assert(ctx.document.getElementById('page-fx-f3').innerHTML.includes('ABIERTAS'),'panel de apuestas abiertas');
  FX.closeBets('f3');assert.equal(ctx.state.betWindowX.f3.open,false);
  // Ana (equipo T1 = "Ana / Beto") apuesta ganador T1 en 1-0-1 (acierta, es su duelo); Cami apuesta a su propio equipo (falla, su duelo → anula); Beto no apostó
  ctx.state.betsX={f3:{'1-0-1':{Ana:0,Cami:1},'1-2-2':{Ana:2}}};
  let rk2=ctx.FasesView.rank(vm.runInContext("phaseById('f3')",ctx),ctx.state,ctx.PLAYERS,ctx.TEAMS);
  const row=n=>rk2.find(r=>r.n===n);
  assert.equal(row('Ana / Beto').bets,1,'acierto suma 1 al equipo del apostador');
  assert.equal(row('Cami / Dani').bets,0,'perder su propio duelo anula las apuestas');
  assert.equal(row('Ana / Beto').pts,5+1,'puntos de victoria (config 5) + apuesta');
  // 5) Comodines: ruleta por fase, pendiente → se resuelve al cargar el resultado, y suma al ranking de la fase
  vm.runInContext(html.slice(html.indexOf('function comosArrName'),html.indexOf('function computeAutoResultadosRows')),ctx);
  vm.runInContext(html.slice(html.indexOf('function resolvePendingComodines'),html.indexOf('function applyResultadoSilencioso')),ctx);
  ctx.COMODINES=[{key:'x',emoji:'✨',name:'Doble',when:'win',delta:2,kind:'bueno'}];ctx.comodinByKey=k=>ctx.COMODINES.find(c=>c.key===k)||null;
  vm.runInContext(html.slice(html.indexOf('// Cantidad de comodines resueltos'),html.indexOf('function rosterOfPhase')),ctx);
  ctx.state.comodines=[{status:'done',delta:1}];ctx.state.comodinesF2=[{status:'done',delta:-1},{status:'pending',delta:0}];ctx.state.comodines_f3=[{status:'done',delta:2}];
  assert.equal(ctx.countComodinesDone(),3,'wrapped/créditos cuentan comodines de Impostor, Fase grupal y fases nuevas');
  ctx.state.comodines_f3=[];
  assert.equal(ctx.comosArrName('f3'),'comodines_f3');assert.equal(ctx.comosArrName('f2'),'comodinesF2');
  assert.equal(ctx.rosterOfPhase('f3'),ctx.TEAMS);
  ctx.state.comodines_f3=[{id:'c1',player:'Cami / Dani',key:'x',status:'pending',delta:0}];
  const msgs=ctx.resolvePendingComodines('f3','2-1-2',1,false);
  assert.equal(msgs.length,1);assert.equal(ctx.state.comodines_f3[0].status,'done');
  ctx.state.comodines_f3[0].status='done';ctx.state.comodines_f3[0].delta=2;
  rk2=ctx.FasesView.rank(vm.runInContext("phaseById('f3')",ctx),ctx.state,ctx.PLAYERS,ctx.TEAMS);
  assert.equal(row('Cami / Dani').como,2);
  FX.render('f3');assert(ctx.document.getElementById('page-fx-f3').innerHTML.includes("openRuleta('f3')"),'botón de ruleta');
  // Bonus por juego: el ranking suma victoria + bp solo al ganador; el empate nunca lleva bonus
  const fpB={id:'zz',tipo:'grupal',fixture:[[1,0,1,0],[2,1,2,0]],games:['x'],pts:{win:3,draw:1},clasifican:{cantidad:0,tamanoGrupo:1}};
  const rkB=ctx.FasesView.rank(fpB,{zz:{'1-0-1':{winner:0,bonus:true,bp:2},'2-1-2':{winner:'empate'}}},ctx.PLAYERS,ctx.TEAMS);
  assert.equal(rkB.find(r=>r.n===ctx.TEAMS[0]).pts,5,'ganador con bonus suma win + bp');
  assert.equal(rkB.find(r=>r.n===ctx.TEAMS[1]).pts,1,'el perdedor no suma por el duelo (solo el empate de la ronda 2)');
  assert.equal(rkB.find(r=>r.n===ctx.TEAMS[2]).pts,1,'el empate nunca lleva bonus');
  // Eliminar la fase limpia apuestas y comodines
  FX.remove('f3');assert(!ctx.state.comodines_f3&&!(ctx.state.betsX&&ctx.state.betsX.f3));
  console.log('OK: fases nuevas con juegos — Activar ronda, fixture publicado, resultados automáticos, bonus por juego, sin duplicados, apuestas (ventana, aciertos, anulación), comodines por fase y f2 intacta.');
})().catch(e=>{console.error(e);process.exit(1);});
