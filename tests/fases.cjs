const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','velada.html'),'utf8');
const a=html.indexOf('// <fases-core>'),b=html.indexOf('// </fases-core>');
assert(a>0&&b>a,'bloque fases-core presente');
const core=html.slice(a,b);
function run(initial){const c={console,JSON};c.window=c;vm.createContext(c);
 vm.runInContext('var state='+JSON.stringify(initial)+';'+core+';ensurePhases();',c);return c;}
// 1) estado vacío: se crean f1/f2 y sus contenedores
let c=run({});let st=vm.runInContext('state',c);
assert.deepEqual(st.phases.map(p=>p.id),['f1','f2']);
assert.deepEqual(st.phases.map(p=>p.tipo),['individual','grupal']);
assert(st.f1&&st.f2&&Array.isArray(st.adjust.f1)&&Array.isArray(st.adjust.f2)&&st.cellPts.f1&&st.cellPts.f2);
// 2) estado viejo con datos: no se pierde nada y es idempotente
const legacy={f1:{'1-0-1':{winner:0,bonus:true}},f2:{'1-2-3':{winner:'empate'}},adjust:{f1:[{id:1,name:'A',pts:2}],f2:[]},cellPts:{f1:{'A||1':3},f2:{}},bets:{x:1}};
c=run(legacy);st=vm.runInContext('state',c);
assert.deepEqual(st.f1,legacy.f1);assert.deepEqual(st.f2,legacy.f2);
assert.deepEqual(st.adjust.f1,legacy.adjust.f1);assert.deepEqual(st.cellPts.f1,legacy.cellPts.f1);assert.deepEqual(st.bets,legacy.bets);
const antes=JSON.stringify(st);vm.runInContext('ensurePhases();ensurePhases();',c);assert.equal(JSON.stringify(vm.runInContext('state',c)),antes);
// 3) fase nueva: usa el mismo patrón de datos y f1/f2 no se tocan
vm.runInContext("state.phases.push({id:'f3',nombre:'Duelos',tipo:'individual'});ensurePhases();phaseResults('f3')['1-0-1']={winner:1};",c);
st=vm.runInContext('state',c);
assert.equal(st.phases[2].clasifican.cantidad,0);assert.deepEqual(st.f3,{'1-0-1':{winner:1}});
assert(Array.isArray(st.adjust.f3)&&st.cellPts.f3);assert.deepEqual(st.f1,legacy.f1);
// 4) datos corruptos: se repara sin romper
c=run({phases:[null,{id:'f2',tipo:'raro'},{nombre:'sin id'}],f1:5});st=vm.runInContext('state',c);
assert.deepEqual(st.phases.map(p=>p.id),['f2','f1']);assert.equal(st.phases[0].tipo,'grupal');assert.deepEqual(st.f1,{});
console.log('OK: fases — migración de f1/f2 sin pérdida, idempotencia, fase nueva con su propio espacio y reparación de datos inválidos.');
