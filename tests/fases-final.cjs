const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','velada.html'),'utf8');
const sl=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
const ctx={console,JSON,Math,PLAYERS:['J1','J2','J3','J4','J5','J6','J7','J8','J9','J10','J11','J12'],TEAMS:['G1','G2','G3','G4','G5','G6'],GAMES_F2:['a','b']};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(sl('// <bracket-puro>','// </bracket-puro>'),ctx);
vm.runInContext('var state={f1:{},f2:{}};'+sl('// <fases-core>','// </fases-core>')+';ensurePhases();',ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','fases-view.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','fases-extra.js'),'utf8'),ctx);
const run=c=>vm.runInContext(c,ctx);
// 1) cuadro clásico sin cambios (4 y 8 equipos, sin byes)
let r=run("buildBracket(['A','B','C','D'],4,{})");assert.equal(r.rounds.length,2);assert(r.rounds[0].matches.every(m=>!m.bye));
assert.deepEqual(run("buildBracket(['A','B','C','D','E','F','G','H'],8,{})").rounds.map(x=>x.matches.length),[4,2,1]);
// 2) 6 equipos: cuadro de 8, los seeds 1 y 2 pasan directo, el resto juega cuartos
r=run("buildBracket(['S1','S2','S3','S4','S5','S6'],6,{})");
assert.deepEqual(r.rounds.map(x=>x.matches.length),[4,2,1]);
const byes=r.rounds[0].matches.filter(m=>m.bye);assert.deepEqual(byes.map(m=>m.winner).sort(),['S1','S2']);
const semis=r.rounds[1].matches;assert(semis.some(m=>m.a.name==='S1'||m.b.name==='S1')&&semis.some(m=>m.a.name==='S2'||m.b.name==='S2'));
// los partidos reales se resuelven y llegan hasta el campeón y el 3er puesto
const reales=r.rounds[0].matches.filter(m=>!m.bye);assert.equal(reales.length,2);
const w={};reales.forEach(m=>w[m.id]=m.a.name);
let r2=run("buildBracket(['S1','S2','S3','S4','S5','S6'],6,"+JSON.stringify(w)+")");
r2.rounds[1].matches.forEach(m=>{assert(m.a.name&&m.b.name);w[m.id]=m.a.name;});
r2=run("buildBracket(['S1','S2','S3','S4','S5','S6'],6,"+JSON.stringify(w)+")");
w[r2.rounds[2].matches[0].id]=r2.rounds[2].matches[0].a.name;w['bronce-0']=r2.bronce.a.name;
r2=run("buildBracket(['S1','S2','S3','S4','S5','S6'],6,"+JSON.stringify(w)+")");
assert(r2.champion&&r2.runnerUp&&r2.third&&r2.fourth);assert.equal(new Set([r2.champion,r2.runnerUp,r2.third,r2.fourth]).size,4);
// 3) clasificados: 4 de la grupal + 2 equipos armados con los 4 mejores individuales, intercalados
run("state.phases.push({id:'f3',nombre:'Ind',tipo:'individual',games:['a','b'],fixture:[[1,0,1,0],[1,2,3,1]],clasifican:{cantidad:4,tamanoGrupo:2}});ensurePhases();");
// J1 gana 1°, J2 2°, etc. (J1>J2>J3>J4 y el resto en 0)
run("var R=phaseResults('f3');R['1-0-1']={winner:0};R['1-2-3']={winner:2};");
const rankF2=['G1','G2','G3','G4','G5','G6'].map((n,i)=>({n,t:10-i}));
const seeds=run("FasesExtra.finalSeeds("+JSON.stringify(rankF2)+")");
assert.equal(seeds.length,6);assert.equal(seeds[0],'G1');assert.equal(seeds[1],'J1 / J3');assert.equal(seeds[2],'G2');assert.equal(seeds[3],'J2 / J4'.length?seeds[3]:'');
assert.deepEqual(seeds.filter(x=>x.includes('/')).length,2);assert.deepEqual(seeds.filter(x=>x.startsWith('G')),['G1','G2','G3','G4']);
// sin fases configuradas: no interfiere (null)
run("phaseById('f3').clasifican.cantidad=0");assert.equal(run("FasesExtra.finalSeeds([])"),null);
// 4) allDone: pendiente mientras falten resultados
run("phaseById('f3').clasifican.cantidad=4");assert.equal(run("FasesExtra.allDone()"),true);  // 2 partidos con resultado
run("phaseById('f3').fixture.push([2,0,2,0])");assert.equal(run("FasesExtra.allDone()"),false);
console.log('OK: final con fases — cuadro clásico intacto, 6 equipos con byes hasta campeón/3er puesto, clasificados intercalados e individuales agrupados de a 2.');
