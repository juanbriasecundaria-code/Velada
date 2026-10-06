/* El número visible de ronda es independiente de las claves de resultados.
   Así insertar rondas nunca cambia partidos, apuestas ni puntajes ya guardados. */
(function(){
  window.ensureCommonRoundOrder=function(shuffle){
    const ids=RoundPlan.ids(F2_FIXTURE,GAMES_F2);
    let order=Array.isArray(state.roundOrder)?state.roundOrder.filter(id=>ids.includes(id)):[];
    const missing=ids.filter(id=>!order.includes(id));
    if(!order.length || shuffle){
      order=ids.filter(id=>id.startsWith('duel:')&&!RoundPlan.isMarioRound(id,F2_FIXTURE,GAMES_F2));
      const common=ids.filter(id=>!id.startsWith('duel:')||RoundPlan.isMarioRound(id,F2_FIXTURE,GAMES_F2));
      for(let i=common.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[common[i],common[j]]=[common[j],common[i]];}
      common.forEach(id=>order.splice(Math.floor(Math.random()*(order.length+1)),0,id));
    }else missing.forEach(id=>order.splice(Math.floor(Math.random()*(order.length+1)),0,id));
    if(JSON.stringify(order)!==JSON.stringify(state.roundOrder)){state.roundOrder=order;saveState();}
    return order;
  };
  window.commonRoundNumber=id=>ensureCommonRoundOrder().indexOf(id)+1;
  window.commonRoundDone=function(id){
    if(id.startsWith('duel:'))return F2_FIXTURE.filter(m=>m[0]===Number(id.slice(5))).every(m=>state.f2[m[0]+'-'+m[1]+'-'+m[2]]);
    if(id==='impostor')return !!(state.impostorManualResult || state.impostor&&state.impostor.rounds&&state.impostor.rounds.length);
    if(id==='qld')return !!Object.keys(state.qldTeamPoints||{}).length;
    return !!Object.keys((state[id+'Round']||{}).byTeam||{}).length;
  };
  window.commonRoundHtml=function(id,n){
    if(id==='teg' && typeof tegRoundHtml==='function')return tegRoundHtml(n);
    const names={guess:'Guess Movies/Songs',argentinos:'100 Argentinos Dicen',impostor:'Impostor',qld:'¿Quién lo dijo?',teg:'🌍 TEG Express',erudito:'El Erudito'};
    const action=id==='teg'?'activateTegRound':id==='guess'?'activateGuessRound':id==='argentinos'?'activateArgentinosRound':id==='erudito'?'activateEruditoRound':'activateCommonRound';
    const activate=id==='teg'||id==='guess'||id==='argentinos'||id==='erudito'?action+'('+n+',this)':action+'(\''+id+'\','+n+',this)';
    const colors={guess:'#bf8cff',argentinos:'#f0bc54',impostor:'#ef7979',qld:'#6bc5ec',teg:'#c8f060',erudito:'#4ecb7e'};
    const roster=id==='impostor'?'Ranking individual':TEAMS.map(commonEscape).join(' · ');
    return '<div class="fixture-round"><div class="round-label">Ronda '+n+' <span class="bye-tag">'+names[id]+' · '+(id==='impostor'?'individual · no suma al ranking grupal':'todos los equipos juntos')+'</span><button class="fixture-edit-toggle" onclick="'+activate+'">▶ Activar ronda '+n+'</button></div><div class="match-row '+(commonRoundDone(id)?'done':'')+'" onclick="openCommonResultModal(\''+id+'\')"><span class="match-game-badge" style="color:'+colors[id]+';background:'+colors[id]+'22">'+names[id]+'</span><span class="match-players">'+roster+'</span><span class="match-result">'+(commonRoundDone(id)?'✓ Cargado':(window._commonResults||{})[id]?'Resultado disponible':'Abrir / cargar')+'</span></div></div>';
  };
  window.activateCommonRound=async function(id,round,button){
    if(!window._rtdb){showToast('⚠️','Esperá la conexión con Firebase',false);return;}
    button.disabled=true;
    try{
      const updates={},token=Date.now().toString(36);
      Object.entries(BuzzerRounds.paths).forEach(([game,path])=>{
        updates[path+'/fixture']={active:false,id:token,round,phase:'f2'};
        if(game==='movies'||game==='argentinos'){updates[path+'/state']='locked';updates[path+'/winner']=null;}
      });
      updates['velada/activeRound']={id,round,token};
      await window._rtdb.ref().update(updates);state.activeMatches=[];state.activeCommonRound={id,round};saveState();
      showToast('▶','Ronda '+round+' activada',true);
    }catch(e){showToast('⚠️',e.message,false);}finally{button.disabled=false;}
  };
  window.commonAutoRows=function(){
    const order=ensureCommonRoundOrder(),limit=order.findIndex(id=>!commonRoundDone(id));
    const rows=[];
    order.forEach((id,index)=>{
      if(id.startsWith('duel:'))return;
      if(limit>=0&&index>limit && !(window._commonResults||{})[id])return;
      const result=(window._commonResults||{})[id],firma=JSON.stringify(result||null);
      if(commonRoundDone(id)&&(!result||(state.autoResultadosAplicados||{})['common-'+id]===firma))return;
      rows.push({common:id,phase:'f2',round:index+1,matchId:'common-'+id,gameName:{guess:'Guess Movies/Songs',argentinos:'100 Argentinos Dicen',impostor:'Impostor',qld:'¿Quién lo dijo?',teg:'🌍 TEG Express',erudito:'El Erudito'}[id],status:result?'auto':'pending',resultado:result,firma});
    });return rows;
  };
  window.commonAutoRowHtml=function(row){
    const res=row.resultado||{},data=res.byTeam||res.byGroup||{};
    return '<div class="match-row" style="display:block"><b>R'+row.round+' · '+row.gameName+'</b><div style="margin-top:8px">'+(row.status==='auto'?Object.entries(data).map(([n,p])=>n+': +'+p+' pts').join(' · '):'Finalizá el juego para recibir el resultado. Impostor se registra desde su propia pantalla y solo suma al ranking individual.')+'</div></div>';
  };
  window.applyCommonAutoRow=function(row){
    if(row.status!=='auto')return false;
    const res=row.resultado,byTeam=res.byTeam||res.byGroup;
    if(row.common==='guess'||row.common==='argentinos'||row.common==='teg'||row.common==='erudito'){
      if(!byTeam||!TEAMS.every(t=>Number.isFinite(byTeam[t])))return false;
      state[row.common+'Round']={byTeam:Object.assign({},byTeam),ts:res.ts||Date.now()};
      if(row.common==='argentinos'&&state.adjust)state.adjust.f2=(state.adjust.f2||[]).filter(x=>x.label!=='100 Argentinos');
    }else if(row.common==='qld'){
      if(!Array.isArray(res.standings)||!res.standings.length)return false;
      state.qldTeamPoints={};res.standings.forEach(s=>{state.qldTeamPoints[s.teamIndex]=s.fase2Points||0;});window._qldTeamPoints=state.qldTeamPoints;
    }else return false;
    state.autoResultadosAplicados=state.autoResultadosAplicados||{};state.autoResultadosAplicados[row.matchId]=row.firma;return true;
  };
})();
window.editCommonCellPts=function(name,id){
  if(id==='impostor')return;
  state.commonCellPts=state.commonCellPts||{};
  const key=name+'||'+id,old=state.commonCellPts[key];
  const v=prompt('Puntos de '+name+' en R'+commonRoundNumber(id)+' ('+id+'). Vacío restaura el resultado del juego.',old===undefined?'':String(old));
  if(v===null)return;
  if(!v.trim())delete state.commonCellPts[key];
  else if(Number.isFinite(Number(v)))state.commonCellPts[key]=Number(v);
  else return;
  saveState();renderFase2();
};

