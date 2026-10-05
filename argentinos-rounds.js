window.connectArgentinosRound=function(ref){
  window.currentFixtureMatch=attachRoundHost(ref,(m,changed)=>{
    roundHostBanner(m,'#scoreboard');
    if(changed){
      clearTimeout(_bzCountdownTimer);_bzOpen=false;_bzState='locked';
      stopRoundTimer();
      if(round)closeRound();
    }
    if(!m||!m.active)return;
    if(m.group){
      if(changed && MODE==='conductor'){
        if(!gm || gm.fixtureId!==m.id){
          const origs=(m.teams||[]).map(label=>({label,members:m.players.filter(p=>p.teamLabel===label).map(p=>p.name),size:m.players.filter(p=>p.teamLabel===label).length}));
          const proposal=gmPropose(origs.map(o=>o.size),3);
          if(proposal){
            gm={active:true,fixtureId:m.id,maxTeams:3,origs,teams:Array.from({length:proposal.k},(_,t)=>({name:'Equipo '+(t+1),origs:origs.map((_,i)=>i).filter(i=>proposal.assign[i]===t),size:proposal.totals[t]})),scores:Array(proposal.k).fill(0),plays:Array(proposal.k).fill(0),last:null,cur:null,finished:false,result:null};
          }
        }
        if(gm)gmApplyTeams(gm.teams.map((_,i)=>i));
      }
      return;
    }
    teamNames={a:m.names.a,b:m.names.b};
    let saved;try{saved=localStorage.getItem('argentinos_fixture_match');}catch(e){}
    if(saved!==m.id){
      score={a:0,b:0};saveScore();
      try{localStorage.setItem('argentinos_fixture_match',m.id);}catch(e){}
    }
    _saveTeamNames();syncScoreUI();renderBzToggle();
  });
};

window.publishArgentinosGroupFixture=function(){
  const m=window.currentFixtureMatch?.();
  if(!m?.active||!m.group||!gm||!gm.cur||!fbRef)return;
  const players=[],names={};
  Object.entries(gm.cur).forEach(([side,ti])=>{
    const team=gm.teams[ti];names[side]=team.name;
    team.origs.forEach(oi=>gm.origs[oi].members.forEach(name=>players.push({name,side,teamLabel:team.name})));
  });
  const next=Object.assign({},m,{players,names});
  fbRef.transaction(cur=>{
    if(!cur||cur.fixture?.id!==m.id)return;
    return Object.assign({},cur,{fixture:next,names,state:'locked',winner:null,queue:[],turn:0});
  },undefined,false).catch(e=>showToast('No se pudo publicar participantes: '+e.message));
};
