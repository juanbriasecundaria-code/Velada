// Podio animado por fase: estado independiente por fase (f2 y fases nuevas), sonido solo si la fase está a la vista.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../velada.html','utf8');
const src='const _prevPodiumTop3 = {};\n'+html.slice(html.indexOf('function renderPodium'),html.indexOf('let _confettiAF'));
assert(html.includes('const _prevPodiumTop3 = {};'),'estado del podio por fase declarado en velada.html');
const els={};
const mkEl=(active)=>({innerHTML:'',closest:()=>({classList:{contains:c=>c==='active'&&active}})});
const log=[];
const ctx={document:{getElementById:id=>els[id]||null},getWinLoss:()=>({}),streakBadge:()=>'',entityColor:()=>'#fff',getPlayerPhoto:()=>null,
  entityFigureHtml:()=>'<svg></svg>',playPodiumSound:()=>log.push('sound'),launchConfetti:p=>log.push('confetti:'+p),console};
vm.createContext(ctx);vm.runInContext(src+';this.renderPodium=renderPodium;this.prev=_prevPodiumTop3;',ctx);
const S=(a,b,c)=>[{n:'A / A2',i:0,pts:{total:a}},{n:'B / B2',i:1,pts:{total:b}},{n:'C / C2',i:2,pts:{total:c}}];
// 1) Fase nueva a la vista: dibuja, anima y suena; con el mismo top 3 no repite
els['podium-fx-f3']=mkEl(true);
ctx.renderPodium('podium-fx-f3',S(7,4,1),'f3');
assert(els['podium-fx-f3'].innerHTML.includes('Podio en vivo')&&els['podium-fx-f3'].innerHTML.includes('podium-enter-2'),'podio dibujado y animado');
assert(log.includes('sound')&&log.includes('confetti:f3'),'suena y lanza confeti en la fase a la vista (≥6 pts)');
log.length=0;ctx.renderPodium('podium-fx-f3',S(7,4,1),'f3');
assert(!els['podium-fx-f3'].innerHTML.includes('podium-enter-'),'sin cambios no se vuelve a animar');assert.equal(log.length,0);
// 2) Cada fase guarda su propio estado: f4 no se ve afectada por f3 ni por f2
els['podium-fx-f4']=mkEl(false);els['podium-fase2']=mkEl(false);
ctx.renderPodium('podium-fx-f4',S(3,2,1),'f4');
assert(els['podium-fx-f4'].innerHTML.includes('podium-enter-1'),'f4 anima su primer dibujo aunque f3 ya esté dibujada');
assert.equal(log.length,0,'fase nueva fuera de pantalla: no suena ni lanza confeti');
ctx.renderPodium('podium-fase2',S(2,1,0),'f2');assert(log.includes('sound'),'f2 mantiene su comportamiento: suena aunque su página no sea la activa');
assert.deepEqual(Object.keys(ctx.prev).sort(),['f2','f3','f4'],'un estado por fase');
// 3) Cambia el top 3 de f3 → vuelve a animar
log.length=0;ctx.renderPodium('podium-fx-f3',S(7,6,1),'f3');
assert(els['podium-fx-f3'].innerHTML.includes('podium-enter-')&&log.includes('sound'),'al cambiar el top 3 vuelve a animar');
console.log('OK: podio animado por fase — estado propio, animación solo si cambia, sonido solo en la fase a la vista, f2 intacta.');
