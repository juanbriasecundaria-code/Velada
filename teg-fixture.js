/* TEG Express como ronda común: todos los equipos de la Velada juegan una sola partida.
   La activación (equipos + ranking) y el resultado viajan por velada/teg/* en la base
   que ya usa velada.html (window._rtdb), la misma que lee teg_express.html. */
(function(){
 const PATH='velada/teg',MIN_TEAMS=2,MAX_TEAMS=6;
 async function rtdb(){
  for(let i=0;i<20&&!window._rtdb;i++)await new Promise(r=>setTimeout(r,250));
  if(!window._rtdb)throw Error('Esperá la conexión con Firebase.');
  return window._rtdb;
 }
 // Posición y puntos de cada equipo en el ranking actual (los empates comparten puesto).
 function rankingInfo(){
  let pts=[];try{pts=getTeamPoints();}catch(e){}
  const rows=TEAMS.map((name,i)=>({name,i,total:Number((pts[i]||{}).total)||0}));
  const sorted=rows.slice().sort((a,b)=>b.total-a.total||a.i-b.i);
  let pos=0;sorted.forEach((r,k)=>{if(k===0||r.total!==sorted[k-1].total)pos=k+1;r.pos=pos;});
  return rows.map(r=>{
   const o={name:String(r.name),pos:r.pos,pts:r.total};
   let members=[];
   try{members=(PLAYERS||[]).filter(p=>teamIndexForPlayer(p)===r.i);}catch(e){}
   if(members.length)o.members=members.map(String);
   return o;
  });
 }
 window.tegRoundHtml=function(n){
  const done=commonRoundDone('teg');
  return '<div class="fixture-round"><div class="round-label">Ronda '+n+' <span class="bye-tag">🌍 TEG Express · todos contra todos · máximo 15 min</span><button class="fixture-edit-toggle" onclick="activateTegRound('+n+',this)">▶ Activar ronda '+n+'</button></div>'
   +'<div class="match-row '+(done?'done':'')+'" onclick="openCommonResultModal(\'teg\')"><span class="match-game-badge" style="color:#c8f060;background:#c8f06022">🌍 TEG Express</span><span class="match-players">'+TEAMS.map(commonEscape).join(' · ')+'</span><span class="match-result">'+(done?'✓ Cargado':(window._commonResults||{}).teg?'Resultado disponible':'Pendiente')+'</span></div></div>';
 };
 window.activateTegRound=async function(round,button){
  if(TEAMS.length<MIN_TEAMS||TEAMS.length>MAX_TEAMS){showToast('⚠️','TEG Express admite de '+MIN_TEAMS+' a '+MAX_TEAMS+' equipos y la Velada tiene '+TEAMS.length+'.',false);return;}
  button.disabled=true;
  try{
   const db=await rtdb();
   if(commonRoundDone('teg')&&!confirm('TEG ya tiene resultado cargado. ¿Activar la ronda de nuevo? Se descarta la partida anterior.'))return;
   const cur=(await db.ref(PATH+'/state').once('value')).val();
   if(cur&&cur.phase&&cur.phase!=='ended'&&!confirm('Hay una partida de TEG en curso. ¿Descartarla y activar la ronda de nuevo?'))return;
   const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),updates={};
   updates[PATH+'/activation']={active:true,id:token,round,ts:Date.now(),teams:TEAMS.map(String),info:rankingInfo()};
   ['state','actions','reactions','resultado','meta'].forEach(k=>{updates[PATH+'/'+k]=null;});
   await db.ref().update(updates);
   state.activeMatches=[];state.activeCommonRound={id:'teg',round};saveState();
   if(window._commonResults)delete window._commonResults.teg;
   if(typeof renderFixtureF2==='function')renderFixtureF2();
   showToast('🌍','Ronda activada. Abrí teg_express.html como «Pantalla» y tocá Nueva partida.',false);
  }catch(e){showToast('⚠️','No se pudo activar TEG: '+e.message,false);}finally{button.disabled=false;}
 };
 // El resultado solo vale si corresponde a la ronda activada (activationId) y trae puntos por equipo.
 async function listenResult(){
  let db;try{db=await rtdb();}catch(e){console.warn(e.message);return;}
  db.ref(PATH+'/resultado').on('value',async snap=>{
   try{
    const val=snap.val();let data=null;
    if(val&&val.byTeam){
     const act=(await db.ref(PATH+'/activation').once('value')).val();
     if(act&&act.id&&val.activationId===act.id)data=FirebaseTeamMaps.fromWire(val);
    }
    window._commonResults=window._commonResults||{};window._commonResults.teg=data;
    if(typeof renderFixtureF2==='function')renderFixtureF2();
   }catch(e){console.warn('Resultado TEG:',e.message);}
  });
 }
 listenResult();
})();
