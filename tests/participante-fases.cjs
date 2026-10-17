const fs=require('fs'),vm=require('vm'),assert=require('assert');
const s=fs.readFileSync(require('path').join(__dirname,'..','participante.html'),'utf8');
const c={console,Set,Math,JSON,latestState:{f1:{},f2:{'1-0-1':{winner:0,bonus:true}}},PLAYERS:['A','B'],TEAMS:['X / Y','Z / W'],F1_FIXTURE:[[1,0,1,0]],F2_FIXTURE:[[1,0,1,0],[2,0,1,0]],
 gameNameF1:g=>'g1-'+g,gameNameF2:g=>'g2-'+g,guestRoundNumber:r=>r};
vm.createContext(c);
vm.runInContext(s.slice(s.indexOf('// Datos de una fase (Impostor'),s.indexOf('function findLastMatch'))+s.slice(s.indexOf('function findLastMatch'),s.indexOf('// Cuántas rondas faltan')),c);
vm.runInContext(s.slice(s.indexOf('function roundsAway'),s.indexOf('function roundsAway')+400).split('\n}\n')[0]+'\n}',c);
let n=c.findNextMatch('f2',0);assert.equal(n.oppName,'Z / W');assert.equal(n.game,'g2-0');assert.equal(n.key,'2-0-1');
n=c.findNextMatch('f1',0);assert.equal(n.oppName,'B');assert.equal(n.game,'g1-0');
const l=c.findLastMatch('f2',0);assert.equal(l.result,'gano');assert.equal(l.bonus,true);assert.equal(l.game,'g2-0');
assert.equal(c.roundsAway('f2',3),1);
console.log('OK: participante — findNextMatch/findLastMatch/roundsAway con phaseDataG (Impostor y Fase grupal)');
