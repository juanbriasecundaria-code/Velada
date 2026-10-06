const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const c={console,JSON,Math};c.window=c;vm.createContext(c);vm.runInContext(rd('fases-view.js'),c);
const V=c.FasesView;
const PL=['Ana Gómez','Beto','Cami','Dani'],TM=['Rojo / Azul','Verde / Lila'];
const st={phases:[{id:'f1'},{id:'f2'},{id:'f3',nombre:'Duelos',emoji:'🎯',tipo:'individual',fixture:[[1,0,1,0],[1,2,3,0],[2,0,2,0]],clasifican:{cantidad:2},pts:{win:5,draw:2}}],
 f3:{'1-0-1':{winner:0},'1-2-3':{winner:'empate'}}};
assert.deepEqual(V.extras(st).map(p=>p.id),['f3']);
const r=V.rank(st.phases[2],st,PL,TM);assert.equal(r[0].n,'Ana Gómez');assert.equal(r[0].pts,5);assert.equal(r[1].pts,2);assert.equal(r[2].pts,2);assert.equal(r[3].pts,0);   // puntos configurables 5/2
assert.deepEqual(V.progress(st.phases[2],st),{done:2,total:3});
let h=V.html(st.phases[2],st,PL,TM,{me:'Ana Gómez',tv:true});
assert(h.includes('Duelos')&&h.includes('2/3 partidos')&&h.includes('clasifican 2')&&h.includes('· vos'));
assert(!V.html(st.phases[2],st,PL,TM,{me:'Zoe'}).includes('· vos'));
assert(V.html({id:'f4',nombre:'Eq',emoji:'🏁',tipo:'grupal',fixture:[]},{},PL,TM,{me:'Azul',team:'Rojo / Azul'}).includes('· vos'));
assert.equal(V.cards({phases:[{id:'f1'},{id:'f2'}]},PL,TM,{}),'');            // sin fases nuevas no agrega nada
assert(V.cards(st,PL,TM,{me:'Beto'}).includes('Duelos'));
assert(!V.html({id:'x',nombre:'<b>x</b>',emoji:'',tipo:'grupal',fixture:[]},{},PL,TM,{}).includes('<b>x</b>'));   // escapa HTML
console.log('OK: vista de fases (TV/celulares) — ranking con puntos configurables, progreso, "vos", escape y sin fases nuevas no muestra nada.');
