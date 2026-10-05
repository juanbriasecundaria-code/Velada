/* Numeric answers stay unchanged; identity is selected from the active fixture. */
window.connectEruditoRound=function(ref){
  const query=new URLSearchParams(location.search);
  const tx=ref.transaction.bind(ref);
  let match=null, identity=null, selectedId=null, connected=false, linkUsed=false;
  const choices=document.createElement('div');choices.id='er-round-players';
  const title=document.createElement('div');title.id='er-fixture-title';title.style.cssText='text-align:center;font-weight:800;color:var(--accent);line-height:1.6;margin:16px 0';
  const pick=document.querySelector('.team-pick');pick.prepend(title,choices);
  document.getElementById('pick-a').style.display='none';document.getElementById('pick-b').style.display='none';
  document.querySelector('.team-pick-sub').textContent='Elegí tu nombre';
  const oldPick=pickTeam;
  function permitted(cur,id,name,side){return !!(connected&&cur&&cur.fixture&&cur.fixture.id===id&&BuzzerRounds.allowed(cur.fixture,name,side));}
  // All existing writes, including child updates, are checked against the same match.
  ref.transaction=function(fn,cb,local){
    const id=selectedId, name=identity, side=myTeam;
    return tx(cur=>{
      if(!permitted(cur,id,name,side))return;
      const next=fn(cur);
      if(next){next.fixture=cur.fixture;next.teams.a.name=cur.fixture.names.a;next.teams.b.name=cur.fixture.names.b;}
      return next;
    },cb,local===undefined?false:local);
  };
  ref.set=function(value){return ref.transaction(cur=>Object.assign({},value,{fixture:cur.fixture}));};
  ref.child=function(path){
    function write(value,merge){
      return ref.transaction(cur=>{
        const bits=path.split('/');let parent=cur;
        bits.slice(0,-1).forEach(k=>{parent=parent[k]||(parent[k]={});});
        const k=bits[bits.length-1];
        if(merge && Object.prototype.hasOwnProperty.call(value,'answer') && parent[k] && parent[k].ready)return;
        parent[k]=merge?Object.assign({},parent[k],value):value;
        return cur;
      });
    }
    return {set:value=>write(value,false),update:value=>write(value,true)};
  };
  function choose(p){
    if(!connected||!match||!BuzzerRounds.allowed(match,p.name,p.side))return;
    identity=p.name;selectedId=match.id;myTeam=p.side;
    oldPick(p.side);
    updateBanner();
  }
  pickTeam=function(){ /* Side-only selection is intentionally disabled. */ };
  const oldLeave=leaveGame;
  leaveGame=function(e){identity=null;selectedId=null;oldLeave(e);render();};
  function updateBanner(){
    const banner=roundHostBanner(match,'#scoreboard');
    if(identity)banner.textContent+=' · Jugás como '+identity;
    if(!connected)banner.textContent+=' · Reconectando…';
  }
  function render(){
    title.textContent=BuzzerRounds.caption(match);choices.replaceChildren();updateBanner();
    if(!connected){title.textContent+=' · Esperando conexión';return;}
    if(!match||!match.active)return;
    match.players.forEach(p=>{
      const b=document.createElement('button');b.className='team-pick-btn tp-'+p.side;
      b.textContent=p.name+' · '+p.teamLabel;b.onclick=()=>choose(p);choices.append(b);
    });
  }
  function leaveStale(){
    identity=null;selectedId=null;myTeam=null;_prevPhase=null;_vsShown=false;
    document.getElementById('answer-input').value='';
    ['win-overlay','reveal-overlay','correct-overlay','config-overlay','vs-overlay'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('open');});
    showScreen('team');
  }
  fbDb.ref('.info/connected').on('value',snap=>{
    connected=!!snap.val();if(!connected)leaveStale();render();
  });
  window.syncEruditoRound=function(){
    const next=G&&G.fixture||null;
    if((match&&match.id)!==(next&&next.id) || !next || !next.active)leaveStale();
    match=next;render();
    if(!linkUsed&&connected&&match&&match.active){
      linkUsed=true;
      const p=match.players.find(p=>p.name===query.get('player'));
      if(query.get('match')===match.id&&p){
        // Skip splash only for a validated hub selection.
        const splash=document.getElementById('er-splash');if(splash){splash.classList.add('out');splash.style.display='none';}
        choose(p);
      }
    }
  };
  render();
};
