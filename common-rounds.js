/* El número visible de ronda es independiente de las claves de resultados.
   Así insertar rondas nunca cambia partidos, apuestas ni puntajes ya guardados. */
(function(){
  window.ensureCommonRoundOrder=function(shuffle){
    const ids=RoundPlan.ids(F2_FIXTURE,GAMES_F2);
    let order=Array.isArray(state.roundOrder)?state.roundOrder.filter(id=>ids.includes(id)):[];
    const missing=ids.filter(id=>!order.includes(id));
    if(!order.length || shuffle){
      order=ids.filter(id=>id.startsWith('duel:'));
      const common=ids.filter(id=>!id.startsWith('duel:'));
      for(let i=common.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[common[i],common[j]]=[common[j],common[i]];}
      common.forEach(id=>order.splice(Math.floor(Math.random()*(order.length+1)),0,id));
    }else missing.forEach(id=>order.splice(Math.floor(Math.random()*(order.length+1)),0,id));
    if(JSON.stringify(order)!==JSON.stringify(state.roundOrder)){state.roundOrder=order;saveState();}
    return order;
  };
  window.commonRoundNumber=id=>ensureCommonRoundOrder().indexOf(id)+1;
  window.commonRoundDone=function(id){
    if(id.startsWith('duel:'))return F2_FIXTURE.filter(m=>m[0]===Number(id.slice(5))).every(m=>state.f2[m[0]+'-'+m[1]+'-'+m[2]]);
    if(id==='impostor')return !!(state.impostor&&state.impostor.rounds&&state.impostor.rounds.length);
    if(id==='qld')return !!Object.keys(state.qldTeamPoints||{}).length;
    return !!Object.keys((state[id+'Round']||{}).byTeam||{}).length;
  };
  window.commonRoundHtml=function(id,n){
    const names={guess:'Guess Movies/Songs',argentinos:'100 Argentinos Dicen',impostor:'Impostor',qld:'¿Quién lo dijo?'};
    const action=id==='guess'?'activateGuessRound':id==='argentinos'?'activateArgentinosRound':'activateCommonRound';
    const activate=id==='guess'||id==='argentinos'?action+'('+n+',this)':action+'(\''+id+'\','+n+',this)';
    return '<div class="fixture-round"><div class="round-label">Ronda '+n+' <span class="bye-tag">'+names[id]+' · '+(id==='impostor'?'individual · no suma al ranking grupal':'todos los equipos juntos')+'</span><button class="fixture-edit-toggle" onclick="'+activate+'">▶ Activar ronda '+n+'</button></div><div class="match-row '+(commonRoundDone(id)?'done':'')+'" onclick="'+(id==='impostor'?"activateTab('impostor')":id==='qld'?"window.open('quien_lo_dijo.html','_blank')":"openAutoResultadosModal()")+'"><span class="match-game-badge">'+names[id]+'</span><span class="match-players">'+(id==='impostor'?'Ranking individual':'Resultado grupal')+'</span><span class="match-result">'+(commonRoundDone(id)?'✓ Cargado':'Abrir / cargar')+'</span></div></div>';
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
      if(id==='impostor')activateTab('impostor');else window.open('quien_lo_dijo.html','_blank');
    }catch(e){showToast('⚠️',e.message,false);}finally{button.disabled=false;}
  };
  window.commonAutoRows=function(){
    const order=ensureCommonRoundOrder(),limit=order.findIndex(id=>!commonRoundDone(id));
    const rows=[];
    order.forEach((id,index)=>{
      if(id.startsWith('duel:') || (limit>=0&&index>limit))return;
      const result=(window._commonResults||{})[id],firma=JSON.stringify(result||null);
      if(commonRoundDone(id)&&(!result||(state.autoResultadosAplicados||{})['common-'+id]===firma))return;
      rows.push({common:id,phase:'f2',round:index+1,matchId:'common-'+id,gameName:{guess:'Guess Movies/Songs',argentinos:'100 Argentinos Dicen',impostor:'Impostor',qld:'¿Quién lo dijo?'}[id],status:result?'auto':'pending',resultado:result,firma});
    });return rows;
  };
  window.commonAutoRowHtml=function(row){
    const res=row.resultado||{},data=res.byTeam||res.byGroup||{};
    return '<div class="match-row" style="display:block"><b>R'+row.round+' · '+row.gameName+'</b><div style="margin-top:8px">'+(row.status==='auto'?Object.entries(data).map(([n,p])=>n+': +'+p+' pts').join(' · '):'Finalizá el juego para recibir el resultado. Impostor se registra desde su propia pantalla y solo suma al ranking individual.')+'</div></div>';
  };
  window.applyCommonAutoRow=function(row){
    if(row.status!=='auto')return false;
    const res=row.resultado,byTeam=res.byTeam||res.byGroup;
    if(row.common==='guess'||row.common==='argentinos'){
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

window.hasCommonRoundResults=function(){return ['guess','argentinos','impostor','qld'].some(commonRoundDone);};
