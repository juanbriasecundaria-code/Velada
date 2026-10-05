/* Palabras remains a physical game: only names/round are synchronized.
   La asignación inicial se guarda en velada/palabras. Al capturar un resultado
   se mantiene ese cruce y su marcador. El conductor activa la ronda siguiente
   desde velada.html cuando decide empezar otra partida.
   Si Firebase no responde o no hay ningún cruce disponible, un botón de
   respaldo deja jugar en modo manual/offline (solo scoreboard local, sin
   escribir a velada/resultados). */
(function(){
  const query=new URLSearchParams(location.search);
  let match=null, connected=false, started=false, enabled=false, manualOffline=false;
  let manualRaw=null, fixtureRaw=null, resultadosRaw=null;
  const disabledByGate=new Map();
  const banner=roundHostBanner(null,'#now-playing');
  const gate=document.createElement('div');gate.id='round-entry';gate.style.cssText='padding:16px;text-align:center';banner.after(gate);

  // ── AUTO-DESCUBRIMIENTO ──────────────────────────────────────────
  // Encuentra el primer cruce pendiente solo para asignar una estación vacía.
  function nextAutoMatch(){
    if(!fixtureRaw) return null;
    const resultados=resultadosRaw||{};
    const candidates=[];
    ['f1','f2'].forEach(phase=>{
      const data=fixtureRaw[phase];
      if(!data||!Array.isArray(data.fixture)) return;
      const ctx={players:data.players,teams:data.teams,fullNames:data.fullNames,games:data.games};
      data.fixture.forEach(m=>{
        const g=m[3], round=m[0], a=m[1], b=m[2];
        if(BuzzerRounds.gameId((ctx.games||[])[g])!=='palabras') return;
        const matchId=phase+'-'+round+'-'+a+'-'+b;
        if(resultados[matchId]) return; // ya tiene resultado cargado
        candidates.push({phase,round,m,ctx,matchId});
      });
    });
    candidates.sort((x,y)=>x.round-y.round || (x.phase===y.phase?0:(x.phase==='f1'?-1:1)));
    for(const c of candidates){
      try{ return BuzzerRounds.buildMatch(c.phase,c.m,c.ctx,'auto-'+c.matchId); }
      catch(e){ /* cruce con nombres inválidos (fixture a medio editar): se salta */ }
    }
    return null;
  }

  // Aplica un cambio de cruce (manual o automático) reseteando el marcador
  // solo cuando el id realmente cambió respecto de la última vez.
  function applyMatchIfNew(m){
    if(!m||!m.active)return;
    let last;try{last=localStorage.getItem('palabras_fixture_match');}catch(e){}
    if(last!==m.id){
      document.querySelectorAll('.cover-overlay,.sheet-overlay,.var-overlay,.names-overlay').forEach(e=>e.classList.remove('open'));
      score={a:0,b:0};varUses={a:3,b:3};comodinUsed={a:false,b:false,shared:false};selectedCat=null;
      roundsLog=[];roundBaseline=null;
      saveScore();saveState();
      try{localStorage.setItem('palabras_fixture_match',m.id);}catch(e){}
    }
    teamNames={a:m.names.a,b:m.names.b};saveTeamNames();syncScoreUI();syncUI();
  }

  // Recalcula el cruce "efectivo" combinando activación manual + auto-descubrimiento.
  function recompute(){
    // The activated match remains on screen after its result is captured.
    // Only a new explicit activation from the fixture changes it.
    match=manualRaw;
    if(match&&match.active&&connected)manualOffline=false; // se sale del modo manual al recibir un cruce real conectado
    window._palabrasCurrentMatch=match;
    applyMatchIfNew(match);
    render();
  }

  function render(){
    roundHostBanner(match,'#now-playing');gate.replaceChildren();
    const valid=match&&match.active;
    const who=valid&&(match.players||[]).find(p=>p.name===query.get('player'));
    const visitor=query.has('match');
    const stale=visitor&&(!valid||query.get('match')!==match.id||!who);
    if(stale){
      gate.textContent='El cruce cambió. Volvé a elegir tu nombre. ';
      const a=document.createElement('a');a.href='index.html?game=palabras';a.textContent='Elegir participante';a.style.color='inherit';gate.append(a);
    }else if(who){gate.textContent='Estás jugando como '+who.name;}
    else if(valid){gate.textContent='Partida individual · '+match.players.map(p=>p.name).join(' vs. ');}
    else if(!visitor){gate.textContent='Buscando el próximo cruce de Palabras a Tiempo…';}
    if(!connected)gate.append(document.createTextNode(' · Sin conexión: esperando sincronización.'));
    if(!visitor && !manualOffline && !(valid&&connected)){
      const b=document.createElement('button');
      b.type='button';b.className='reset-link';
      b.style.cssText='display:inline;margin-left:6px;padding:0;font-size:inherit';
      b.textContent='Jugar sin cruce asignado (manual)';
      b.onclick=function(){manualOffline=true;render();};
      gate.append(b);
    }
    // Old links cannot keep operating the next duel.
    enabled=!!((valid&&!stale&&connected)||(manualOffline&&!visitor));
    const namesButton=document.querySelector('#main-screen .sb-controls button');
    if(namesButton){
      namesButton.disabled=!!(valid&&connected)||stale;
      namesButton.textContent=namesButton.disabled?'🔒 nombres del fixture':'✏️ nombres';
      namesButton.title=namesButton.disabled?'Los nombres vienen del cruce activado. Cambialos desde el fixture del conductor.':'';
    }
    document.querySelectorAll('#main-screen .footer-links button').forEach(b=>{b.disabled=!!stale;});
    // Solo las acciones de partida necesitan un cruce. Los ajustes, el
    // reinicio y el propio acceso al modo manual tienen que seguir activos.
    document.querySelectorAll('#scoreboard button,#reveal-btn,#var-section button').forEach(b=>{
      if(!enabled){if(!disabledByGate.has(b))disabledByGate.set(b,b.disabled);b.disabled=true;}
      else if(disabledByGate.has(b)){b.disabled=disabledByGate.get(b);disabledByGate.delete(b);}
    });
  }
  function start(){
    if(started||!window._palabrasDb)return;started=true;
    _palabrasDb.ref('.info/connected').on('value',snap=>{connected=!!snap.val();render();});
    _palabrasDb.ref(BuzzerRounds.paths.palabras).on('value',snap=>{
      manualRaw=(snap.val()||{}).fixture||null;
      recompute();
    },()=>{connected=false;manualRaw=null;recompute();gate.textContent='No se pudo leer la ronda. Revisá la conexión y los permisos de Firebase.';});
    _palabrasDb.ref('velada/fixture').on('value',snap=>{
      fixtureRaw=snap.val()||null;
      recompute();
    },()=>{fixtureRaw=null;recompute();});
    _palabrasDb.ref('velada/resultados').on('value',snap=>{
      resultadosRaw=snap.val()||null;
      recompute();
    },()=>{resultadosRaw=null;recompute();});
  }
  const oldSave=saveNames;
  saveNames=function(){if(match&&match.active){closeNameEditor();return;}return oldSave();};
  ['addPoint','revealCategory','requestVAR','varVerdict','applyComodinTeam','rerollShared'].forEach(name=>{
    const original=window[name];if(typeof original==='function')window[name]=function(...args){if(enabled)return original.apply(this,args);};
  });
  window.palabrasGateRefresh=render;
  render();window.addEventListener('palabras-db-ready',start);start();
})();
