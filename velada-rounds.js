/* Explicit activation: opening or re-rendering the fixture never changes a game. */
(function(){
  let busy=false;
  window.buzzerMatchButton=function(phase,index,game){
    return ''; // Se activa todo desde "Activar ronda N"; el botón por cruce quedó sin uso.
  };
  window.buzzerRoundButton=function(phase,round){
    return '<button class="fixture-edit-toggle" style="margin-left:10px" onclick="activateBuzzerRound(\''+phase+'\','+round+',this)">▶ Activar ronda '+round+'</button>';
  };
  function ctx(phase){return {players:PLAYERS,teams:TEAMS,fullNames:FULL_NAMES,games:GAMES_F2};}
  async function publish(phase,matches,button,wholeRound){
    if(busy) return;
    const db=window._rtdb;
    if(!db || !db.ref().update){showToast('⚠️','Todavía no hay conexión. Probá de nuevo en unos segundos.',false);return;}
    const context=ctx(phase), filtered=matches.filter(m=>BuzzerRounds.gameId(context.games[m[3]]));
    if(!filtered.length){showToast('ℹ️','No hay juegos vinculados en esa ronda.',false);return;}
    const games=filtered.map(m=>BuzzerRounds.gameId(context.games[m[3]]));
    if(new Set(games).size!==games.length){showToast('⚠️','Hay dos cruces del mismo juego. Activá cada cruce por separado.',false);return;}
    if(!confirm('¿Activar '+(wholeRound?'la ronda '+filtered[0][0]:'este cruce')+' en los celulares?\n\nSe cambia la selección de participantes y se reinicia el marcador de los juegos activados. Los resultados del fixture no se modifican.')) return;
    busy=true;
    if(button) button.disabled=true;
    try{
      const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10), updates={};
      filtered.forEach((m,i)=>{
        const match=BuzzerRounds.buildMatch(phase,m,context,token+'-'+i);
        updates[BuzzerRounds.paths[match.game]]=BuzzerRounds.initial(match);
      });
      // A full round closes stations with no match. Other stations stay independent on single activation.
      if(wholeRound) Object.keys(BuzzerRounds.paths).forEach(game=>{
        if(games.includes(game)) return;
        const p=BuzzerRounds.paths[game];
        updates[p+'/fixture']={active:false,id:token+'-closed',round:filtered[0][0],phase};
        if(game==='movies' || game==='argentinos'){updates[p+'/state']='locked';updates[p+'/winner']=null;}
      });
      await db.ref().update(updates);
      // El panel del participante solo avisa «te toca ahora» por cruces
      // realmente activados por el conductor, no por inferencia del fixture.
      state.activeMatches = filtered.map(m => ({ phase, key: m[0]+'-'+m[1]+'-'+m[2] }));
      saveState();
      showToast('🔔','Ronda '+filtered[0][0]+' publicada. Los celulares ya pueden elegir su nombre.',false);
    }catch(e){showToast('⚠️','No se pudo activar: '+e.message,false);}
    finally{busy=false;if(button)button.disabled=false;}
  }
  window.activateBuzzerRound=function(phase,round,button){
    const fx=F2_FIXTURE;
    return publish(phase,fx.filter(m=>m[0]===round),button,true);
  };
  window.activateBuzzerMatch=function(phase,index,button){
    const fx=F2_FIXTURE;
    if(fx[index]) return publish(phase,[fx[index]],button,false);
  };
})();

