const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=read('velada.html');
const core=html.slice(html.indexOf('// <fases-core>'),html.indexOf('// </fases-core>'));
// DOM mínimo
function el(tag){const e={tag,children:[],attrs:{},innerHTML:'',className:'',id:'',parentNode:null,
 setAttribute(k,v){this.attrs[k]=v;},remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(c=>c!==this);},
 insertBefore(n,ref){n.parentNode=this;const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);},
 querySelectorAll(sel){return this.children.filter(c=>sel==='[data-fx]'&&c.attrs['data-fx']);},get nextSibling(){const i=this.parentNode.children.indexOf(this);return this.parentNode.children[i+1]||null;}};return e;}
const nav=el('nav'),body=el('body'),f2tab=el('div');f2tab.attrs['data-tab']='fase2';nav.insertBefore(f2tab);f2tab.parentNode=nav;
const finalPage=el('div');finalPage.id='page-final';body.insertBefore(finalPage);
const ctx={console,JSON,Math,PLAYERS:['A','B','C','D'],TEAMS:['T1','T2','T3'],GAMES_F2:['G0','G1','G2'],toasts:[],confirm:()=>true,prompt:()=>'x',tabs:[]};
ctx.window=ctx;ctx.showToast=(i,m)=>ctx.toasts.push(m);ctx.saveState=()=>{};ctx.goTab=t=>ctx.tabs.push(t);ctx.activateTab=t=>ctx.tabs.push('act:'+t);
ctx.document={querySelector:s=>s==='.nav-tabs'?nav:s==='.nav-tab[data-tab="fase2"]'?f2tab:null,querySelectorAll:s=>s==='.page[data-fx]'?body.children.filter(c=>c.attrs['data-fx']):[],
 getElementById:id=>id==='page-final'?finalPage:body.children.find(c=>c.id===id)||null,createElement:el};
vm.createContext(ctx);
vm.runInContext('var state={f1:{x:1},f2:{y:2},lastTab:null};'+core+'ensurePhases();',ctx);
vm.runInContext(read('fases-extra.js'),ctx);
const FX=ctx.FasesExtra;
// fixture: todos contra todos por rondas, juego rotando, sin repetir cruce ni jugar dos veces en la misma ronda
const fx=FX.buildFixture(4,['a','b','c']);assert.equal(fx.length,6);
const pairs=new Set(fx.map(m=>m[1]+'-'+m[2]));assert.equal(pairs.size,6);
for(let r=1;r<=3;r++){const used=fx.filter(m=>m[0]===r).flatMap(m=>[m[1],m[2]]);assert.equal(new Set(used).size,used.length);}
assert(fx.every(m=>m[3]>=0&&m[3]<3));
assert.deepEqual(FX.buildFixture(1,['a']),[]);assert.deepEqual(FX.buildFixture(4,[]),[]);
assert.equal(FX.buildFixture(3,['a','b','c']).length,3);   // impar: uno descansa por ronda
// flujo UI: crear, copiar juegos, generar, cargar resultados, ranking
nav.children.forEach(()=>{});
const mkInputs={'fx-new-name':{value:'Duelos'},'fx-new-tipo':{value:'individual'},'fx-new-copy':{value:'f2'}};
const realGet=ctx.document.getElementById;ctx.document.getElementById=id=>mkInputs[id]||realGet(id);
FX.init();FX.create();
let st=vm.runInContext('state',ctx),p=st.phases.find(q=>q.id==='f3');
assert(p&&p.tipo==='individual'&&p.games.length===3&&p.clasifican.tamanoGrupo===2);
assert(ctx.tabs.includes('fx-f3'));assert(nav.children.some(c=>c.attrs['data-tab']==='fx-f3')&&nav.children.some(c=>c.attrs['data-tab']==='fx-nueva'));
FX.generate('f3');assert.equal(p.fixture.length,6);
const m0=p.fixture[0],k0=m0[0]+'-'+m0[1]+'-'+m0[2];
FX.setResult('f3',k0,m0[1]);FX.setResult('f3',p.fixture[1][0]+'-'+p.fixture[1][1]+'-'+p.fixture[1][2],'empate');
let rk=FX.ranking(p);assert.equal(rk[0].pts,3);assert.equal(rk[0].i,m0[1]);assert.equal(rk.reduce((s,r)=>s+r.pts,0),3+2);
assert(!ctx.toasts.some(t=>/⚠/.test(t)));
// aislamiento: f1/f2 intactas y fase grupal usa TEAMS
assert.deepEqual(st.f1,{x:1});assert.deepEqual(st.f2,{y:2});
FX.setResult('f3',k0,null);assert.equal(FX.ranking(p).reduce((s,r)=>s+r.pts,0),2);
// clasificación configurable y borrado
FX.setQual('f3','cantidad','2');assert.equal(p.clasifican.cantidad,2);
const page=body.children.find(c=>c.id==='page-fx-f3');assert(page.innerHTML.includes('Duelos')&&page.innerHTML.includes('Clasifican a la Final'));
FX.remove('f3');assert(!vm.runInContext("phaseById('f3')",ctx)&&vm.runInContext('state.f3',ctx)===undefined);
assert.equal(vm.runInContext('state.phases.length',ctx),2);
console.log('OK: fases extra — fixture sin cruces repetidos, crear/copiar juegos/generar, resultados, ranking, clasificación y borrado sin tocar f1/f2.');
