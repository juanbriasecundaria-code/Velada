/* Reloj local contra el inicio confirmado del servidor; no escribe cada segundo. */
(function(){
  let last={},lastWinnerKey=null,offset=0,connected=false,clock=null,bound=null,advancing=false;
  function now(){return Date.now()+offset;}
  function display(){
    let box=document.getElementById('qld-turn-clock');
    if(!box){box=document.createElement('div');box.id='qld-turn-clock';box.style.cssText='padding:12px 18px;margin:10px auto;border:1px solid var(--border2);border-radius:14px;text-align:center;background:var(--surface2);font:800 20px/1.5 sans-serif;max-width:600px';const anchor=document.querySelector(MODE==='participant'?'#participant':'.cond-body');if(anchor)anchor.prepend(box);else document.body.append(box);}
    if(MODE==='participant'){box.style.position='fixed';box.style.bottom='18px';box.style.left='50%';box.style.transform='translateX(-50%)';box.style.zIndex='120';box.style.pointerEvents='none';}
    const seconds=QldTurns.remaining(last,now()),q=last.queue||[];
    box.style.display=last.fixture?.active && (seconds!==null || last.state==='open' || last.exhausted)?'':'none';
    box.textContent=seconds!==null?last.winner.name+' · '+seconds+' s':last.exhausted?'Nadie acertó · pasá a la siguiente pregunta':q.length?'Esperando al siguiente equipo…':'30 segundos por equipo · esperando el primer buzzeo';
    box.style.color=seconds!==null&&seconds<=5?'var(--danger,#f77)':'var(--text,#fff)';
    if(MODE==='conductor'&&connected&&seconds===0&&!advancing){
      advancing=true;const id=last.fixture.id,turn=last.turn;
      fbBuzzerRef.transaction(cur=>QldTurns.advance(cur,id,turn,now(),firebase.database.ServerValue.TIMESTAMP),undefined,false)
        .catch(e=>toast('No se pudo cambiar de turno: '+e.message)).finally(()=>{advancing=false;});
    }
  }
  function bind(){
    if(!fbBuzzerRef || bound===fbBuzzerRef)return;bound=fbBuzzerRef;
    fbDb.ref('.info/serverTimeOffset').on('value',s=>{offset=Number(s.val()||0);});
    fbDb.ref('.info/connected').on('value',s=>{connected=!!s.val();});
    fbBuzzerRef.on('value',s=>{last=s.val()||{};display();});
    if(!clock)clock=setInterval(display,150);
  }
  const oldInit=initFirebase;
  initFirebase=function(){const result=oldInit();bind();return result;};
  fbOpenBuzzer=async function(){
    if(!fbBuzzerRef){initFirebase();if(!fbBuzzerRef)return;}
    clearTimeout(_buzzCountdownTimer);
    const id=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),players=[];
    teams.forEach(t=>(t.members||[]).forEach(name=>players.push({name,side:String(t.index),teamLabel:t.label})));
    if(new Set(players.map(p=>p.name)).size!==players.length){toast('Hay nombres repetidos entre los equipos. Corregí el roster antes de abrir el buzzer');return;}
    if(!players.length){toast('Cargá los equipos antes de abrir el buzzer');return;}
    const fixture={id,active:true,group:true,game:'qld',teams:teams.map(t=>String(t.index)),players};
    try{
      await fbBuzzerRef.set({fixture,state:'countdown',queue:[],turn:0,winner:null,turnStartedAt:null,turnMs:30000,countdownStart:firebase.database.ServerValue.TIMESTAMP,countdownMs:BUZZ_COUNTDOWN_MS});
      _buzzCountdownTimer=setTimeout(()=>fbBuzzerRef.transaction(cur=>{
        if(cur?.fixture?.id!==id||cur.state!=='countdown')return;
        return Object.assign({},cur,{state:'open'});
      },undefined,false).catch(e=>toast('No se pudo abrir el buzzer: '+e.message)),BUZZ_COUNTDOWN_MS);
    }catch(e){toast('No se pudo iniciar el buzzer: '+e.message);}
  };
  fbLockBuzzer=function(){clearTimeout(_buzzCountdownTimer);lastWinnerKey=null;if(!fbBuzzerRef)return;fbBuzzerRef.set({state:'locked',winner:null,queue:[],turn:0}).catch(e=>toast(e.message));buzzerWinner=null;};
  applyBuzzerState=function(d){
    last=d||{};buzzerState=last.state||'locked';buzzerWinner=last.winner||null;
    const key=buzzerWinner?last.fixture?.id+'/'+last.turn+'/'+buzzerWinner.name:null;
    if(MODE==='conductor' && key!==lastWinnerKey){closeAssign();_winnerName=null;_winnerTeamIdx=null;_lastPhotoPopName=null;lastWinnerKey=key;if(buzzerWinner){sfxBuzz();openAssignWithWinner(buzzerWinner.name);}}
    renderBuzzerBanner();if(buzzerWinner){const button=document.getElementById('buzzer-btn');if(button)button.textContent='🔒 Cerrar buzzer';}display();
  };
  const oldAssign=doAssign;
  doAssign=function(teamIdx){
    if(last.winner){
      if(QldTurns.remaining(last,now())===0){display();toast('Terminó el tiempo de ese turno');return;}
      if(String(teamIdx)!==last.winner.team){toast('Ahora responde '+last.winner.name);return;}
    }
    return oldAssign(teamIdx);
  };
  bind();
})();
