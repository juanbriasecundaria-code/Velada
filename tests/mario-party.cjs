const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('velada.html');
const ctx={console,Math,Set,Array,state:{f2:{}},saveState:()=>{},GAMES_F2:['Mario Party',"Time's Up",'Beer Pong','Guess Movie/Song','El Erudito','Jenga','Curling','100 Argentinos Dicen','Palabras a Tiempo','Carrera de Mentes']};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(read('puntos.js'),ctx);vm.runInContext(read('common-rounds.js'),ctx);
vm.runInContext(html.slice(html.indexOf('function shuffleArr'),html.indexOf('// Al cargar la página, si en algún momento')),ctx);
for(let n=2;n<=20;n++)for(let attempt=0;attempt<10;attempt++){
 const {fixture,byes}=ctx.generateF2Fixture(n),mario=fixture.filter(m=>m[3]===0);
 assert.equal(mario.length,Math.ceil(n/2));assert.equal(new Set(mario.map(m=>m[0])).size,1);
 assert(ctx.marioPartyFixtureIsValid(fixture,n));assert(ctx.f2FixtureIsValid(fixture,n,10));
 assert(!byes[mario[0][0]]);assert.equal(fixture.filter(m=>m[0]===mario[0][0]).length,mario.length);
 assert.equal(new Set(mario.map(m=>m.slice(0,3).join('-'))).size,mario.length);
 for(let team=0;team<n;team++)for(const game of ctx.f2StationIndices())assert(fixture.some(m=>m[3]===game && (m[1]===team||m[2]===team)));
 ctx.F2_FIXTURE=fixture;ctx.state.roundOrder=[];const order=ctx.ensureCommonRoundOrder(true),id='duel:'+mario[0][0];
 assert.equal(order.filter(x=>x===id).length,1);assert(ctx.RoundPlan.isMarioRound(id,fixture,ctx.GAMES_F2));assert.deepEqual(ctx.ensureCommonRoundOrder(),order);
}
assert.deepEqual(ctx.generateF2Fixture(1).fixture,[]);
assert(!ctx.marioPartyFixtureIsValid([[1,0,1,0],[2,2,3,0]],4));
assert(!ctx.marioPartyFixtureIsValid([[1,0,1,0],[1,2,3,0],[1,0,2,1]],4));
// Real rendering and activation of the sequential block.
ctx.TEAMS=Array.from({length:6},(_,i)=>'Equipo '+i);const generated=ctx.generateF2Fixture(6);ctx.F2_FIXTURE=generated.fixture;ctx.F2_BYES=generated.byes;ctx.state={f2:{},roundOrder:[]};
const elements={};ctx.document={getElementById:id=>elements[id]||(elements[id]={innerHTML:''})};
Object.assign(ctx,{ensureF2Fixture:()=>false,_fixtureEditMode:{f2:true},GAME_COLORS_F2:[],getF2StationStatus:()=>({missingNames:[]}),_whoFilter:{f2:''},buzzerRoundButton:()=>'',buzzerMatchButton:()=>''});
vm.runInContext(html.slice(html.indexOf('function renderFixtureF2()'),html.indexOf('function generateF2FixtureNow()')),ctx);ctx.renderFixtureF2();
const out=elements['fixture-fase2'].innerHTML;assert(out.includes('3 partidas seguidas'));for(let i=1;i<=3;i++)assert(out.includes('Partida '+i+'/3'));assert(out.includes("activateCommonRound('duel:"));
console.log('OK: Mario Party, 2–20 equipos; cantidad, cobertura, bloque exclusivo, sorteo persistente, impares, validación y renderizado.');
