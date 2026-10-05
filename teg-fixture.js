/* One common round: all pre-existing teams share one TEG game. */
(function(){
 window.tegRoundHtml=function(n){
  const done=commonRoundDone('teg');
  return '<div class="fixture-round"><div class="round-label">Ronda '+n+' <span class="bye-tag">🌍 TEG Express · todos contra todos · máximo 15 min</span><button class="fixture-edit-toggle" onclick="activateTegRound('+n+',this)">▶ Activar ronda '+n+'</button></div>'
   +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><a class="fixture-edit-toggle" href="teg.html?mode=host" target="_blank" rel="noopener">🎙️ Abrir conductor</a><a class="fixture-edit-toggle" href="teg.html?mode=tv" target="_blank" rel="noopener">📺 Mapa en TV</a></div>'
   +'<div class="match-row '+(done?'done':'')+'" onclick="openCommonResultModal(\'teg\')"><span class="match-game-badge" style="color:#c8f060;background:#c8f06022">🌍 TEG Express</span><span class="match-players">'+TEAMS.map(commonEscape).join(' · ')+'</span><span class="match-result">'+(done?'✓ Cargado':(window._commonResults||{}).teg?'Resultado disponible':'Pendiente')+'</span></div></div>';
 };
 window.activateTegRound=async function(round,button){
  if(TEAMS.length<2||TEAMS.length>50){showToast('⚠️','TEG necesita entre 2 y 50 equipos.',false);return;}
  button.disabled=true;
  try{
   const cloud=await TegCloud.connect('fixture');
   const credential=prompt('Clave del conductor para activar TEG Express:');
   if(credential===null)return;
   await TegCloud.login(credential);
   const snap=await cloud.db.ref('velada/teg/public').once('value'),old=snap.val();
   if(old&&['running','paused'].includes(old.status)){showToast('ℹ️','Ya hay una partida TEG en curso. Abrí el conductor para continuarla.',false);return;}
   if(commonRoundDone('teg')){showToast('ℹ️','TEG ya tiene resultado. Para repetirlo, abrí el conductor y elegí Nueva partida.',false);return;}
   const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),updates={};
   updates['velada/teg/activation']={active:true,id:token,round,teams:TEAMS.slice()};
   await cloud.db.ref().update(updates);state.activeMatches=[];state.activeCommonRound={id:'teg',round};saveState();
   showToast('🌍','Ronda activada. Abrí el conductor de TEG para preparar la sala e iniciar.',false);
  }catch(e){showToast('⚠️','No se pudo activar TEG: '+e.message,false);}finally{button.disabled=false;}
 };
 // TEG uses guessmovie-905e2; other games retain their existing configurations.
 if(window.TEG_FIREBASE?.apiKey && window.TEG_FIREBASE?.appId){
  TegCloud.connect('fixture').then(c=>c.db.ref('velada/teg/result').on('value',snap=>{
   const data=FirebaseTeamMaps.fromWire(snap.val());window._commonResults=window._commonResults||{};window._commonResults.teg=data;
   if(typeof renderFixtureF2==='function')renderFixtureF2();
  },e=>showToast('⚠️','No se pudo leer el resultado TEG: '+e.message,false))).catch(e=>console.warn(e.message));
 }
})();