/* 100 Argentinos Dicen: ronda propia, todos juntos, sin otros juegos. */
(function(){
  const NAME='100 Argentinos Dicen', LABEL='100 Argentinos';
  const cargado=()=>!!(state.argentinosRound&&state.argentinosRound.byTeam&&Object.keys(state.argentinosRound.byTeam).length);
  window.argentinosRoundHtml=function(){
    const gi=GAMES_F2.indexOf(NAME);
    if(gi===-1||!F2_FIXTURE.length) return '';
    if(!state.argentinosRound){state.argentinosRound={byTeam:{}};saveState();}
    const r=Math.max.apply(null,F2_FIXTURE.map(m=>m[0]))+1, done=cargado();
    const c=GAME_COLORS_F2[gi]||['var(--surface2)','var(--muted)'];
    return '<div class="fixture-round"><div class="round-label">Ronda '+r+' <span class="bye-tag">🎤 Todos juegan juntos · sin otros juegos</span>'
      +'<button class="fixture-edit-toggle" style="margin-left:10px" onclick="activateArgentinosRound('+r+',this)">▶ Activar ronda '+r+'</button></div>'
      +'<div class="match-row '+(done?'done':'')+'" onclick="cargarArgentinosGrupal()"><span class="match-game-badge" style="background:'+c[0]+';color:'+c[1]+';font-weight:600">'+NAME+'</span>'
      +'<span class="match-players" style="font-size:12px">Todos los equipos (se arman grupos de juego)</span>'
      +'<span class="match-result '+(done?'set':'')+'">'+(done?'✓ Cargado':'Cargar')+'</span></div></div>';
  };
  window.activateArgentinosRound=async function(round,button){
    const db=window._rtdb;
    if(!db||!db.ref().update){showToast('⚠️','Todavía no hay conexión. Probá de nuevo en unos segundos.',false);return;}
    if(!confirm('¿Activar la ronda '+round+' (100 Argentinos Dicen, todos juntos)?\n\nSe cierran los cruces de los demás juegos en los celulares y 100 Argentinos queda libre para armar los grupos de juego.'))return;
    if(button)button.disabled=true;
    try{
      const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10), updates={};
      Object.keys(BuzzerRounds.paths).forEach(game=>{
        const p=BuzzerRounds.paths[game];
        updates[p+'/fixture']={active:false,id:token+'-closed',round:round,phase:'f2'};
        if(game==='movies'||game==='argentinos'){updates[p+'/state']='locked';updates[p+'/winner']=null;}
      });
      await db.ref().update(updates);
      state.activeMatches=[];saveState();
      showToast('🎤','Ronda '+round+' lista: abrí 100 Argentinos y armá los grupos de juego.',false);
    }catch(e){showToast('⚠️','No se pudo activar: '+e.message,false);}
    finally{if(button)button.disabled=false;}
  };
  window.cargarArgentinosGrupal=async function(){
    let res=null;
    try{if(window._rtdb){const s=await window._rtdb.ref('argentinos/grupos/resultado').once('value');res=s.val();}}catch(e){}
    if(!res){try{res=JSON.parse(localStorage.getItem('cad_group_result')||'null');}catch(e){}}
    if(!res||!res.byGroup){showToast('ℹ️','Todavía no hay resultado: en 100 Argentinos cerrá la ronda y confirmá el podio.',false);return;}
    const rows=TEAMS.filter(t=>typeof res.byGroup[t]==='number').map(t=>({name:t,pts:res.byGroup[t]}));
    if(!rows.length){showToast('⚠️','Los grupos del resultado no coinciden con los equipos de la velada.',false);return;}
    if(!confirm('Cargar 100 Argentinos Dicen:\n\n'+rows.map(x=>x.name+': +'+x.pts).join('\n')+(cargado()?'\n\nReemplaza la carga anterior.':'')))return;
    const byTeam={};rows.forEach(x=>{byTeam[x.name]=x.pts;});
    state.argentinosRound={byTeam:byTeam,ts:Date.now()};
    if(state.adjust&&state.adjust.f2)state.adjust.f2=state.adjust.f2.filter(x=>x.label!==LABEL);
    saveState();renderFase2();updateNavProgress();
    showToast('✅','100 Argentinos cargado al ranking',false);
  };
})();

/* Guess Movies & Songs: ronda propia, todos los equipos juntos, un solo buzzer con cola. */
(function(){
  const NAME='Guess Movie/Song';
  window.guessRoundNumber=function(){
    const base=F2_FIXTURE.length?Math.max.apply(null,F2_FIXTURE.map(m=>m[0])):0;
    return base+1+(state.argentinosRound?1:0);
  };
  window.guessRoundHtml=function(){
    const gi=GAMES_F2.indexOf(NAME);
    if(gi===-1||!F2_FIXTURE.length) return '';
    if(!state.guessRound){state.guessRound={byTeam:{}};saveState();}
    const r=guessRoundNumber();
    return '<div class="fixture-round"><div class="round-label">Ronda '+r+' <span class="bye-tag">🎬 Todos juegan juntos · un solo buzzer</span>'
      +'<button class="fixture-edit-toggle" style="margin-left:10px" onclick="activateGuessRound('+r+',this)">▶ Activar ronda '+r+'</button></div></div>';
  };
  window.activateGuessRound=async function(round,button){
    const db=window._rtdb;
    if(!db||!db.ref().update){showToast('⚠️','Todavía no hay conexión. Probá de nuevo en unos segundos.',false);return;}
    if(!confirm('¿Activar la ronda '+round+' (Guess Movies & Songs, todos los equipos juntos)?\n\nSe cierran los cruces de los demás juegos en los celulares y se habilita la selección de nombres de todos los equipos para el buzzer. Se reinicia el buzzer de Guess.'))return;
    if(button) button.disabled=true;
    try{
      const token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10), updates={};
      const match=BuzzerRounds.buildGroup(round,{players:PLAYERS,teams:TEAMS,fullNames:FULL_NAMES},token);
      Object.keys(BuzzerRounds.paths).forEach(game=>{
        const p=BuzzerRounds.paths[game];
        if(game==='movies'){updates[p]=BuzzerRounds.initial(match);return;}
        updates[p+'/fixture']={active:false,id:token+'-closed',round:round,phase:'f2'};
        if(game==='argentinos'){updates[p+'/state']='locked';updates[p+'/winner']=null;}
      });
      await db.ref().update(updates);
      state.activeMatches=[];saveState();
      showToast('🎬','Ronda '+round+' publicada. Los celulares ya pueden elegir su nombre y el buzzer queda listo.',false);
    }catch(e){showToast('⚠️','No se pudo activar: '+e.message,false);}
    finally{if(button)button.disabled=false;}
  };
})();
