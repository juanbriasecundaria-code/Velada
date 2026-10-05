(function(){
'use strict';
const $=id=>document.getElementById(id), E=TegEngine,M=TegMap,params=new URLSearchParams(location.search),tv=params.get('mode')==='tv';
let id=crypto.randomUUID?crypto.randomUUID():'c'+Date.now()+Math.random().toString(36).slice(2);
let db=null,connected=false,offset=0,pub=null,session=null,activation=null,roster=null,player=null,myGoal=null,isHost=false,demo=false,selected=null,target=null,zoom=1,busy=false,lastBattle=null,battleTimer=null,toastTimer=null,queue=Promise.resolve(),seq=0,autoHostRequested=false;
let draftAmount=1,lastProjection=null,lastResult=null,presence={},hostTickQueued=false,hostSessionRef=null;
const now=()=>Date.now()+offset,esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=ms=>{let n=Math.max(0,Math.ceil(ms/1000));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
const members=team=>String(team).split('/').map(n=>n.trim()).filter(Boolean);
const own=t=>pub?.board?.filter(p=>p.owner===t)||[];
const active=()=>!!(pub&&player&&pub.current===player.team&&pub.status==='running'&&connected&&(demo||pub.hostUntil>=now()));
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);}
function splashOff(){$('splash').classList.add('exit');setTimeout(()=>$('splash').hidden=true,600);}
function normalize(s){if(!s)return s;s.clients=s.clients||{};s.processed=s.processed||{};s.history=s.history||[];s.draft=s.draft||{};s.movable=s.movable||{};s.order=s.order||[];s.goals=s.goals||[];s.captures=s.teams.map((_,i)=>s.captures?.[i]||0);return s;}
function teams(){return pub?.teams||((activation?.teams||roster?.teams||[]).map((name,i)=>({name,color:['#c8f060','#60b4f0','#ff7979','#c060e8','#f5c842','#4cdbc3'][i%6]})));}
function renderLobby(){
 const ts=teams();$('team-select').innerHTML=ts.map((t,i)=>'<div class="team-card" style="--team:'+t.color+'"><div class="eyebrow"><i class="team-dot"></i>EQUIPO '+(i+1)+'</div><b>'+esc(t.name)+'</b><small>Un color · una misión · decisiones compartidas</small><div class="member-buttons">'+members(t.name).map(p=>'<button data-join="'+i+'" data-name="'+esc(p)+'">'+esc(p)+'</button>').join('')+'</div></div>').join('');
 $('lobby-status').textContent=!connected?'Sin conexión. Podés ensayar en este dispositivo.':!activation?.active?'Esperando que el conductor active la ronda desde el fixture.':pub?.status==='finished'?'La partida terminó. Podés entrar a ver el resultado.':'Ronda '+(activation.round||pub?.round||'')+' · elegí tu nombre y esperá la salida.';
}
function mapSvg(s){
 const board=s?.board||M.territories.map(p=>({id:p.id,owner:-1,troops:1})),near=selected===null?[]:M.territories[selected].neighbors;
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+M.viewBox+'" role="img" aria-label="Mapa de TEG, 50 países"><defs><radialGradient id="sea"><stop stop-color="#213739"/><stop offset="1" stop-color="#152329"/></radialGradient></defs><g transform="'+M.translate+'"><path d="'+M.sea+'" fill="url(#sea)" stroke="#61736a" stroke-width=".8"/>'+M.bridgePaths.map(p=>'<path d="'+p.d+'" transform="'+p.transform+'" fill="none" stroke="#a79069" stroke-width="1" stroke-dasharray="2 2" opacity=".65"/>').join('')+M.territories.map(p=>{const b=board[p.id],color=s?.teams[b.owner]?.color||'#8b9985';return '<path data-country="'+p.id+'" id="country-'+p.id+'" class="territory '+(selected===p.id?'selected':'')+' '+(near.includes(p.id)?'neighbor':'')+'" d="'+p.d+'" transform="'+p.transform+'" fill="'+color+'"><title>'+esc(p.name)+' · '+esc(s?.teams[b.owner]?.name||p.continent)+' · '+b.troops+' tropas</title></path>';}).join('')+'</g><g>'+M.territories.map(p=>{const b=board[p.id],plus=s?.draft?.[p.id]||0;return '<g data-country="'+p.id+'" class="country-node"><text class="country-label" x="'+p.x+'" y="'+(p.y-2)+'">'+esc(p.name)+'</text><circle class="army-bg" cx="'+p.x+'" cy="'+(p.y+5)+'" r="4.8"/><text class="army-count" x="'+p.x+'" y="'+(p.y+6.7)+'">'+b.troops+'</text>'+(plus?'<text class="army-count" x="'+(p.x+8)+'" y="'+(p.y+6.7)+'" style="fill:#c8f060">+'+plus+'</text>':'')+'</g>';}).join('')+'</g></svg>';
}
function renderMap(){const wrap=$('map-wrap'),left=wrap.scrollLeft,top=wrap.scrollTop;wrap.innerHTML=mapSvg(pub);wrap.firstElementChild.style.width=(Math.max(wrap.clientWidth||590,!tv&&window.innerWidth<650?1000:590)*zoom)+'px';wrap.scrollLeft=left;wrap.scrollTop=top;}
function renderStats(){const rows=pub?.stats||E.stats(normalize(session));$('scoreboard').innerHTML=rows.map(t=>'<div class="score-card '+(pub.current===t.team?'active':'')+'" style="--team:'+t.color+'"><b><i class="team-dot"></i>'+esc(t.name)+'</b><div class="score-values"><div><strong>'+t.countries+'</strong><small>PAÍSES</small></div><div><strong>'+t.troops+'</strong><small>TROPAS</small></div></div></div>').join('');$('history').innerHTML=(pub.history||[]).slice(-3).reverse().map(h=>'<div>'+esc(h.text)+'</div>').join('');}
function renderGoal(){
 $('mission').hidden=tv||isHost&&!demo||!myGoal||pub?.status==='lobby';
 if(!myGoal)return;const p=myGoal.progress||{value:0,target:myGoal.target};$('mission-body').innerHTML='<h3>'+esc(myGoal.title)+'</h3><p>'+esc(myGoal.detail)+'</p><progress max="'+p.target+'" value="'+p.value+'"></progress><p>'+p.value+' / '+p.target+' · oculto para los rivales</p>';
}
function renderActions(){
 const box=$('action-panel');if(tv)return;
 const can=active(),phase=pub.phase,total=Object.values(pub.draft||{}).reduce((a,b)=>a+b,0),left=(pub.budget?.total||0)-total;
 let html='';
 if(pub.status==='lobby')html='<div class="eyebrow">SALA PREVIA</div><h3>Prepará tu estrategia.</h3><p>El conductor inicia la partida. El mapa y tu objetivo se sortean al dar la salida.</p>';
 else if(pub.status==='paused')html='<span class="phase-tag">EN PAUSA</span><h3>Un respiro en la batalla.</h3><p>Ambos relojes están detenidos. El conductor reanuda la partida.</p>';
 else if(pub.status==='finished')html='<div class="eyebrow">PARTIDA FINALIZADA</div><h3>La conquista terminó.</h3><p>El resultado ya está listo para el fixture.</p>';
 else if(!can)html='<span class="phase-tag">'+(connected?'ESPERANDO TURNO':'SIN CONEXIÓN')+'</span><h3>'+esc(pub.teams[pub.current]?.name||'')+'</h3><p>'+(connected?'Podés explorar el mapa mientras decide el otro equipo.':'Las acciones están bloqueadas hasta reconectar.')+'</p>';
 else if(phase==='reinforce')html='<span class="phase-tag">1 / REFUERZOS</span><h3>'+own(player.team).length+' países → +'+pub.budget.total+' tropas</h3><p>Base: '+pub.budget.base+(Object.keys(pub.budget.continents||{}).length?' · Continentes: '+Object.entries(pub.budget.continents).map(([c,n])=>esc(c)+' +'+n).join(', '):'')+'. Elegí tus países y repartí con + y −.</p><div class="big-number">'+left+' <small style="font-size:12px;color:var(--muted)">por colocar</small></div><button class="primary" data-action="deploy">Confirmar refuerzos</button><p>Al confirmar o vencer el tiempo, los restantes se distribuyen automáticamente.</p>';
 else if(pub.pendingMove)html='<span class="phase-tag">CONQUISTA</span><h3>'+esc(M.territories[pub.pendingMove.to].name)+' es tuyo.</h3><p>Ya avanzó 1 tropa. Podés sumar hasta '+pub.pendingMove.max+' más, dejando una en origen.</p><select id="advance-amount">'+Array.from({length:pub.pendingMove.max+1},(_,i)=>'<option value="'+i+'">'+(i+1)+' tropa'+(i?'s':'')+' en total</option>').join('')+'</select><button class="primary" data-action="advance">Confirmar avance</button>';
 else if(phase==='attack')html='<span class="phase-tag">2 / ATAQUE</span><h3>Elegí tu próximo frente.</h3><p>Tocá un país propio y después un enemigo vecino. '+pub.attacks+' / 2 tiradas usadas.</p><button data-action="regroup">Pasar a reagrupar →</button><button class="ghost" data-action="end">Terminar turno</button>';
 else html='<span class="phase-tag">3 / REAGRUPAR</span><h3>Ordená tus tropas.</h3><p>Elegí dos países propios vecinos. Ya no podés atacar en este turno.</p><button class="primary" data-action="end">Terminar turno →</button>';
 box.innerHTML=html;box.querySelectorAll('button').forEach(b=>b.disabled=busy);renderCountry();
}
function renderCountry(){
 const box=$('country-info');if(!pub||tv)return;
 const list='<select id="country-picker"><option value="">Elegir país…</option>'+M.territories.map(p=>'<option value="'+p.id+'" '+(selected===p.id?'selected':'')+'>'+esc(p.name)+(pub.board[p.id].owner===player?.team?' · tuyo':'')+'</option>').join('')+'</select>';
 if(selected===null){box.innerHTML='<div class="eyebrow">EXPLORÁ EL MAPA</div>'+list+'<p>También podés tocar un país en el mapa. Deslizá para recorrerlo.</p>';return;}
 const p=M.territories[selected],b=pub.board[selected],can=active(),my=b.owner===player?.team;
 let actions='';
 if(can&&my&&pub.phase==='reinforce')actions='<div class="split-actions"><button data-draft="-1">−</button><button data-draft="1">+</button></div><p>'+(pub.draft?.[selected]||0)+' refuerzos asignados a este país.</p>';
 if(can&&my&&(pub.phase==='attack'||pub.phase==='regroup')&&!pub.pendingMove){
  const valid=p.neighbors.filter(i=>pub.phase==='attack'?pub.board[i].owner!==player.team:pub.board[i].owner===player.team),attack=pub.phase==='attack';
  if(valid.length&&b.troops>1){if(!valid.includes(target))target=valid[0];const options=valid.map(i=>'<option value="'+i+'" '+(i===target?'selected':'')+'>'+esc(M.territories[i].name)+' · '+pub.board[i].troops+' tropas</option>').join('');actions='<label class="muted">'+(attack?'Atacar a':'Trasladar a')+'</label><select id="target-picker">'+options+'</select>';
   if(!attack){const max=Math.min(b.troops-1,pub.movable?.[selected]||0);draftAmount=Math.min(draftAmount,max);actions+='<label class="muted">Tropas: <span id="move-value">'+draftAmount+'</span></label><input id="move-amount" type="range" min="1" max="'+Math.max(1,max)+'" value="'+Math.max(1,draftAmount)+'" '+(max<1?'disabled':'')+'>';}
   actions+='<button class="primary" data-action="'+(attack?'attack':'move')+'" '+((attack?pub.attacks>=2:(pub.movable?.[selected]||0)<1)||busy?'disabled':'')+'>'+(attack?'🎲 Tirar dados y atacar':'Mover tropas')+'</button>';
  }else actions='<p>No hay '+(attack?'ataques':'traslados')+' disponibles desde este país.</p>';
 }
 box.innerHTML='<div class="eyebrow">'+esc(p.continent)+'</div><h3>'+esc(p.name)+'</h3>'+list+'<div class="country-stats"><span class="big-number">'+b.troops+'</span><span class="muted">tropas<br>'+esc(pub.teams[b.owner]?.name||'Sin repartir')+'</span></div>'+actions+'<p>Vecinos: '+p.neighbors.map(i=>esc(M.territories[i].name)).join(' · ')+'</p>';
}
function renderFinished(){
 const box=$('finish-panel');box.hidden=pub?.status!=='finished';if(box.hidden)return;
 const names=(pub.winners||[]).map(i=>pub.teams[i].name).join(' + ');
 box.innerHTML='<div class="trophy">🏆</div><div class="eyebrow accent">'+(pub.reason==='objective'?'MISIÓN CUMPLIDA':'FIN DE LA CONQUISTA')+'</div><h2>'+esc(names)+'</h2><p class="muted">'+(pub.reason==='objective'?'Un objetivo secreto decidió la partida.':pub.reason==='time'?'Se cumplieron los 15 minutos. Resultado por países y tropas.':'El conductor cerró la partida.')+'</p>'+(pub.reveal||[]).map(r=>'<p><b>'+esc(r.goal.title)+'</b> · '+esc(r.goal.detail)+'</p>').join('')+(pub.standings||[]).map(t=>'<div class="result-row"><span>'+esc(t.name)+'</span><span>'+t.countries+' países · '+t.troops+' tropas · <b>'+(pub.winners.includes(t.team)?'+3':'+0')+' pts</b></span></div>').join('');
}
function render(){
 renderLobby();const show=!!pub&&(player||isHost||tv);$('lobby').hidden=show;$('arena').hidden=!show;if(!pub)return;
 $('host-panel').hidden=!isHost;$('start-game').hidden=pub.status!=='lobby';$('pause-game').hidden=!['running','paused'].includes(pub.status);$('pause-game').textContent=pub.status==='paused'?'▶ Reanudar':'⏸ Pausar';$('finish-game').hidden=!['running','paused'].includes(pub.status);
 $('round-caption').textContent=(demo?'ENSAYO LOCAL · ':'')+'RONDA '+(pub.round||'ÚNICA')+' · TODOS CONTRA TODOS';
 $('turn-title').textContent=pub.status==='lobby'?'El mundo está por repartirse.':pub.status==='finished'?'La conquista terminó.':pub.status==='paused'?'Partida en pausa.':'Turno de '+(pub.teams[pub.current]?.name||'');
 $('turn-sub').textContent=pub.status==='lobby'?pub.teams.length+' equipos · reparto y objetivos automáticos':pub.status==='running'?({reinforce:'Colocando refuerzos',attack:'Ataque · hasta 2 tiradas',regroup:'Reagrupando tropas'}[pub.phase]||''):'🌍 TEG Express · una ronda, todos contra todos';
 $('identity').innerHTML=player?'<b><i class="team-dot" style="--team:'+pub.teams[player.team]?.color+'"></i>'+esc(player.name)+'</b><small>'+esc(pub.teams[player.team]?.name)+' · controles compartidos</small>':'<b>🎙️ Conductor</b><small>El mapa público no muestra las misiones secretas.</small>';
 if(demo)$('identity').innerHTML+='<div class="demo-badge">ENSAYO LOCAL · no publica puntos. <button data-demo-switch>Controlar equipo del turno</button></div>';
 renderMap();renderStats();renderGoal();renderActions();renderFinished();updateClocks();if(pub.battle)showBattle(pub.battle);
}
function updateClocks(){
 if(!pub)return;const running=pub.status==='running',global=running?pub.deadline-(demo?now():Math.min(now(),pub.hostUntil||now())):pub.remainingMs??900000;
 $('global-clock').textContent=clock(global);$('global-clock').style.color=global<60000?'#ff7979':'#c8f060';
 const left=running?pub.phaseDeadline-(demo?now():Math.min(now(),pub.hostUntil||now())):pub.phaseRemaining??0;$('phase-clock').textContent=pub.status==='lobby'?'El reloj empieza al iniciar':pub.status==='finished'?'Partida finalizada':(pub.status==='paused'?'En pausa · ':'Turno · ')+clock(left);
 const hostGone=!demo&&running&&pub.hostUntil<now();$('waiting-banner').hidden=!hostGone;if(hostGone)$('waiting-banner').textContent='El conductor perdió la conexión. Las acciones esperan su regreso; el reloj se pausará al recuperar la partida.';
}
const faces={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function diceHtml(values,rolling,results){return values.map((v,i)=>'<div class="die '+(rolling?'rolling':results?.[i]===true?'win':results?.[i]===false?'lose':'')+'" aria-label="Dado '+v+'">'+Array.from({length:9},(_,p)=>'<i class="'+(faces[v].includes(p)?'':'off')+'"></i>').join('')+'</div>').join('');}
function showBattle(b){
 if(lastBattle===b.id)return;lastBattle=b.id;clearInterval(battleTimer);const recent=now()-b.at<8000;if(!recent)return;
 $('battle-overlay').hidden=false;$('battle-route').textContent=M.territories[b.from].name+' → '+M.territories[b.to].name;$('attack-name').textContent=pub.teams[b.attacker].name;$('defense-name').textContent=pub.teams[b.defender].name;
 $('attack-name').style.color=pub.teams[b.attacker].color;$('defense-name').style.color=pub.teams[b.defender].color;
 const end=()=>{clearInterval(battleTimer);const a=b.attack.map((v,i)=>i<b.defense.length?v>b.defense[i]:null),d=b.defense.map((v,i)=>i<b.attack.length?v>=b.attack[i]:null);$('attack-dice').innerHTML=diceHtml(b.attack,false,a);$('defense-dice').innerHTML=diceHtml(b.defense,false,d);$('battle-outcome').textContent=(b.conquered?'🏳️ ¡Territorio conquistado! · ':'')+'Ataque −'+b.lostA+' · Defensa −'+b.lostD;setTimeout(()=>{if(lastBattle===b.id)$('battle-overlay').hidden=true;},1600);};
 const frame=()=>{if(now()>=b.until){end();return;}$('attack-dice').innerHTML=diceHtml(b.attack.map(()=>1+Math.floor(Math.random()*6)),true);$('defense-dice').innerHTML=diceHtml(b.defense.map(()=>1+Math.floor(Math.random()*6)),true);$('battle-outcome').textContent='Los dados están rodando…';};frame();if(now()<b.until)battleTimer=setInterval(frame,110);
}
async function publish(s){
 const out=E.publicState(s),signature=JSON.stringify({...out,hostUntil:0,clients:s.clients});
 if(signature===lastProjection){await db.ref('velada/teg/public/hostUntil').set(s.hostUntil);return;}
 const u={'velada/teg/public':out};Object.entries(s.clients||{}).forEach(([client,c])=>{if(s.goals[c.team])u['velada/teg/objectives/'+client]={...s.goals[c.team],progress:E.goalProgress(s,c.team),session:s.id};});
 const res=E.result(s);if(res&&JSON.stringify(res)!==lastResult)u['velada/teg/result']=FirebaseTeamMaps.toWire(res);
 await db.ref().update(u);lastProjection=signature;if(res)lastResult=JSON.stringify(res);
}
async function transact(mutator){
 const ref=hostSessionRef||db.ref('velada/teg/session');
 await ref.once('value');let response=null;
 const r=await ref.transaction(raw=>{
  const time=now();let s=normalize(raw);if(!s||s.hostId!==id)return;
  if(s.hostUntil<time&&s.status==='running')s=E.apply(s,{type:'pause'},s.hostUntil||time).state;
  response=mutator(s,time);s=response.state||s;s.hostId=id;s.hostUntil=time+6000;return s;
 },undefined,false);
 if(!r.committed)throw Error('Otro conductor tiene el control o venció la conexión. Volvé a entrar al modo conductor.');
 session=normalize(r.snapshot.val());await publish(session);return response;
}
function enqueue(fn){queue=queue.then(fn).catch(e=>toast(e.message));return queue;}
async function claimHost(){
 if(demo){isHost=true;render();return;}
 if(!connected||!activation?.active)throw Error('Activá primero la ronda TEG Express desde el fixture y verificá la conexión.');
 if(!hostSessionRef){hostSessionRef=db.ref('velada/teg/session');hostSessionRef.on('value',snap=>{session=normalize(snap.val());});}
 await hostSessionRef.once('value');
 const r=await hostSessionRef.transaction(raw=>{
  const time=now();let s=normalize(raw);if(s?.hostId&&s.hostId!==id&&s.hostUntil>time)return;
  if(!s||s.activationId!==activation.id){s=E.create(activation.teams,time);s.activationId=activation.id;s.round=activation.round;}
  else if(s.status==='running'&&s.hostUntil<time){
   // Pause at the last acknowledged heartbeat; reconnecting does not consume an absent conductor's time.
   const stopped=Math.min(time,s.hostUntil||time);s=E.apply(s,{type:'pause'},stopped).state;
  }
  s.hostId=id;s.hostUntil=time+6000;return s;
 },undefined,false);
 if(!r.committed)throw Error('Ya hay un conductor conectado. Usá esa pestaña o esperá unos segundos si se cerró.');
 session=normalize(r.snapshot.val());isHost=true;await publish(session);render();
 db.ref('velada/teg/presence').on('value',snap=>{presence=snap.val()||{};$('host-hint').textContent='Conectados: '+Object.values(presence).map(p=>p.name).join(' · ')+'. Mantené esta pestaña abierta.';});
 db.ref('velada/teg/commands').off('child_added',processCommand);db.ref('velada/teg/commands').on('child_added',processCommand);
}
function processCommand(snap){if(!isHost)return;enqueue(async()=>{
 const c=snap.val();if(!c||!c.client||!c.id)return db.ref('velada/teg/commands/'+snap.key).remove();
 let reply={seq:c.seq};
 await transact((s,time)=>{
  if(s.processed[c.id])return {state:s};
  let ok=false,message='';
  if(c.session!==s.id)message='Cambió la partida. Volvé a elegir tu nombre.';
  else if(time-c.sentAt>20000||c.sentAt>time+5000)message='La acción venció. Intentá de nuevo.';
  else if(c.type==='join'){
   if(Number.isInteger(c.team)&&s.teams[c.team]&&members(s.teams[c.team].name).includes(c.name)){s.clients[c.client]={team:c.team,name:c.name};ok=true;}
   else message='Ese participante no pertenece al equipo.';
  }else{
   const actor=s.clients[c.client];if(!actor)message='Elegí tu nombre para entrar.';
   else{const r=E.apply(s,{...c,team:actor.team},time);s=r.state;ok=r.ok;message=r.message||'';}
  }
  s.processed[c.id]=true;const keys=Object.keys(s.processed);if(keys.length>200)delete s.processed[keys[0]];
  reply={...reply,ok,message,session:s.id};return {state:s};
 });
 await db.ref('velada/teg/replies/'+c.client).set(reply);await db.ref('velada/teg/commands/'+snap.key).remove();
 });}
async function send(type,extra={}){
 if(!pub)return toast('Esperá que el conductor prepare la sala.');
 if(busy)return;
 if(demo){const r=E.apply(session,{type,rev:session.rev,turnId:session.turnId,team:player?.team,...extra},now());session=r.state;if(!r.ok)toast(r.message);pub=E.publicState(session);if(player&&session.goals[player.team])myGoal={...session.goals[player.team],progress:E.goalProgress(session,player.team)};render();return;}
 if(!connected)return toast('No hay conexión. Esperá antes de actuar.');
 if(isHost&&['start','pause','resume','finish'].includes(type))return enqueue(async()=>{const r=await transact((s,t)=>E.apply(s,{type},t));if(!r.ok)toast(r.message);});
 const command={type,...extra,id:crypto.randomUUID?crypto.randomUUID():id+'-'+(++seq),seq:++seq,client:id,session:pub.id,rev:pub.rev,turnId:pub.turnId,team:player?.team??-1,sentAt:now()};
 busy=true;renderActions();try{await db.ref('velada/teg/commands').push(command);}catch(e){busy=false;toast('No se pudo enviar la acción: '+e.message);renderActions();}
 setTimeout(()=>{if(busy){busy=false;toast('El conductor todavía no confirmó la acción. Esperá la actualización antes de repetir.');renderActions();}},8000);
}
async function join(team,name){
 if(!pub){if(!isHost)toast('El conductor debe abrir la sala primero.');return;}
 player={team,name};myGoal=null;selected=null;target=null;sessionStorage.setItem('teg-player',JSON.stringify(player));
 if(demo){myGoal={...session.goals[team],progress:E.goalProgress(session,team)};render();return;}
 await send('join',{team,name});render();
 db.ref('velada/teg/objectives/'+id).off('value');
 db.ref('velada/teg/objectives/'+id).on('value',s=>{const g=s.val();myGoal=g?.session===pub?.id?g:null;renderGoal();},e=>toast('No se pudo leer tu objetivo: '+e.message));
 const presence=db.ref('velada/teg/presence/'+id);await presence.set({team,name,seen:now()});presence.onDisconnect().remove();
}
async function init(){
 try{
  const c=await TegCloud.connect(tv?'tv':'game');db=c.db;id=c.uid;
  db.ref('.info/serverTimeOffset').on('value',s=>offset=s.val()||0);
  db.ref('.info/connected').on('value',s=>{connected=!!s.val();$('connection').className='connection '+(connected?'online':'');$('connection').textContent=connected?'En vivo':'Sin conexión';render();});
  db.ref('velada/teg/activation').on('value',s=>{activation=s.val();renderLobby();if(params.get('mode')==='host'&&!autoHostRequested&&activation?.active){autoHostRequested=true;$('host-dialog').showModal();}});
  db.ref('velada/teg/public').on('value',s=>{if(demo)return;const next=s.val();if(pub&&next?.id!==pub.id){myGoal=null;selected=null;target=null;lastBattle=null;player=null;busy=false;}pub=next;render();},e=>toast('No se pudo leer TEG: '+e.message));
  db.ref('velada/teg/replies/'+id).on('value',s=>{const r=s.val();if(!r)return;busy=false;if(!r.ok)toast(r.message||'Acción rechazada.');renderActions();});
 }catch(e){$('connection').textContent='Sin conexión';$('lobby-status').textContent=e.message+' Podés ensayar sin conexión.';}
}
function demoStart(){
 demo=true;connected=true;isHost=true;const names=teams().map(t=>t.name);session=E.create(names.length>=2?names:['Equipo Lima / Jugador 2','Equipo Azul / Jugador 4','Equipo Coral / Jugador 6','Equipo Violeta / Jugador 8'],now());session.round=1;session=E.apply(session,{type:'start'},now()).state;pub=E.publicState(session);player={team:session.current,name:members(session.teams[session.current].name)[0]};myGoal={...session.goals[player.team],progress:E.goalProgress(session,player.team)};$('connection').textContent='Ensayo local';render();splashOff();
}
$('enter').onclick=splashOff;$('rules-open').onclick=()=>$('rules').showModal();$('rules-close').onclick=$('rules-ok').onclick=()=>$('rules').close();$('host-open').onclick=()=>$('host-dialog').showModal();$('host-cancel').onclick=()=>$('host-dialog').close();
$('host-form').onsubmit=async e=>{e.preventDefault();try{if(!demo)await TegCloud.login($('host-password').value.trim());await claimHost();$('host-dialog').close();splashOff();}catch(e){$('host-error').textContent=e.message;}};
$('start-game').onclick=()=>send('start');$('pause-game').onclick=()=>send(pub.status==='paused'?'resume':'pause');$('finish-game').onclick=()=>{if(confirm('¿Finalizar la partida y publicar el resultado por países y tropas?'))send('finish');};
$('reset-game').onclick=()=>{if(!confirm('¿Preparar otra partida? Se borra el resultado TEG anterior y se vuelven a sortear países y objetivos al iniciar.'))return;
 if(demo){demoStart();return;}enqueue(async()=>{await transact((s,t)=>{const next=E.create(activation.teams,t);next.activationId=activation.id;next.round=activation.round;return {state:next};});await db.ref('velada/teg/result').remove();});};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){toast('Usá pantalla completa desde el navegador.');}};
