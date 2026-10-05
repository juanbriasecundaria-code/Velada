const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const teams=['A / B','C / D','E / F','G / H','I / J / K'];
const guess={};guess.window=guess;vm.createContext(guess);vm.runInContext(read('guess-teams.js'),guess);
guess.GuessTeams.setRoster({f1:{players:['A','B','C','D','E','F','G','H','I','J','K']},f2:{teams,fullNames:{}}});
guess.GuessTeams.setPhotos({A:'a.jpg',J:'j.jpg',K:'k.jpg'});
let html=guess.GuessTeams.html({nameA:teams[0],nameB:teams[1],scoreA:2,scoreB:1});
assert.equal((html.match(/class="part-gteam/g)||[]).length,5);assert.equal((html.match(/<img /g)||[]).length,3);assert(html.includes('I &amp; J &amp; K'));
html=guess.GuessTeams.html({group:{teams:teams.slice(0,2),scores:{[teams[4]]:7},queue:[]}});assert.equal((html.match(/class="part-gteam/g)||[]).length,5);assert(html.includes('part-gscore">7'));
// The dashboard has a single group-bet block and no retired phase card.
const s=read('participante.html'),app={innerHTML:'',children:[]},elements={app};
const c={console,PLAYERS:['A'],TEAMS:teams,F1_FIXTURE:[],F2_FIXTURE:[],latestState:{f2:{},impostor:{rounds:[]}},liveFromCache:false,navigator:{onLine:true},localStorage:{removeItem:()=>{}},document:{getElementById:id=>elements[id]||(elements[id]={addEventListener:()=>{}})},teamIndexForPlayer:()=>0,avatarHtml:()=>'',escapeHtml:String,safeBlock:fn=>fn(),renderResumen:()=>'',renderNextHero:()=>'',renderMyFinalPath:()=>'',renderMomento:()=>'',renderPhaseCard:type=>'<div>'+type+' Fase grupal</div>',renderBetCardF2:()=>'<div>Apuestas</div>',renderBetCard:()=>{throw Error('Apuestas antiguas renderizadas');},renderMiiCard:()=>'',renderH2H:()=>{throw Error('Se renderizó el historial retirado');},connectionStatusHtml:()=>'',accOpen:()=>false,wireBetCardF2:()=>{},wireMiiCard:()=>{},wireAccordions:()=>{}};
vm.createContext(c);vm.runInContext(s.slice(s.indexOf('function renderDashboard('),s.indexOf('// Si una tarjeta opcional falla')),c);c.renderDashboard('A');assert.equal((app.innerHTML.match(/Apuestas/g)||[]).length,1);assert(!app.innerHTML.includes('Fase 1'));assert(!app.innerHTML.includes('Fase 2'));assert(!app.innerHTML.includes('f1 Fase grupal'));
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')))assert(!/fase[ ]+[12]\b/i.test(read(f)),f+' conserva nombres antiguos');
console.log('OK: Guess muestra cinco equipos sin estado grupal, conserva el tercero de cada equipo, carga fotos y puntajes; dashboard con una única apuesta grupal; interfaz sin los nombres de fases anteriores.');
