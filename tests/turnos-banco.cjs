const fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=n=>fs.readFileSync(require('path').join(__dirname,'..',n),'utf8');
const extract=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
function ctx(c){c.window=c;vm.createContext(c);return c;}
function el(){return {innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},querySelector(){return this;}};}
(async()=>{
 const elements={};let tick;
 const g=ctx({console,GROUP:true,MODE:'conductor',gQueue:[{team:'A',name:'Ana'},{team:'B',name:'Beto'},{team:'C',name:'Cami'}],gTurn:-1,gTeams:['A','B','C'],phase:'idle',revealed:true,activeBuzzer:null,timerLeft:15,timerDefault:15,timerActive:false,timerInterval:null,navigator:{},document:{getElementById:id=>elements[id]||(elements[id]=el())},setInterval:fn=>{tick=fn;return 1;},clearInterval(){},gPatch(){},gPublishTurn(){},syncPhaseUI(){},gRenderBoard(){},syncTimerUI(){},sendState(){},showToast(){},sfxBuzz(){},sfxTick(){}});
 const guess=read('guess_Movies_Songs.html');
 vm.runInContext(extract(guess,'function startTimer()','function resetTimer('),g);
 vm.runInContext(extract(guess,'function gMaybeStartTurn()','function gCorrect()'),g);
 g.gMaybeStartTurn();assert.equal(g.activeBuzzer,'A');for(let i=0;i<15;i++)tick();assert.equal(g.activeBuzzer,'B');assert.equal(g.timerLeft,15);assert(g.timerActive);for(let i=0;i<15;i++)tick();assert.equal(g.activeBuzzer,'C');assert.equal(g.timerLeft,15);for(let i=0;i<15;i++)tick();assert.equal(g.phase,'idle');assert.equal(g.timerLeft,15);assert.equal(g.timerActive,false);
 const a=read('100_Argentinos_Dicen.html'),storage={cad_bank:JSON.stringify([{q:'No debe cargarse',a:[['x',20]]}])};
 const c=ctx({console,bank:[],SK_BANK:'cad_bank_imported_v1',usedQ:new Set(),localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>{storage[k]=v;}},confirm:()=>true,alert:()=>{},saveUsed(){},renderDeckList(){},syncUI(){},gm:{teams:[{name:'Rojo',origs:[0]},{name:'Azul',origs:[1]},{name:'Verde',origs:[2]}],scores:[0,0,0],cur:{a:0,b:1,c:2},origs:[{label:'A / Ana',members:['Ana']},{label:'B',members:['Beto']},{label:'C / Cami',members:['Cami']}]},score:{a:0,b:0,c:0},gmSave(){},saveScore(){},syncScoreUI(){},gmRender(){},writeSync(){},gmCloseFinal(){},showToast(){}});
 vm.runInContext(extract(a,'function normBankItem(', 'const SK_BANK'),c);vm.runInContext(extract(a,'function loadBank()', 'function loadState()'),c);
 c.loadBank();assert.equal(c.bank.length,0);assert(!a.includes('const DEFAULT_BANK'));assert(!a.includes('const FM_BANK'));assert(a.includes('shuffle(activeBank())'));
 c.FileReader=class{readAsText(file){this.result=file.text;this.onload();}};
 vm.runInContext(extract(a,'function importBankFile(', '// ── SPLASH'),c);
 const imported=[{q:'Mi pregunta JSON',cat:'Propias',a:[['Uno',60],['Dos',40]]}];c.importBankFile({target:{files:[{text:JSON.stringify(imported)}],value:'x'}});assert.equal(c.bank.length,1);assert.equal(c.bank[0].cat,'Propias');c.bank=[];c.loadBank();assert.equal(c.bank[0].q,'Mi pregunta JSON');
 vm.runInContext(extract(a,'function gmAdjustScore(', 'function gmRender()'),c);c.gmAdjustScore(2,1);assert.equal(c.gm.scores[2],1);assert.equal(c.score.c,1);
 vm.runInContext(extract(a,'function gmPlacePts(', 'function gmOpenFinal()'),c);vm.runInContext('_gmOrder=[2,0,1]',c);
 vm.runInContext(read('team-maps.js'),c);let result;c.fbDb={ref:()=>({set:async data=>{result=data;}})};vm.runInContext(extract(a,'async function gmConfirmFinal()', '// ── INICIAR RONDA'),c);await c.gmConfirmFinal();assert.equal(c.FirebaseTeamMaps.fromWire(result).byGroup['C / Cami'],3);assert(!Object.keys(result.byGroup).some(k=>k.includes('/')));assert.equal(result.teams.length,3);
 // Fotos desde el mismo proyecto y documento que ¿Quién lo dijo?.
 let project,documentPath;const photos=ctx({console,firebase:{firestore(){},app(){throw Error('Sin app');},initializeApp:(cfg,name)=>{project=cfg.projectId;assert.equal(name,'photos');return {firestore:()=>({collection:collection=>({doc:doc=>({onSnapshot:fn=>{documentPath=collection+'/'+doc;fn({exists:true,data:()=>({data:JSON.stringify({Ana:'ana.jpg'})})});}})})})};}}});
 vm.runInContext(read('guess-teams.js'),photos);photos.GuessTeams.setRoster({f2:{teams:['Ana / Beto']}});photos.GuessTeams.bind({ref:()=>({on(){}})});assert.equal(project,'cumple-598e7');assert.equal(documentPath,'ndj/photos');assert(photos.GuessTeams.html({}).includes('ana.jpg'));
 console.log('OK: 15 segundos nuevos para 2.º y 3.º equipo, banco vacío sin defaults ni restauración, JSON persistente, puntaje y cierre del tercer grupo, fotos desde cumple/ndj/photos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
