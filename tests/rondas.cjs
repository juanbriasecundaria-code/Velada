const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
for(const f of fs.readdirSync(root)){
 if(f.endsWith('.js'))new Function(read(f));
 if(f.endsWith('.html'))for(const m of read(f).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/type=['"]module/.test(m[1]))new Function(m[2]);
}
const s=read('velada.html'),ctx={console,confirm:()=>true,setTimeout:()=>{},clearTimeout:()=>{},Math,Date,JSON};ctx.window=ctx;
vm.createContext(ctx);for(const f of ['puntos.js','buzzer-rounds.js','common-rounds.js'])vm.runInContext(read(f),ctx);
vm.runInContext(s.slice(s.indexOf('const RULES_DEFAULT ='),s.indexOf('function _applyRulesParsed'))+'\nthis.defaults=RULES_DEFAULT;',ctx);
for(const count of [5,6]){const old=JSON.parse(JSON.stringify(ctx.defaults));old.f2=old.f2.slice(0,count);old.f2[0].pts_win=9;const fixed=ctx.migrateRulesCatalog(old);assert.equal(fixed.f2.length,10);assert.equal(fixed.f2[0].pts_win,9);assert.equal(old.f2.length,count);fixed.f2.splice(6,1);assert.equal(ctx.migrateRulesCatalog(fixed).f2.length,9);}
ctx.state={f1:{},f2:{'1-0-1':{winner:0,bonus:false}},impostor:{rounds:[{mode:'noDescubierto',players:['A','B'],impostorName:'A'}]},argentinosRound:{byTeam:{A:3,B:0}},guessRound:{byTeam:{A:1,B:3}},qldTeamPoints:{0:3,1:1}};
ctx.F2_FIXTURE=[[1,0,1,0],[2,0,1,0]];ctx.F2_BYES={};ctx.TEAMS=['A','B'];ctx.PLAYERS=['A','B'];ctx.FULL_NAMES={};ctx.GAMES_F2=['Mario Party','Guess Movie/Song','100 Argentinos Dicen'];ctx.saveState=()=>{};
const order=ctx.ensureCommonRoundOrder();assert.equal(new Set(order).size,6);assert.equal(order.length,6);assert.equal(JSON.stringify(order),JSON.stringify(ctx.ensureCommonRoundOrder()));assert(order.indexOf('duel:1')<order.indexOf('duel:2'));
ctx.state.roundOrder=['guess','duel:1','impostor','argentinos','qld','duel:2'];
const rules={f2:ctx.GAMES_F2.map(name=>({name,pts_win:3,pts_bonus:1,pts_lose:0,pts_draw:1})),impostor:{pts_noDescubierto:4,pts_descubierto:2}};
const p=ctx.Puntos.equipos({state:ctx.state,teams:ctx.TEAMS,players:ctx.PLAYERS,f2Fixture:ctx.F2_FIXTURE,rules});
assert.equal(JSON.stringify(p[0].rounds),JSON.stringify([1,3,null,3,3,null]));assert.equal(p[0].total,10);assert.equal(p[1].total,4);assert.equal(ctx.Puntos.jugadores({state:ctx.state,players:ctx.PLAYERS,rules})[0].total,4);
// Common automatic results replace the existing award, and require all teams.
ctx._commonResults={guess:{byTeam:{A:4,B:0},ts:1}};const auto=ctx.commonAutoRows().find(r=>r.common==='guess');assert(auto);assert(ctx.applyCommonAutoRow(auto));assert.equal(ctx.state.guessRound.byTeam.A,4);assert(!ctx.commonAutoRows().some(r=>r.common==='guess'));assert(!ctx.applyCommonAutoRow({status:'auto',common:'argentinos',resultado:{byGroup:{A:3}},matchId:'x'}));
ctx.F1_FIXTURE=[];ctx.GAMES_F1=[];ctx._autoResultados={};vm.runInContext(s.slice(s.indexOf('function primeraRondaNoCargada'),s.indexOf('// \'a\'/\'b\'/\'empate\'')),ctx);
ctx.state.roundOrder=['duel:2','guess','duel:1','impostor','argentinos','qld'];const rows=ctx.computeAutoResultadosRows();assert(rows.some(r=>r.key==='2-0-1'&&r.round===1));
// Rendered fixture has a real result row under each common round.
const elements={};ctx.document={getElementById:id=>elements[id]||(elements[id]={innerHTML:''})};
Object.assign(ctx,{ensureF2Fixture:()=>false,_fixtureEditMode:{f2:false},GAME_COLORS_F2:[['#111','#fff']],getF2StationStatus:()=>({missingNames:[]}),_whoFilter:{f2:''},buzzerRoundButton:(phase,r)=>'<button>Activar ronda '+ctx.commonRoundNumber('duel:'+r)+'</button>',buzzerMatchButton:()=>''});
vm.runInContext(s.slice(s.indexOf('function renderFixtureF2()'),s.indexOf('function generateF2FixtureNow()')),ctx);ctx.renderFixtureF2();const html=elements['fixture-fase2'].innerHTML;assert.equal((html.match(/class="fixture-round"/g)||[]).length,6);assert(html.includes('100 Argentinos Dicen'));assert(html.includes('Guess Movies/Songs'));assert(html.includes('no suma al ranking grupal'));
// Header and body use the same number of chronological ranking columns.
Object.assign(ctx,{renderF2RosterAdmin:()=>{},renderBetControlF2:()=>{},renderComodinesPanel:()=>{},renderNextMatch:()=>{},renderMyNext:()=>{},getTeamPoints:()=>ctx.Puntos.equipos({state:ctx.state,teams:ctx.TEAMS,players:ctx.PLAYERS,f2Fixture:ctx.F2_FIXTURE,rules}),getSuddenDeathTieF2:()=>null,renderSuddenDeathF2:()=>{},renderPodium:()=>{},playerAvatarHtml:()=>'',cellIsOverridden:()=>false});
vm.runInContext(s.slice(s.indexOf('function renderFase2()'),s.indexOf('function renderFixtureF2()')),ctx);ctx.renderFase2();assert.equal((elements['thead-row-fase2'].innerHTML.match(/<th[ >]/g)||[]).length,10);const firstRow=elements['tbody-fase2'].innerHTML.split('</tr>')[0];assert.equal((firstRow.match(/<td[ >]/g)||[]).length,10);
// Activating Argentinos publishes an active roster, rather than closing itself.
let updates;ctx._rtdb={ref:()=>({update:async u=>{updates=u;}})};ctx.showToast=()=>{};vm.runInContext(read('velada-rounds.js'),ctx);
(async()=>{
 await ctx.activateArgentinosRound(4,{disabled:false});const arg=updates['argentinos/buzzer'];assert(arg.fixture.active);assert.equal(arg.fixture.game,'argentinos');assert.equal(arg.fixture.players.length,2);assert.equal(arg.fixture.players[0].side,'a');
 const buzzing=ctx.BuzzerRounds.buzz({...arg,state:'open'},arg.fixture.id,'A','a',100);assert.equal(buzzing.winner.name,'A');assert.equal(buzzing.state,'won');
 await ctx.activateGuessRound(1,{disabled:false});const guess=updates['velada/buzzer'];const queued=ctx.BuzzerRounds.buzz({...guess,state:'open'},guess.fixture.id,'A','A',100);assert.equal(queued.queue[0].name,'A');
 // Game-group assignment preserves original participants and remaps buzzer slots.
 ctx.gm={cur:{a:0,b:1},teams:[{name:'Rojo',origs:[0]},{name:'Azul',origs:[1]}],origs:[{members:['A']},{members:['B']}]};ctx.currentFixtureMatch=()=>arg.fixture;let pub;ctx.fbRef={transaction:async fn=>{pub=fn(arg);}};
 vm.runInContext(read('argentinos-rounds.js'),ctx);ctx.publishArgentinosGroupFixture();assert.equal(pub.fixture.players[0].name,'A');assert.equal(pub.fixture.players[0].teamLabel,'Rojo');assert.equal(pub.names.b,'Azul');assert.equal(pub.fixture.id,arg.fixture.id);
 console.log('OK: sintaxis de todos los archivos; migración de 5/6 a 10 juegos; orden persistente; puntajes comunes sin duplicación; Impostor solo individual; revisión automática; fixture completo; activación de Argentinos y Guess; asignación de integrantes a grupos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
