/* ============================================================
   puntos.js — ÚNICA cuenta de puntos de La Velada del Año.
   La usan velada.html (la tabla), tv.html (el Modo TV) y
   participante.html (los celulares). Si cambia una regla de puntaje,
   se cambia ACÁ y nada más.
   ============================================================ */
(function (root) {
  'use strict';

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

  const totalRounds = F2_FIXTURE.reduce((m, x) => Math.max(m, x[0]), 0);
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

  root.Puntos = { jugadores: jugadores, equipos: equipos, version: 1 };
})(typeof window !== 'undefined' ? window : globalThis);