$('demo-start').onclick=demoStart;$('change-team').onclick=()=>{player=null;myGoal=null;$('mission').open=false;render();};
$('zoom-in').onclick=()=>{zoom=Math.min(2.5,zoom+.25);renderMap();};$('zoom-out').onclick=()=>{zoom=Math.max(1,zoom-.25);renderMap();};
$('team-select').onclick=e=>{const b=e.target.closest('[data-join]');if(b)join(Number(b.dataset.join),b.dataset.name);};
$('map-wrap').onclick=e=>{const p=e.target.closest('[data-country]');if(!p)return;const country=Number(p.dataset.country);
 if(selected!==null&&active()&&(pub.phase==='attack'||pub.phase==='regroup')&&M.territories[selected].neighbors.includes(country)&&pub.board[selected].owner===player.team&&(pub.phase==='attack'?pub.board[country].owner!==player.team:pub.board[country].owner===player.team)){target=country;renderCountry();}
 else{selected=country;target=null;renderMap();renderCountry();}};
$('country-info').onchange=e=>{if(e.target.id==='country-picker'){selected=e.target.value===''?null:Number(e.target.value);target=null;renderMap();renderCountry();}if(e.target.id==='target-picker')target=Number(e.target.value);};
$('country-info').oninput=e=>{if(e.target.id==='move-amount'){draftAmount=Number(e.target.value);$('move-value').textContent=draftAmount;}};
function actionClick(e){const b=e.target.closest('[data-action],[data-draft],[data-demo-switch]');if(!b)return;
 if(b.hasAttribute('data-demo-switch')){player={team:session.current,name:members(session.teams[session.current].name)[0]};myGoal={...session.goals[player.team],progress:E.goalProgress(session,player.team)};selected=null;target=null;render();return;}
 if(b.hasAttribute('data-draft'))return send('draft',{country:selected,delta:Number(b.dataset.draft)});
 const type=b.dataset.action;if(type==='attack'||type==='move')return send(type,{from:selected,to:target,...(type==='move'?{amount:Number($('move-amount').value)}:{})});
 if(type==='advance')return send('advance',{amount:Number($('advance-amount').value)});send(type);
}
$('action-panel').onclick=$('country-info').onclick=$('identity').onclick=actionClick;
if(tv){document.body.classList.add('tv-mode');splashOff();}if(params.get('demo')==='1')demoStart();else init();
setInterval(()=>{
 updateClocks();if(demo&&session){const before=JSON.stringify(session);E.tick(session,now());if(JSON.stringify(session)!==before){session.rev++;pub=E.publicState(session);if(player&&session.goals[player.team])myGoal={...session.goals[player.team],progress:E.goalProgress(session,player.team)};render();}}
 if(isHost&&!demo&&connected&&!hostTickQueued){hostTickQueued=true;enqueue(async()=>{try{await transact((s,t)=>{const before=JSON.stringify(s);E.tick(s,t);if(JSON.stringify(s)!==before)s.rev++;return {state:s};});}finally{hostTickQueued=false;}});}
},1000);
window.TegUI={mapSvg,diceHtml,render,demoStart};
})();
