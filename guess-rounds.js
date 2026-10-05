window.connectGuessRound=function(ref){
  window.currentFixtureMatch=attachRoundHost(ref,(m,changed)=>{
    roundHostBanner(m,'#conductor .scoreboard, #conductor > div');
    if(changed){
      clearTimeout(_buzzCountdownTimer);clearTimeout(_bonusAdvanceTimer);_bonusAdvanceTimer=null;stopMovieAuto();_buzzBlocked=null;activeBuzzer=null;phase='idle';revealed=false;
      stopTimer();hideRoundWinnerOverlays();
    }
    if(!m||!m.active){if(typeof gLeave==='function')gLeave();return;}
    if(m.group){gEnter(m,changed);return;}
    if(typeof gLeave==='function')gLeave();
    nameA=m.names.a;nameB=m.names.b;
    let saved;try{saved=localStorage.getItem('guess_fixture_match');}catch(e){}
    if(saved!==m.id){
      scoreA=0;scoreB=0;saveScore();
      try{localStorage.setItem('guess_fixture_match',m.id);}catch(e){}
    }
    _saveNames();syncNamesUI();syncScoreUI();syncPhaseUI();syncRevealUI();
    if(MODE==='conductor')sendState();
  });
};
function hideRoundWinnerOverlays(){
  // Names and fixture change without changing the deck or its order.
  const overlay=document.getElementById('win-overlay');if(overlay)overlay.classList.remove('open');
}