window.nextCommonRound=function(){return ensureCommonRoundOrder().find(id=>!commonRoundDone(id));};
window.commonGroupRoundsDone=function(){return ensureCommonRoundOrder().filter(id=>!id.startsWith('duel:')&&id!=='impostor').every(commonRoundDone);};

window.hasCommonRoundResults=function(){return ['guess','argentinos','impostor','qld','teg','erudito'].some(commonRoundDone);};

function commonEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
window.openCommonResultModal=function(id){
  const names={guess:'Guess Movies/Songs',argentinos:'100 Argentinos Dicen',impostor:'Impostor',qld:'¿Quién lo dijo?',teg:'🌍 TEG Express',erudito:'El Erudito'};
  let bg=document.getElementById('common-result-modal');
  if(!bg){bg=document.createElement('div');bg.id='common-result-modal';bg.className='modal-bg';bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');document.body.append(bg);bg.onclick=e=>{if(e.target===bg)bg.classList.remove('open');};}
  window._commonEditing=id;
  const individual=id==='impostor',roster=individual?PLAYERS:TEAMS;
  const individualPts=individual?Puntos.jugadores({state,players:PLAYERS,rules:RULES_CONFIG}):[];
  const points=individual?individualPts.map(p=>p.total):id==='qld'?TEAMS.map((t,i)=>(state.qldTeamPoints||{})[i]||0):TEAMS.map(t=>((state[id+'Round']||{}).byTeam||{})[t]||0);
  bg.innerHTML='<div class="modal common-result-dialog"><div class="modal-title">'+names[id]+'</div><div class="modal-sub">Ronda '+commonRoundNumber(id)+' · '+(individual?'Resultado individual':'Todos los equipos')+'</div><div class="modal-players">'+roster.map((name,i)=>'<label class="modal-player-btn common-result-card"><span class="common-result-name">'+commonEscape(name)+'</span><span class="common-result-caption">Puntos finales</span><input class="common-result-points" type="number" step="1" id="common-points-'+i+'" value="'+points[i]+'" aria-label="Puntos de '+commonEscape(name)+'"></label>').join('')+'</div>'+(individual?'<div class="modal-bonus-row"><span class="modal-bonus-label">Suma únicamente al ranking individual.</span></div>':(window._commonResults||{})[id]?'<button class="empate-btn" onclick="importCommonResult()">Usar resultado publicado</button>':'')+'<div class="modal-actions"><button class="btn btn-ghost" onclick="document.getElementById(\'common-result-modal\').classList.remove(\'open\')">Cancelar</button><button class="btn btn-primary" onclick="saveCommonResult()">Guardar</button></div></div>';
  bg.classList.add('open');
};
window.importCommonResult=function(){
  const id=window._commonEditing,result=(window._commonResults||{})[id];
  if(!result){showToast('⚠️','Todavía no hay un resultado publicado para este juego',false);return;}
  const row={common:id,status:'auto',resultado:result,matchId:'common-'+id,firma:JSON.stringify(result)};
  if(!applyCommonAutoRow(row)){showToast('⚠️','El resultado no corresponde a todos los equipos actuales',false);return;}
  saveState();renderFase2();openCommonResultModal(id);showToast('✓','Resultado cargado',true);
};
window.saveCommonResult=function(){
  const id=window._commonEditing,roster=id==='impostor'?PLAYERS:TEAMS,values=roster.map((t,i)=>{const v=document.getElementById('common-points-'+i).value;return v.trim()?Number(v):NaN;});
  if(values.some(v=>!Number.isFinite(v))){showToast('⚠️','Completá los puntos de todos los equipos',false);return;}
  if(id==='impostor'){state.specialOverride=Object.fromEntries(values.map((v,i)=>[i,v]));state.impostorManualResult={ts:Date.now()};}
  else if(id==='qld'){state.qldTeamPoints=Object.fromEntries(values.map((v,i)=>[i,v]));window._qldTeamPoints=state.qldTeamPoints;}
  else state[id+'Round']={byTeam:Object.fromEntries(TEAMS.map((t,i)=>[t,values[i]])),ts:Date.now()};
  TEAMS.forEach(t=>{if(state.commonCellPts)delete state.commonCellPts[t+'||'+id];});
  saveState();renderFase2();if(id==='impostor'&&typeof renderImpostor==='function')renderImpostor();document.getElementById('common-result-modal').classList.remove('open');
};
