const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=rd('velada.html'),sl=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
const els={};const input=v=>({value:v});
const c={console,JSON,Math,Set,Array,Object,PLAYERS:['J1','J2','J3','J4','J5','J6'],TEAMS:['G1','G2','G3'],GAMES_F2:['a','b','c'],toasts:[],confirm:()=>true,prompt:()=>'x'};
c.window=c;c.showToast=(i,m)=>c.toasts.push(m);c.saveState=()=>{};c.goTab=()=>{};c.activateTab=()=>{};
c.document={querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>els[id]||null,createElement:()=>({})};
vm.createContext(c);
vm.runInContext(sl('function generateCoverageFixture','function generateF1Fixture'),c);   // generador real de la Fase grupal
vm.runInContext('var state={f1:{},f2:{}};'+sl('// <fases-core>','// </fases-core>')+';ensurePhases();',c);
vm.runInContext(rd('fases-view.js'),c);vm.runInContext(rd('fases-extra.js'),c);
const run=x=>vm.runInContext(x,c),FX=c.FasesExtra;
run("state.phases.push({id:'f3',nombre:'Duelos',emoji:'🎯',tipo:'individual',games:['a','b','c'],fixture:[],clasifican:{cantidad:2,tamanoGrupo:2}});ensurePhases();");
// 1) cobertura: cada jugador juega todos los juegos y hay descansos
FX.generate('f3');let p=run("phaseById('f3')");
assert(p.fixture.length>0&&p.byes&&typeof p.byes==='object');
const per=Array.from({length:6},()=>new Set());p.fixture.forEach(m=>{per[m[1]].add(m[3]);per[m[2]].add(m[3]);});assert(per.every(s=>s.size===3),'cobertura de juegos');
// 2) modo "todos contra todos" sigue disponible y cambiar el modo borra el fixture
FX.setModo('f3','todos');assert.equal(p.fixture.length,0);FX.generate('f3');assert.equal(p.fixture.length,3*Math.min(5,3)); // 6 jugadores, 3 rondas, 3 cruces
// 3) ajustes manuales entran al ranking
els['fx-adj-n-f3']=input('4');els['fx-adj-p-f3']=input('7');els['fx-adj-l-f3']=input('bonus');
FX.addAdjust('f3');let rk=FX.ranking(p);assert.equal(rk[0].n,'J5');assert.equal(rk[0].pts,7);
const aid=run("state.adjust.f3[0].id");FX.removeAdjust('f3',aid);assert.equal(FX.ranking(p)[0].pts,0);
// 4) simulacro: todos los cruces con resultado y puntos repartidos
FX.simulate();assert.equal(Object.keys(run("state.f3")).length,p.fixture.length);assert(FX.ranking(p).some(r=>r.pts>0));
// 5) Reglas resume la fase
const rg=FX.reglasHtml();assert(rg.includes('Duelos')&&rg.includes('Clasifican a la Final: 2')&&rg.includes('equipos de a 2'));
// 6) los créditos incluyen el podio de la fase (código presente y la vista devuelve ranking con puntos)
assert(html.includes('[Wrapped] fallo en fases adicionales')&&html.includes('${fxCreditsHtml}')&&html.includes("FasesView.extras(state).forEach(p => {"));
// 7) copia de seguridad antigua (sin phases) se migra sin perder datos
vm.runInContext('state='+JSON.stringify({f1:{'1-0-1':{winner:0}},f2:{},adjust:{f1:[],f2:[]}})+';ensurePhases();',c);
assert.deepEqual(run('state.phases.map(p=>p.id)'),['f1','f2']);assert.deepEqual(run("state.f1"),{'1-0-1':{winner:0}});
console.log('OK: fases completas — fixture con cobertura y descansos, todos contra todos, ajustes manuales, simulacro, Reglas, créditos y migración de backups viejos.');
