/* Cola confirmada por RTDB. Un turno y un reloj compartidos por equipo. */
(function(root){
  const duration=30000;
  function buzz(current,id,name,ms,stamp){
    if(!current?.fixture?.active||current.fixture.id!==id||current.state!=='open')return;
    const player=(current.fixture.players||[]).find(p=>p.name===name);if(!player)return;
    const queue=Array.isArray(current.queue)?current.queue.slice():[];
    if(queue.some(q=>q.team===player.side))return;
    queue.push({name,team:player.side,ms:ms??null});
    const turn=Number.isInteger(current.turn)?current.turn:0;
    const next=Object.assign({},current,{queue});
    if(!current.winner && queue[turn]){next.winner=queue[turn];next.turnStartedAt=stamp;next.turnMs=duration;}
    return next;
  }
  function remaining(d,now){return d?.winner && Number.isFinite(d.turnStartedAt)?Math.max(0,Math.ceil(((d.turnStartedAt+(d.turnMs||duration))-now)/1000)):null;}
  function advance(current,id,turn,now,stamp){
    if(!current?.fixture?.active||current.fixture.id!==id||current.state!=='open'||current.turn!==turn||remaining(current,now)!==0)return;
    const queue=current.queue||[],nextTurn=turn+1,winner=queue[nextTurn]||null;
    const exhausted=!winner&&queue.length>=(current.fixture.teams||[]).length;
    return Object.assign({},current,{turn:nextTurn,winner,turnStartedAt:winner?stamp:null,state:exhausted?'locked':'open',exhausted,verdict:{name:current.winner.name,team:current.winner.team,ok:false,pts:0,ts:stamp}});
  }
  root.QldTurns={buzz,remaining,advance,duration};
})(typeof window==='undefined'?globalThis:window);
