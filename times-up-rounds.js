/* Time's Up es un juego sin buzzer: solo se sincronizan nombres y ronda.
   Mismo patrón que palabras-rounds.js.
   La asignación inicial se guarda en velada/timesup. Al capturar un resultado
   se mantiene ese cruce y su marcador. El conductor activa la ronda siguiente
   desde velada.html cuando decide empezar otra partida.
   Si Firebase no responde o no hay ningún cruce disponible, un botón de
   respaldo deja jugar en modo manual/offline (solo scoreboard local, sin
   escribir a velada/resultados). */
(function(){
  const query=new URLSearchParams(location.search);
  let match=null, connected=false, started=false, enabled=false, manualOffline=false;
  let manualRaw=null;
  const disabledByGate=new Map();
  const banner=roundHostBanner(null,'#now-playing');
  const gate=document.createElement('div');gate.id='round-entry';gate.style.cssText='padding:16px;text-align:center';banner.after(gate);

  // Aplica un cambio de cruce reseteando el marcador y la partida en curso
  // solo cuando el id realmente cambió respecto de la última vez.
  // Las tarjetas ya usadas se conservan: el mazo es de toda la velada.
  function applyMatchIfNew(m){
    if(!m||!m.active)return;
    let last;try{last=localStorage.getItem('timesup_fixture_match');}catch(e){}
    if(last!==m.id){
      document.querySelectorAll('.cover-overlay,.sheet-overlay,.names-overlay').forEach(e=>e.classList.remove('open'));
      if(typeof window.timesUpMatchReset==='function')window.timesUpMatchReset();
      try{localStorage.setItem('timesup_fixture_match',m.id);}catch(e){}
    }
    teamNames={a:m.names.a,b:m.names.b};saveTeamNames();syncScoreUI();syncUI();
  }

  // El cruce activado queda en pantalla aunque ya se haya capturado su resultado.
  // Solo lo cambia una nueva activación explícita desde el fixture.
  function recompute(){
    match=manualRaw;
    if(match&&match.active&&connected)manualOffline=false; // se sale del modo manual al recibir un cruce real conectado
    window._timesupCurrentMatch=match;
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
      const a=document.createElement('a');a.href='index.html?game=timesup';a.textContent='Elegir participante';a.style.color='inherit';gate.append(a);
    }else if(who){gate.textContent='Estás jugando como '+who.name;}
    else if(valid){gate.textContent='Partida grupal · '+match.players.map(p=>p.name).join(' vs. ');}
    else if(!visitor){gate.textContent='Buscando el próximo cruce de Time\u2019s Up…';}
    if(!connected)gate.append(document.createTextNode(' · Sin conexión: esperando sincronización.'));
    if(!visitor && !manualOffline && !(valid&&connected)){
      const b=document.createElement('button');
      b.type='button';b.className='reset-link';
      b.style.cssText='display:inline;margin-left:6px;padding:0;font-size:inherit';
      b.textContent='Jugar sin cruce asignado (manual)';
      b.onclick=function(){manualOffline=true;render();};
      gate.append(b);
    }
    // Un enlace viejo no puede seguir operando el duelo siguiente.
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
    document.querySelectorAll('#scoreboard button,#tu-start-btn').forEach(b=>{
      if(!enabled){if(!disabledByGate.has(b))disabledByGate.set(b,b.disabled);b.disabled=true;}
      else if(disabledByGate.has(b)){b.disabled=disabledByGate.get(b);disabledByGate.delete(b);}
    });
  }
  function start(){
    if(started||!window._timesupDb)return;started=true;
    _timesupDb.ref('.info/connected').on('value',snap=>{connected=!!snap.val();render();});
    _timesupDb.ref(BuzzerRounds.paths.timesup).on('value',snap=>{
      manualRaw=(snap.val()||{}).fixture||null;
      recompute();
    },()=>{connected=false;manualRaw=null;recompute();gate.textContent='No se pudo leer la ronda. Revisá la conexión y los permisos de Firebase.';});
  }
  const oldSave=saveNames;
  saveNames=function(){if(match&&match.active){closeNameEditor();return;}return oldSave();};
  ['addPoint','tuMainAction'].forEach(name=>{
    const original=window[name];if(typeof original==='function')window[name]=function(...args){if(enabled)return original.apply(this,args);};
  });
  window.timesUpGateRefresh=render;
  render();window.addEventListener('timesup-db-ready',start);start();
})();
