/* Explicit activation: opening or re-rendering the fixture never changes a game. */
(function(){
  let busy=false;
  window.buzzerMatchButton=function(phase,index,game){
    return ''; // Se activa todo desde "Activar ronda N"; el botón por cruce quedó sin uso.
  };
  window.buzzerRoundButton=function(phase,round){
    return '<button class="fixture-edit-toggle" style="margin-left:10px" onclick="activateBuzzerRound(\''+phase+'\','+round+',this)">▶ Activar ronda '+round+'</button>';
  };
  function ctx(phase){return {players:PLAYERS,teams:TEAMS,fullNames:FULL_NAMES,games:phase==='f1'?GAMES_F1:GAMES_F2};}
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
    const fx=phase==='f1'?F1_FIXTURE:F2_FIXTURE;
    return publish(phase,fx.filter(m=>m[0]===round),button,true);
  };
  window.activateBuzzerMatch=function(phase,index,button){
    const fx=phase==='f1'?F1_FIXTURE:F2_FIXTURE;
    if(fx[index]) return publish(phase,[fx[index]],button,false);
  };
})();
