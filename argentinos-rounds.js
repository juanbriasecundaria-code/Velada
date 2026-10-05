window.connectArgentinosRound=function(ref){
  window.currentFixtureMatch=attachRoundHost(ref,(m,changed)=>{
    roundHostBanner(m,'#scoreboard');
    if(changed){
      clearTimeout(_bzCountdownTimer);_bzOpen=false;_bzState='locked';
      stopRoundTimer();
      if(round)closeRound();
    }
    if(!m||!m.active)return;
    teamNames={a:m.names.a,b:m.names.b};
    let saved;try{saved=localStorage.getItem('argentinos_fixture_match');}catch(e){}
    if(saved!==m.id){
      score={a:0,b:0};saveScore();
      try{localStorage.setItem('argentinos_fixture_match',m.id);}catch(e){}
    }
    _saveTeamNames();syncScoreUI();renderBzToggle();
  });
};
