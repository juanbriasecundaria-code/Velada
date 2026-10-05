/* TEG Express: pure rules. Conductor is the authority; clients send versioned commands. */
(function(root){
'use strict';
const M=root.TegMap, LIMIT=15*60*1000,ROLL=2200;
const copy=x=>JSON.parse(JSON.stringify(x));
const shuffled=(a,rng)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const owned=(s,t)=>s.board.filter(p=>p.owner===t);
const stats=s=>s.teams.map((t,i)=>({team:i,name:t.name,color:t.color,countries:owned(s,i).length,troops:owned(s,i).reduce((n,p)=>n+p.troops,0),captures:s.captures[i]||0}));
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
function log(s,text,now){s.history=(s.history||[]).concat([{text,ts:now}]).slice(-20);}
function colors(n){const fixed=['#c8f060','#60b4f0','#ff7979','#c060e8','#f5c842','#4cdbc3','#f6a164','#e994cc','#a4b8ff','#d6d0bb'];return Array.from({length:n},(_,i)=>fixed[i]||'hsl('+Math.round(i*137.5%360)+',72%,65%)');}
function goal(s,t,rng){
 const own=owned(s,t),front=[...new Set(own.flatMap(p=>M.territories[p.id].neighbors).filter(id=>s.board[id].owner!==t))];
 const target=own.length+Math.min(2,50-own.length);
 const candidates=[{type:'expand',target,title:'Expandí tu imperio',detail:'Controlá '+target+' países al mismo tiempo.'},{type:'capture',target:2,title:'Ofensiva relámpago',detail:'Conquistá 2 países enemigos durante la partida. No hace falta conservarlos.'}];
 for(const continent of Object.keys(M.bonus)){
  const borders=front.filter(id=>M.territories[id].continent===continent);
  const current=own.filter(p=>M.territories[p.id].continent===continent).length;
  if(borders.length>=2)candidates.push({type:'continent',continent,target:current+2,title:'Campaña en '+continent,detail:'Controlá '+(current+2)+' países de '+continent+' al mismo tiempo.'});
 }
 return candidates[Math.floor(rng()*candidates.length)];
}
function goalProgress(s,t){const g=s.goals[t];if(!g)return {value:0,target:1};return {value:g.type==='capture'?(s.captures[t]||0):g.type==='continent'?owned(s,t).filter(p=>M.territories[p.id].continent===g.continent).length:owned(s,t).length,target:g.target};}
function finish(s,reason,now,winner){
 s.status='finished';s.finishedAt=now;s.reason=reason;s.remainingMs=Math.max(0,s.deadline-now);s.phase='finished';s.draft={};s.pendingMove=null;
 const all=stats(s).sort((a,b)=>b.countries-a.countries||b.troops-a.troops);
 let winners=winner===undefined?all.filter(x=>x.countries===all[0].countries&&x.troops===all[0].troops).map(x=>x.team):[winner];
 s.winners=winners;s.standings=all;
 s.reveal=winners.map(t=>({team:t,goal:s.goals[t],progress:goalProgress(s,t)}));
 log(s,reason==='objective'?'Objetivo cumplido: '+s.teams[winner].name:reason==='time'?'Tiempo terminado · resultado por países y tropas':'Partida finalizada por el conductor',now);
 return s;
}
function checkGoals(s,now){if(s.status!=='running')return;for(let t=0;t<s.teams.length;t++){const p=goalProgress(s,t);if(p.value>=p.target){finish(s,'objective',now,t);return;}}}
function budget(s,t){
 const own=owned(s,t),base=Math.max(3,Math.floor(own.length/2)),continents={};
 for(const [c,bonus] of Object.entries(M.bonus))if(M.territories.filter(p=>p.continent===c).every(p=>s.board[p.id].owner===t))continents[c]=bonus;
 return {base,continents,total:base+Object.values(continents).reduce((a,b)=>a+b,0)};
}
function beginTurn(s,now){
 let tries=0;while(!owned(s,s.order[s.turnPos]).length&&tries++<s.teams.length)s.turnPos=(s.turnPos+1)%s.teams.length;
 if(tries>=s.teams.length)return finish(s,'time',now);
 s.current=s.order[s.turnPos];s.turnId++;s.phase='reinforce';s.phaseDeadline=now+s.reinforceMs;s.attacks=0;s.draft={};s.budget=budget(s,s.current);s.pendingMove=null;s.movable={};
 log(s,'Turno de '+s.teams[s.current].name+' · +'+s.budget.total+' tropas',now);
}
function nextTurn(s,now){s.turnPos=(s.turnPos+1)%s.order.length;beginTurn(s,now);}
function validDraft(s,draft){
 const totals={};let total=0;
 for(const [id,n] of Object.entries(draft)){if(!integer(Number(id),0,49)||!integer(n,0,500)||s.board[Number(id)].owner!==s.current)return false;const c=M.territories[Number(id)].continent;totals[c]=(totals[c]||0)+n;total+=n;}
 const generic=Object.entries(totals).reduce((sum,[c,n])=>sum+Math.max(0,n-(s.budget.continents[c]||0)),0);
 return total<=s.budget.total&&generic<=s.budget.base;
}
function autoDraft(s){
 const draft={...s.draft},own=owned(s,s.current);
 const sorted=ps=>ps.slice().sort((a,b)=>(a.troops+(draft[a.id]||0))-(b.troops+(draft[b.id]||0))||a.id-b.id);
 for(const [continent,n] of Object.entries(s.budget.continents)){
  const ps=own.filter(p=>M.territories[p.id].continent===continent),already=ps.reduce((v,p)=>v+(draft[p.id]||0),0);
  for(let k=already;k<n;k++){const p=sorted(ps)[0];draft[p.id]=(draft[p.id]||0)+1;}
 }
 while(Object.values(draft).reduce((a,b)=>a+b,0)<s.budget.total){const p=sorted(own)[0];draft[p.id]=(draft[p.id]||0)+1;}
 return draft;
}
function deploy(s,now){
 const draft=autoDraft(s);for(const [id,n] of Object.entries(draft))s.board[Number(id)].troops+=n;
 s.draft={};s.phase='attack';s.phaseDeadline=now+s.actionMs;log(s,'Refuerzos colocados · empieza el ataque',now);
}
function beginRegroup(s){s.phase='regroup';s.movable={};owned(s,s.current).forEach(p=>s.movable[p.id]=p.troops-1);}
function settleMove(s,amount){const p=s.pendingMove;if(!p)return;s.board[p.from].troops-=amount;s.board[p.to].troops+=amount;s.pendingMove=null;}
function tick(s,now){
 if(s.status!=='running')return s;
 if(now>=s.deadline){if(s.pendingMove)settleMove(s,0);checkGoals(s,now);if(s.status==='running')finish(s,'time',now);return s;}
 if(s.phaseDeadline && now>=s.phaseDeadline){
  if(s.pendingMove)settleMove(s,0);
  if(s.phase==='reinforce')deploy(s,now);else nextTurn(s,now);
 }
 return s;
}
function create(names,now,rng=Math.random){
 if(!Array.isArray(names)||names.length<2||names.length>50||new Set(names).size!==names.length||names.some(n=>typeof n!=='string'||!n.trim()))throw Error('Cargá entre 2 y 50 equipos distintos.');
 const palette=colors(names.length),s={schema:1,id:now.toString(36)+'-'+Math.floor(rng()*1e8).toString(36),rev:0,status:'lobby',teams:names.map((name,i)=>({name,color:palette[i]})),board:M.territories.map(p=>({id:p.id,owner:-1,troops:1})),order:[],turnPos:0,turnId:0,current:-1,phase:'lobby',durationMs:LIMIT,remainingMs:LIMIT,goals:[],captures:names.map(()=>0),history:[],draft:{},clients:{},processed:{},hostId:'',hostUntil:0,round:0};
 // Reserve enough time for a complete rotation even with more than ten teams.
 const slot=Math.floor(LIMIT/names.length);s.actionMs=Math.min(30000,Math.max(8000,Math.floor(slot/3)));s.reinforceMs=Math.min(60000,Math.max(10000,slot-s.actionMs));
 return s;
}
function start(s,now,rng){
 const ids=shuffled(M.territories.map(p=>p.id),rng),order=shuffled(s.teams.map((_,i)=>i),rng);s.order=order;
 ids.forEach((id,i)=>{s.board[id]={id,owner:order[i%order.length],troops:2};});
 const max=Math.ceil(50/s.teams.length);
 s.teams.forEach((_,t)=>{const own=owned(s,t),front=own.filter(p=>M.territories[p.id].neighbors.some(id=>s.board[id].owner!==t));for(let i=0;i<8+2*(max-own.length);i++)(front.length?front:own)[i%(front.length||own.length)].troops++;});
 s.goals=s.teams.map((_,t)=>goal(s,t,rng));s.deadline=now+LIMIT;s.remainingMs=LIMIT;s.status='running';s.turnPos=0;beginTurn(s,now);log(s,'La conquista comienza · 15 minutos',now);
}
function apply(state,command,now,rng=Math.random){
 const s=copy(state);tick(s,now);const c=command||{},fail=message=>({state:s,ok:false,message});
 const control=['start','pause','resume','finish'].includes(c.type);
 if(control){
  if(c.type==='start'){if(s.status!=='lobby')return fail('La partida ya comenzó.');start(s,now,rng);}
  if(c.type==='pause'){if(s.status!=='running')return fail('La partida no está corriendo.');s.status='paused';s.pausedAt=now;s.remainingMs=Math.max(0,s.deadline-now);s.phaseRemaining=Math.max(0,s.phaseDeadline-now);s.rollRemaining=Math.max(0,(s.rollUntil||0)-now);}
  if(c.type==='resume'){if(s.status!=='paused')return fail('La partida no está pausada.');s.status='running';s.deadline=now+s.remainingMs;s.phaseDeadline=now+s.phaseRemaining;s.rollUntil=now+(s.rollRemaining||0);}
  if(c.type==='finish'){if(s.status!=='running'&&s.status!=='paused')return fail('No hay una partida en curso.');if(s.status==='paused')s.deadline=now+s.remainingMs;finish(s,'manual',now);}
 }else{
  if(s.status!=='running')return fail('La partida está detenida.');
  if(c.rev!==s.rev||c.turnId!==s.turnId)return fail('El tablero cambió. Elegí nuevamente tu acción.');
  if(c.team!==s.current)return fail('Es el turno de otro equipo.');
  if(now<(s.rollUntil||0))return fail('Esperá a que terminen los dados.');
  if(c.type==='draft'){
   if(s.phase!=='reinforce'||!integer(c.country,0,49)||![-1,1].includes(c.delta))return fail('Refuerzo inválido.');
   const d={...s.draft},v=(d[c.country]||0)+c.delta;if(v<0)return fail('No hay tropas para retirar.');d[c.country]=v;if(!validDraft(s,d))return fail('No quedan refuerzos para ese país. Los bonus van en su continente.');s.draft=d;
  }else if(c.type==='deploy'){if(s.phase!=='reinforce')return fail('No es la etapa de refuerzos.');deploy(s,now);}
  else if(c.type==='attack'){
   if(s.phase!=='attack'||s.pendingMove||s.attacks>=2)return fail('Terminá el avance o pasá a reagrupar. Máximo 2 tiradas por turno.');
   if(!integer(c.from,0,49)||!integer(c.to,0,49))return fail('País inválido.');
   const a=s.board[c.from],d=s.board[c.to];if(a.owner!==s.current||d.owner===s.current||a.troops<2||!M.territories[a.id].neighbors.includes(d.id))return fail('Atacá un país enemigo vecino desde uno propio con al menos 2 tropas.');
   const dice=n=>Array.from({length:n},()=>1+Math.floor(rng()*6)).sort((a,b)=>b-a),attack=dice(Math.min(3,a.troops-1)),defense=dice(Math.min(3,d.troops));let lostA=0,lostD=0;
   for(let i=0;i<Math.min(attack.length,defense.length);i++){if(attack[i]>defense[i])lostD++;else lostA++;}
   a.troops-=lostA;d.troops-=lostD;const defender=d.owner,conquered=d.troops===0;
   if(conquered){d.owner=s.current;a.troops--;d.troops=1;s.captures[s.current]++;s.pendingMove={from:a.id,to:d.id,max:Math.min(2,a.troops-1)};}
   s.attacks++;s.rollUntil=now+ROLL;s.battle={id:s.id+'-'+(s.rev+1),at:now,until:s.rollUntil,from:a.id,to:d.id,attacker:s.current,defender,attack,defense,lostA,lostD,conquered};
   log(s,M.territories[a.id].name+' → '+M.territories[d.id].name+' · '+(conquered?'conquista':'bajas '+lostA+' / '+lostD),now);
  }else if(c.type==='advance'){
   const p=s.pendingMove;if(!p||!integer(c.amount,0,p.max))return fail('Podés avanzar de 1 a 3 tropas en total, dejando una en origen.');settleMove(s,c.amount);
  }else if(c.type==='regroup'){if(s.phase!=='attack'||s.pendingMove)return fail('Terminá el avance antes de reagrupar.');beginRegroup(s);}
  else if(c.type==='move'){
   if(s.phase!=='regroup'||!integer(c.from,0,49)||!integer(c.to,0,49))return fail('Traslado inválido.');
   const a=s.board[c.from],b=s.board[c.to];if(a.owner!==s.current||b.owner!==s.current||!M.territories[a.id].neighbors.includes(b.id)||!integer(c.amount,1,Math.min(a.troops-1,(s.movable||{})[a.id]||0)))return fail('Mové tropas originales entre países propios vecinos y dejá una en origen.');
   a.troops-=c.amount;b.troops+=c.amount;s.movable[a.id]-=c.amount;log(s,'Reagrupación: '+M.territories[a.id].name+' → '+M.territories[b.id].name+' · '+c.amount+' tropas',now);
  }else if(c.type==='end'){if(s.phase==='reinforce'||s.pendingMove)return fail('Confirmá los refuerzos o el avance primero.');nextTurn(s,now);}
  else return fail('Acción desconocida.');
  checkGoals(s,now);
 }
 s.rev++;return {state:s,ok:true};
}
function publicState(s){const keys=['schema','id','rev','status','teams','board','order','turnPos','turnId','current','phase','deadline','phaseDeadline','remainingMs','phaseRemaining','durationMs','reinforceMs','actionMs','attacks','draft','budget','pendingMove','movable','rollUntil','battle','history','round','hostUntil','standings','winners','reason','finishedAt','reveal'];const out={};keys.forEach(k=>{if(s[k]!==undefined)out[k]=copy(s[k]);});out.stats=stats(s);return out;}
function result(s){if(s.status!=='finished')return null;const byTeam={};s.teams.forEach((t,i)=>byTeam[t.name]=s.winners.includes(i)?3:0);return {id:s.id,ts:s.finishedAt,byTeam,standings:s.standings,reason:s.reason,winners:s.winners};}
root.TegEngine={create,apply,tick,publicState,result,stats,goalProgress,budget,validDraft,ROLL,LIMIT};
})(typeof window!=='undefined'?window:globalThis);
