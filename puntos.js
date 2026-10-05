/* ============================================================
   puntos.js — ÚNICA cuenta de puntos de La Velada del Año.
   La usan velada.html (la tabla), tv.html (el Modo TV) y
   participante.html (los celulares). Si cambia una regla de puntaje,
   se cambia ACÁ y nada más.
   ============================================================ */
(function (root) {
  'use strict';

  root.InterfaceCopy = {
    clean: function(value){
      if(typeof value==='string')return value.replace(/\bfase[ ]+2\b(?:[ ]*[·—-][ ]*(?:Equipos|Grupal))?/gi,'Fase grupal').replace(/\bfase[ ]+1\b(?:[ ]*[·—-][ ]*(?:Individual|Clasificación individual))?/gi,'Impostor').replace(/fase individual/gi,'Impostor');
      if(Array.isArray(value))return value.map(v=>this.clean(v));
      if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,this.clean(v)]));
      return value;
    }
  };
  root.RoundPlan = {
    ids: function(fixture,games) {
      const ids=Array.from(new Set((fixture||[]).map(m=>'duel:'+m[0]))).sort((a,b)=>Number(a.slice(5))-Number(b.slice(5)));
      if((games||[]).includes('Guess Movie/Song'))ids.push('guess');
      if((games||[]).includes('100 Argentinos Dicen'))ids.push('argentinos');
      return ids.concat(['impostor','qld']);
    },
    order: function(state,fixture,games) {
      const ids=this.ids(fixture,games), saved=Array.isArray(state.roundOrder)?state.roundOrder:[];
      return saved.filter((id,i)=>ids.includes(id)&&saved.indexOf(id)===i).concat(ids.filter(id=>!saved.includes(id)));
    }
  };

  function prep(ctx) {
    const st = Object.assign({ f1: {}, f2: {}, impostor: { rounds: [] } }, ctx.state || {});
    if (!st.f1) st.f1 = {};
    if (!st.f2) st.f2 = {};
    let rules = ctx.rules || null;
    if (rules) rules = Object.assign({ f1: [], f2: [] }, rules);
    return { st, rules };
  }

  function indiceEquipoDefault(fullNames, TEAMS) {
    return function (playerName) {
      const full = (fullNames && fullNames[playerName]) || playerName;
      return TEAMS.findIndex(t => String(t).includes(full));
    };
  }

  // Ranking INDIVIDUAL del Impostor (aparte de la fase grupal; solo vale ahí).
  // ctx: { state, players, rules }
  function jugadores(ctx) {
    const { st: state, rules: RULES_CONFIG } = prep(ctx);
    const PLAYERS = ctx.players || [];
    const pts = PLAYERS.map(() => ({ rounds: [], special: 0, total: 0 }));
    const impRounds = (state.impostor && state.impostor.rounds) || [];
    const impNoPts = (RULES_CONFIG && RULES_CONFIG.impostor) ? RULES_CONFIG.impostor.pts_noDescubierto : 4;
    const impDesPts = (RULES_CONFIG && RULES_CONFIG.impostor) ? RULES_CONFIG.impostor.pts_descubierto : 2;
    const add = (name, v) => { const i = PLAYERS.indexOf(name); if (i !== -1) pts[i].special += v; };
    impRounds.forEach(rd => {
      if (rd.mode === 'doble') {
        const impostorNames = rd.impostorNames || [];
        const caughtNames = rd.caughtNames || [];
        const escapedNames = rd.escapedNames || impostorNames.filter(n => !caughtNames.includes(n));
        const crewPts = Math.round(impDesPts * caughtNames.length / (impostorNames.length || 1));
        escapedNames.forEach(n => add(n, impNoPts));
        if (crewPts > 0) (rd.players || []).forEach(n => { if (!impostorNames.includes(n)) add(n, crewPts); });
      } else if (rd.mode === 'noDescubierto') {
        add(rd.impostorName, impNoPts);
      } else {
        (rd.players || []).forEach(n => { if (n !== rd.impostorName) add(n, impDesPts); });
      }
    });
    const ov = state.specialOverride || {};
    PLAYERS.forEach((n, i) => { if (Object.prototype.hasOwnProperty.call(ov, i)) pts[i].special = ov[i]; });
    pts.forEach(p => { p.total = p.special; });
    return pts;
  }

  // ctx: { state, players, teams, f2Fixture, f2Byes, rules, qldTeamPoints, fullNames, teamIndexForPlayer }
  function equipos(ctx) {
    const { st: state, rules: RULES_CONFIG } = prep(ctx);
    const PLAYERS = ctx.players || [];
    const TEAMS = ctx.teams || [];
    const F2_FIXTURE = ctx.f2Fixture || [];
    const F2_BYES = ctx.f2Byes || {};
    const QLD_POINTS = ctx.qldTeamPoints || state.qldTeamPoints || {};
    const teamIndexForPlayer = ctx.teamIndexForPlayer || indiceEquipoDefault(ctx.fullNames, TEAMS);

  // Ronda extra de 100 Argentinos Dicen (todos juntos): una columna más al final.
  const argRound = state.argentinosRound || null;
  const totalRounds = F2_FIXTURE.reduce((m, x) => Math.max(m, x[0]), 0) + (argRound ? 1 : 0);
  const pts = TEAMS.map(() => ({ rounds: Array(totalRounds).fill(null), total: 0, qld: 0 }));

  for (let r = 1; r <= totalRounds; r++) {
    const byeArr = F2_BYES[r];
    if (Array.isArray(byeArr)) {
      byeArr.forEach(idx => { if (pts[idx]) pts[idx].rounds[r-1] = 'bye'; });
    } else if (typeof byeArr === 'number' && pts[byeArr]) {
      pts[byeArr].rounds[r-1] = 'bye';
    }
  }

  F2_FIXTURE.forEach(([r, a, b, g]) => {
    const key = `${r}-${a}-${b}`;
    const res = state.f2[key];
    if (!res) return;
    const ri = r - 1;
    if (res.winner === 'empate') {
      const drawPts = (RULES_CONFIG && g !== undefined && RULES_CONFIG.f2[g]) ? RULES_CONFIG.f2[g].pts_draw : 1;
      pts[a].rounds[ri] = drawPts;
      pts[b].rounds[ri] = drawPts;
    } else {
      const w = res.winner;
      const l = w === a ? b : a;
      const gCfg = (RULES_CONFIG && g !== undefined && RULES_CONFIG.f2[g]) ? RULES_CONFIG.f2[g] : null;
      const winPts = gCfg ? gCfg.pts_win : 3;
      const bonusPts = gCfg ? gCfg.pts_bonus : 1;
      const losePts = gCfg ? gCfg.pts_lose : 0;
      let wp = winPts + (res.bonus ? bonusPts : 0);
      pts[w].rounds[ri] = wp;
      pts[l].rounds[ri] = losePts;
    }
  });

  if (argRound && argRound.byTeam) {
    TEAMS.forEach((name, idx) => {
      if (typeof argRound.byTeam[name] === 'number') pts[idx].rounds[totalRounds - 1] = argRound.byTeam[name];
    });
  }

  // Puntos de "¿Quién lo dijo?" — ya vienen resueltos por equipo (1°=3, 2°=2, 3°=1) desde Firebase,
  // una vez que el conductor finaliza la ronda especial. Se puede pisar a mano por equipo
  // (state.qldOverride) — por ejemplo si el resultado no llegó bien sincronizado.
  const qldTeamPoints = QLD_POINTS;
  const qldOverride = state.qldOverride || {};
  pts.forEach((p, idx) => {
    p.qld = Object.prototype.hasOwnProperty.call(qldOverride, idx)
      ? (Number(qldOverride[idx]) || 0)
      : (qldTeamPoints[idx] || 0);
  });

  // Apuestas de Fase 2: cada jugador (invitado) apuesta a los duelos de equipos.
  // Cada acierto suma 1 punto al EQUIPO del apostador (en Fase 2 se puntúa por equipo).
  // Igual que en Fase 1: se puede apostar al propio equipo, pero si lo perdés se te
  // anulan todos los puntos que hayas ganado apostando.
  const betsF2 = state.betsF2 || {};
  PLAYERS.forEach(name => {
    const tIdx = teamIndexForPlayer(name);
    if (tIdx < 0 || !pts[tIdx]) return;
    let won = 0, blown = false;
    Object.keys(betsF2).forEach(key => {
      const res = state.f2[key];
      if (!res || res.winner === 'empate') return;
      const b = betsF2[key] && betsF2[key][name];
      if (typeof b !== 'number') return;
      const parts = key.split('-').map(Number);
      const isOwn = (parts[1] === tIdx || parts[2] === tIdx);
      if (b === res.winner) won++;
      else if (isOwn) blown = true;
    });
    const net = blown ? 0 : won;
    if (net) pts[tIdx].betsF2 = (pts[tIdx].betsF2 || 0) + net;
  });

  // Override manual de apuestas de Fase 2: pisa el valor calculado por equipo
  const betsOverrideF2 = state.betsOverrideF2 || {};
  TEAMS.forEach((name, idx) => {
    if (Object.prototype.hasOwnProperty.call(betsOverrideF2, name)) {
      pts[idx].betsF2 = Number(betsOverrideF2[name]) || 0;
    }
  });

  // Comodines de la ruleta (solo los ya resueltos suman/restan)
  const comosF2 = state.comodinesF2 || [];
  TEAMS.forEach((name, idx) => {
    let d = 0;
    comosF2.forEach(c => { if (c.status === 'done' && c.player === name) d += (c.delta || 0); });
    if (d) pts[idx].comodin = d;
  });

  // Overrides de celda: pisan el valor calculado de esa ronda
  const ovF2 = (state.cellPts && state.cellPts.f2) || {};
  TEAMS.forEach((name, idx) => {
    pts[idx].rounds.forEach((v, ri) => {
      const k = name + '||' + ri;
      if (Object.prototype.hasOwnProperty.call(ovF2, k)) pts[idx].rounds[ri] = Number(ovF2[k]) || 0;
    });
  });

  // Ajustes manuales cargados a mano durante la noche
  const adjF2 = (state.adjust && state.adjust.f2) || [];
  TEAMS.forEach((name, idx) => {
    let d = 0;
    adjF2.forEach(a => { if (a.name === name) d += (Number(a.pts) || 0); });
    if (d) pts[idx].adjust = d;
  });

  pts.forEach(p => {
    p.total = p.rounds.reduce((s,v) => s + (typeof v === 'number' ? v : 0), 0) + (p.qld || 0) + (p.betsF2 || 0) + (p.comodin || 0) + (p.adjust || 0);
  });

  const games = RULES_CONFIG ? RULES_CONFIG.f2.map(g=>g.name) : (ctx.games || ['Guess Movie/Song','100 Argentinos Dicen']);
  const order = root.RoundPlan.order(state,F2_FIXTURE,games);
  pts.forEach((p,idx)=>{
    const raw=p.rounds.slice();
    p.roundKeys=order.slice();
    p.rounds=order.map(id=>{
      if(id.startsWith('duel:'))return raw[Number(id.slice(5))-1] ?? null;
      if(id==='impostor')return null;
      if(id==='qld')return p.qld || (Object.keys(QLD_POINTS).length ? 0 : null);
      const byTeam=(state[id+'Round']||{}).byTeam||{};
      return Number.isFinite(byTeam[TEAMS[idx]])?byTeam[TEAMS[idx]]:null;
    });
    const commonOv=state.commonCellPts||{};
    order.forEach((id,i)=>{const key=TEAMS[idx]+'||'+id;if(Object.prototype.hasOwnProperty.call(commonOv,key))p.rounds[i]=Number(commonOv[key])||0;});
    p.total=p.rounds.reduce((sum,v)=>sum+(typeof v==='number'?v:0),0)+(p.betsF2||0)+(p.comodin||0)+(p.adjust||0);
  });

  // Victorias / derrotas (las usa el TV para los íconos 🔥 / 🤡)
  F2_FIXTURE.forEach(([r, a, b]) => {
    const res = state.f2[r + '-' + a + '-' + b];
    if (!res || res.winner === 'empate') return;
    const w = res.winner, l = (w === a ? b : a);
    if (pts[w]) pts[w].wins = (pts[w].wins || 0) + 1;
    if (pts[l]) pts[l].losses = (pts[l].losses || 0) + 1;
  });
  return pts;
  }

  root.Puntos = { jugadores: jugadores, equipos: equipos, version: 2 };
})(typeof window !== 'undefined' ? window : globalThis);
