/* Fixture shared by the conductor, hub and game pages. No network writes on load. */
(function(root){
  'use strict';
  const paths = { palabras:'velada/palabras', argentinos:'argentinos/buzzer', movies:'velada/buzzer', erudito:'velada/erudito' };
  function gameId(name){
    const s=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(s.includes('palabras')) return 'palabras';
    if(s.includes('argentinos')) return 'argentinos';
    if(s.includes('erudito')) return 'erudito';
    if(s.includes('guess') || s.includes('movie')) return 'movies';
    return null;
  }
  function members(label, players, fullNames){
    return String(label||'').split('/').map(n=>n.trim()).filter(Boolean).map(full=>
      players.find(p=>p===full || (fullNames[p]||'')===full) || full);
  }
  function buildMatch(phase, match, ctx, id){
    const [round,a,b,g]=match, labels=ctx.teams;
    const game=gameId(ctx.games[g]);
    if(!game || !labels[a] || !labels[b]) throw new Error('Cruce o juego inválido');
    const names={a:labels[a],b:labels[b]}, players=[];
    ['a','b'].forEach(side=>{
      const list=members(names[side],ctx.players,ctx.fullNames||{});
      list.forEach(name=>players.push({name,side,teamLabel:names[side]}));
    });
    if(!players.length || new Set(players.map(p=>p.name)).size!==players.length) throw new Error('Hay nombres repetidos en el cruce. Corregí los equipos antes de activarlo.');
    return {id,phase,round,game,key:round+'-'+a+'-'+b,names,players,active:true};
  }
  // Ronda grupal (Guess Movies & Songs): juegan todos los equipos juntos.
  // En este modo `side` es el nombre del equipo (no 'a'/'b').
  function buildGroup(round, ctx, id, game){
    game=game||'movies';
    const labels=(ctx.teams||[]).filter(Boolean), players=[];
    labels.forEach((label,index)=>{
      members(label,ctx.players,ctx.fullNames||{}).forEach(name=>players.push({name,side:game==='argentinos'?String.fromCharCode(97+index):label,teamLabel:label}));
    });
    if(labels.length<2 || !players.length || new Set(players.map(p=>p.name)).size!==players.length) throw new Error('Hay nombres repetidos o faltan equipos. Corregí los equipos antes de activar la ronda.');
    return {id,phase:'f2',round,game,key:game==='argentinos'?'argentinos-group':'guess-group',group:true,teams:labels,names:{},players,active:true};
  }
  function allowed(match,name,side){
    return !!(match && match.active && Array.isArray(match.players) && match.players.some(p=>p.name===name && p.side===side));
  }
  function buzz(current,matchId,player,side,ms){
    if(!current || !current.fixture || current.fixture.id!==matchId || !allowed(current.fixture,player,side)) return;
    if(current.fixture.group && current.fixture.game==='movies'){
      // Cola de buzzer: cada equipo entra una sola vez, en el orden en que apretó.
      if(current.state!=='open') return;
      const queue=Array.isArray(current.queue)?current.queue.slice():[];
      if(queue.some(q=>q.team===side)) return;
      queue.push({team:side,name:player,ms:(ms==null?null:ms)});
      return Object.assign({},current,{queue});
    }
    if(current.state!=='open' || current.winner || current.blocked===side) return;
    return Object.assign({},current,{state:'won',winner:{team:side,name:player,ms,matchId}});
  }
  function initial(match){
    if(match.game==='palabras') return {fixture:match,names:match.names};
    if(match.game==='erudito') return {fixture:match,phase:'answering',round:1,limit:7,teams:{
      a:{name:match.names.a,answer:null,ready:false,score:0,next:false},
      b:{name:match.names.b,answer:null,ready:false,score:0,next:false}
    },correct:{value:null,lockedBy:null},winner:null};
    return {fixture:match,names:match.names,state:'locked',winner:null,blocked:null};
  }
  function caption(m){
    if(m&&m.active&&m.group) return 'Ronda '+m.round+' · Todos los equipos juntos';
    return m&&m.active ? 'Ronda '+m.round+' · '+m.names.a+' vs. '+m.names.b : 'Esperando que el conductor active una ronda';
  }
  root.BuzzerRounds={paths,gameId,members,buildMatch,buildGroup,allowed,buzz,initial,caption};
})(typeof window==='undefined'?globalThis:window);
