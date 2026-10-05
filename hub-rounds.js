/* Round-specific name selection for the four fixture games. QLD keeps its own flow. */
(function(){
  const oldSelect=selectGame, oldTeam=selectTeam, oldBack=goBack, oldBuzz=doBuzz;
  let ref=null, listener=null, connListener=null, match=null, player=null, connected=false, request=0;
  const box=document.createElement('div');
  box.id='fixture-caption';box.style.cssText='max-width:360px;text-align:center;margin:0 0 20px;line-height:1.5;font-weight:700;color:var(--accent)';
  document.getElementById('ts-section-label').before(box);
  function managed(){return !!BuzzerRounds.paths[currentGame];}
  const oldPhotos=window.onQldPhotosUpdate;
  window.onQldPhotosUpdate=function(){if(managed())render();else if(oldPhotos)oldPhotos();};
  function avatarHtml(name){
    const photo=(window.qldPhotos||{})[name];
    if(photo) return '<img src="'+photo+'" alt="" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1.5px solid var(--border2,#444)">';
    const initial=(String(name||'?').trim()[0]||'?').toUpperCase();
    return '<div style="width:46px;height:46px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;background:rgba(192,96,232,.22);border:1.5px solid var(--purple,#c060e8);color:var(--purple,#c060e8)">'+initial+'</div>';
  }
  function hideTransient(){['bz-record','bz-verdict','bz-early'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('show');});}
  function clear(){
    hideTransient();
    request++;
    if(ref && listener) ref.off('value',listener);
    if(connListener && fbDb) fbDb.ref('.info/connected').off('value',connListener);
    if(bzListener && fbRef){fbRef.off('value',bzListener);bzListener=null;}
    ref=null;listener=null;connListener=null;match=null;player=null;connected=false;bzTeam=null;
    stopNamesListener();stopIndivListener();clearTimeout(selectGameWatchdog);
    hideBzCountdown();hideResult();_bzPhase='waiting';
  }
  function render(){
    const wrap=document.getElementById('team-list-individual');wrap.replaceChildren();
    box.textContent=BuzzerRounds.caption(match);
    document.getElementById('ts-section-label').textContent=match&&match.active?'¿Quién sos?':'El conductor activa el cruce desde el fixture';
    const msg=document.getElementById('connecting-text');
    msg.style.display=connected?'none':'';msg.textContent='Sin conexión. Esperando reconexión…';
    document.getElementById('connecting-dot').style.display='none';
    if(!match || !match.active || !connected) return;
    let lastTeam=null;
    (match.players||[]).forEach(p=>{
      if(match.group && p.side!==lastTeam){
        // Ronda grupal: los nombres se agrupan bajo el título de cada equipo.
        lastTeam=p.side;
        const head=document.createElement('div');
        head.style.cssText='grid-column:1/-1;margin-top:8px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-align:left';
        head.textContent=p.teamLabel;wrap.append(head);
      }
      const button=document.createElement('button');button.className=match.group?'team-btn team-indiv':'team-btn team-'+p.side;
      button.style.cssText='display:flex;flex-direction:column;gap:5px;align-items:center';
      button.insertAdjacentHTML('beforeend',avatarHtml(p.name));
      const n=document.createElement('span');n.textContent=p.name;button.append(n);
      if(match.phase==='f2' && !match.group){
        const team=document.createElement('small');team.style.cssText='font-size:11px;opacity:.65';team.textContent=p.teamLabel;button.append(team);
      }
      button.onclick=()=>choose(p);wrap.append(button);
    });
  }
  function choose(p){
    if(!connected || !BuzzerRounds.allowed(match,p.name,p.side))return;
    player=p.name;
    if(currentGame==='palabras' || currentGame==='erudito'){
      const file=currentGame==='palabras'?'palabras_a_tiempo.html':'el_erudito.html';
      const query=new URLSearchParams({match:match.id,player:p.name});
      location.href=file+'?'+query.toString();return;
    }
    if(match.group){
      // Ronda grupal: bzTeam es el nombre del equipo; el buzzer arma una cola.
      bzTeam=p.side;
      document.getElementById('bz-game-tag').textContent=GAME_META[currentGame].name+' · Ronda '+match.round;
      document.getElementById('bz-team-name').textContent=p.name+' · '+p.teamLabel;
      const gbtn=document.getElementById('bz-buzz-btn');
      gbtn.className='bz-buzz-btn locked team-indiv';
      document.getElementById('bz-status').textContent='Esperando al conductor…';
      document.getElementById('bz-status').className='bz-status';
      hideResult();_resultShownFor=null;hideBzCountdown();
      stopNamesListener();stopIndivListener();
      show('buzz-screen');startBuzzListener();
      return;
    }
    nameA=match.names.a;nameB=match.names.b;
    oldTeam(p.side);
    document.getElementById('bz-game-tag').textContent=GAME_META[currentGame].name+' · Ronda '+match.round;
    document.getElementById('bz-team-name').textContent=p.name+(match.phase==='f2'?' · '+p.teamLabel:'');
  }
  selectGame=function(game){
    clear();box.style.display='';
    if(!BuzzerRounds.paths[game]){box.style.display='none';return oldSelect(game);}
    hideError();currentGame=game;const ticket=request;
    document.getElementById('ts-icon').textContent=GAME_META[game].icon;
    document.getElementById('ts-name').textContent=GAME_META[game].name;
    document.getElementById('team-list-standard').style.display='none';
    document.getElementById('team-list-individual').style.display='grid';
    document.getElementById('edit-names-btn').style.display='none';
    show('team-select-screen');render();
    initFirebase(()=>{
      if(ticket!==request || currentGame!==game)return;
      fbRef=ref=fbDb.ref(BuzzerRounds.paths[game]);
      connListener=fbDb.ref('.info/connected').on('value',snap=>{
        connected=!!snap.val();
        if(!connected && player){
          if(bzListener){ref.off('value',bzListener);bzListener=null;}
          player=null;bzTeam=null;_bzPhase='waiting';hideBzCountdown();hideResult();show('team-select-screen');
        }
        render();
      });
      listener=ref.on('value',snap=>{
        const next=(snap.val()||{}).fixture||null;
        const changed=(match&&match.id)!==(next&&next.id) || !!(match&&match.active)!==!!(next&&next.active) || JSON.stringify(match&&match.players)!==JSON.stringify(next&&next.players);
        match=next;
        if(changed){
          hideTransient();
          if(bzListener){ref.off('value',bzListener);bzListener=null;}
          player=null;bzTeam=null;_bzPhase='waiting';_lastVerdictTs=null;
          hideBzCountdown();hideResult();show('team-select-screen');
        }
        render();
      },()=>{connected=false;match=null;player=null;bzTeam=null;show('team-select-screen');render();box.textContent='No se pudo leer la ronda. Revisá la conexión o los permisos de Firebase.';});
    });
  };
  selectTeam=function(side){if(managed())return;return oldTeam(side);};
  goBack=function(to){
    if(!managed())return oldBack(to);
    if(to==='game'){clear();currentGame=null;box.style.display='none';show('game-select-screen');}
    else{
      if(bzListener && ref){ref.off('value',bzListener);bzListener=null;}
      player=null;bzTeam=null;hideBzCountdown();hideResult();_bzPhase='waiting';show('team-select-screen');render();
    }
  };
  doBuzz=function(){
    if(!managed())return oldBuzz();
    if(!connected || !ref || !player || !BuzzerRounds.allowed(match,player,bzTeam))return;
    if(_bzPhase==='waiting' || _bzPhase==='countdown'){showEarlyWarning();return;}
    if(_bzPhase!=='open')return;
    const id=match.id, who=player, side=bzTeam, ms=_openedAt?Math.max(0,nowServer()-_openedAt):null;
    bzMyName=who;
    ref.transaction(current=>BuzzerRounds.buzz(current,id,who,side,ms),(err,committed)=>{
      if(err){document.getElementById('bz-status').textContent='No se pudo enviar. Revisá tu conexión.';return;}
      if(committed){sfxTin();checkSpeedRecord(ms);if(navigator.vibrate)navigator.vibrate(60);}
    });
  };
})();
