/* Fases adicionales (Etapa B). Cada fase nueva tiene su pestaña, juegos, fixture, ranking y config de clasificación.
   Datos: state.phases[i] (id, nombre, tipo, emoji, games, fixture, clasifican) y state[id] = { "r-a-b": {winner: idx|'empate'} }. */
(function (root) {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var key = function (m) { return m[0] + '-' + m[1] + '-' + m[2]; };

  function extras() { return getPhases().filter(function (p) { return p.id !== 'f1' && p.id !== 'f2'; }); }
  function roster(p) { return (p.tipo === 'individual' ? PLAYERS : TEAMS) || []; }
  function gameList() { return GAMES_F2.slice(); }
  function hasResults(p) { return Object.keys(phaseResults(p.id)).length > 0; }
  function nextId() { var n = 3; while (phaseById('f' + n)) n++; return 'f' + n; }

  // Fixture: método del círculo (todos contra todos por rondas); el juego de cada cruce rota entre los elegidos.
  function buildFixture(n, games) {
    var G = games.length, out = [];
    if (n < 2 || !G) return out;
    var ids = []; for (var i = 0; i < n; i++) ids.push(i);
    if (n % 2) ids.push(-1);
    var m = ids.length, rounds = Math.min(m - 1, Math.max(G, 1)), c = 0;
    for (var r = 1; r <= rounds; r++) {
      for (var k = 0; k < m / 2; k++) {
        var a = ids[k], b = ids[m - 1 - k];
        if (a < 0 || b < 0) continue;
        out.push([r, Math.min(a, b), Math.max(a, b), (r - 1 + k) % G]);
        c++;
      }
      ids.splice(1, 0, ids.pop());
    }
    return out;
  }

  function ranking(p) { return FasesView.rank(p, state, PLAYERS, TEAMS); }

  function pageHtml(p) {
    var names = roster(p), games = (p.games || []), res = phaseResults(p.id), locked = hasResults(p);
    var h = '<div class="section-header"><span class="section-title">' + esc(p.emoji) + ' ' + esc(p.nombre) + ' <span style="font-size:12px;color:var(--muted);font-weight:500">· ' + (p.tipo === 'individual' ? 'individual' : 'grupal') + '</span></span></div>';
    h += '<div class="card" style="padding:0.9rem;margin-bottom:1rem"><div style="font-weight:700;margin-bottom:0.5rem">Juegos de la fase' + (locked ? ' 🔒' : '') + '</div><div style="display:flex;flex-wrap:wrap;gap:0.4rem">';
    gameList().forEach(function (g) {
      var on = games.indexOf(g) >= 0;
      h += '<label style="padding:0.3rem 0.6rem;border:1px solid var(--border2);border-radius:99px;font-size:12px;cursor:' + (locked ? 'default' : 'pointer') + ';' + (on ? 'background:var(--accent-dim);' : 'opacity:.6;') + '"><input type="checkbox" ' + (on ? 'checked ' : '') + (locked ? 'disabled ' : '') + 'onchange="FasesExtra.toggleGame(\'' + p.id + '\',' + JSON.stringify(g).replace(/"/g, '&quot;') + ')" style="margin-right:4px">' + esc(g) + '</label>';
    });
    h += '</div><div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;align-items:center"><select id="fx-copy-' + p.id + '" class="rule-edit-input" ' + (locked ? 'disabled' : '') + '><option value="">Copiar juegos de…</option><option value="f2">Fase grupal</option>' +
      extras().filter(function (q) { return q.id !== p.id; }).map(function (q) { return '<option value="' + q.id + '">' + esc(q.nombre) + '</option>'; }).join('') +
      '</select><button class="btn" ' + (locked ? 'disabled' : '') + ' onclick="FasesExtra.copyGames(\'' + p.id + '\')">Copiar</button>' +
      '<select class="rule-edit-input" onchange="FasesExtra.setModo(\'' + p.id + '\',this.value)" title="Tipo de fixture"><option value="cobertura"' + (p.modo !== 'todos' ? ' selected' : '') + '>Cada uno juega todos los juegos (con descansos)</option><option value="todos"' + (p.modo === 'todos' ? ' selected' : '') + '>Todos contra todos</option></select>' + '<button class="btn btn-primary" onclick="FasesExtra.generate(\'' + p.id + '\')">' + ((p.fixture || []).length ? 'Regenerar fixture' : 'Generar fixture') + '</button></div></div>';
    // Clasificación a la Final
    h += '<div class="card" style="padding:0.9rem;margin-bottom:1rem"><div style="font-weight:700;margin-bottom:0.5rem">Clasifican a la Final</div><div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;font-size:13px"><label>Cantidad <input type="number" min="0" max="' + names.length + '" value="' + p.clasifican.cantidad + '" style="width:4rem" onchange="FasesExtra.setQual(\'' + p.id + '\',\'cantidad\',this.value)"></label>' +
      (p.tipo === 'individual' ? '<label>Se agrupan de a <input type="number" min="1" max="6" value="' + p.clasifican.tamanoGrupo + '" style="width:3.5rem" onchange="FasesExtra.setQual(\'' + p.id + '\',\'tamanoGrupo\',this.value)"></label>' : '') +
      '</div><div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;font-size:13px;margin-top:0.6rem"><b>Puntos</b><label>Victoria <input type="number" min="0" max="20" value="' + FasesView.pts(p).win + '" style="width:3.5rem" onchange="FasesExtra.setPts(\'' + p.id + '\',\'win\',this.value)"></label><label>Empate <input type="number" min="0" max="20" value="' + FasesView.pts(p).draw + '" style="width:3.5rem" onchange="FasesExtra.setPts(\'' + p.id + '\',\'draw\',this.value)"></label></div></div>';
    // Ranking
    var rk = ranking(p), q = +p.clasifican.cantidad || 0;
    h += '<div class="section-header"><span class="section-title">Clasificación</span></div><div class="card" style="padding:0;overflow-x:auto"><table class="ranking"><thead><tr><th>#</th><th>' + (p.tipo === 'individual' ? 'Jugador' : 'Equipo') + '</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>Pts</th></tr></thead><tbody>' +
      rk.map(function (r, k) { return '<tr' + (k < q ? ' class="classifica"' : '') + '><td>' + (k < 3 ? ['🥇', '🥈', '🥉'][k] : k + 1) + '</td><td>' + esc(r.n) + '</td><td>' + r.pj + '</td><td>' + r.g + '</td><td>' + r.e + '</td><td>' + r.p + '</td><td><b>' + r.pts + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
    // Fixture
    h += '<div class="section-header" style="margin-top:1.25rem"><span class="section-title">Fixture</span></div>';
    if (!(p.fixture || []).length) h += '<div class="card" style="padding:0.9rem;font-size:13px;color:var(--muted)">Elegí los juegos y tocá “Generar fixture”.</div>';
    var byRound = {};
    (p.fixture || []).forEach(function (m) { (byRound[m[0]] = byRound[m[0]] || []).push(m); });
    Object.keys(byRound).forEach(function (r) {
      h += '<div class="card" style="padding:0.75rem;margin-bottom:0.6rem"><div style="font-weight:700;margin-bottom:0.4rem">Ronda ' + r + '</div>';
      byRound[r].forEach(function (m) {
        var cur = res[key(m)], A = esc(names[m[1]]), B = esc(names[m[2]]), id = p.id, k = key(m);
        var btn = function (w, label) { return '<button class="btn" style="' + (cur && cur.winner === w ? 'background:var(--accent-dim);font-weight:700' : '') + '" onclick="FasesExtra.setResult(\'' + id + '\',\'' + k + '\',' + (w === 'empate' ? "'empate'" : w) + ')">' + label + '</button>'; };
        h += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;padding:0.3rem 0;border-top:1px solid var(--border2)"><span style="flex:1 1 12rem;font-size:13px"><b>' + A + '</b> vs <b>' + B + '</b> · ' + esc(games[m[3]] || '?') + '</span>' + btn(m[1], 'Gana ' + A) + btn('empate', 'Empate') + btn(m[2], 'Gana ' + B) +
          (cur ? '<button class="btn" title="Borrar resultado" onclick="FasesExtra.setResult(\'' + id + '\',\'' + k + '\',null)">✕</button>' : '') + '</div>';
      });
      h += '</div>';
    });
    // Ajustes manuales de puntos
    var adj = phaseAdjust(p.id);
    h += '<div class="section-header" style="margin-top:1.25rem"><span class="section-title">Ajustes manuales de puntos</span></div><div class="card" style="padding:0.75rem"><div style="display:flex;gap:0.4rem;flex-wrap:wrap"><select id="fx-adj-n-' + p.id + '" class="rule-edit-input">' + names.map(function (n, i) { return '<option value="' + i + '">' + esc(n) + '</option>'; }).join('') + '</select><input id="fx-adj-p-' + p.id + '" type="number" value="1" style="width:4rem"><input id="fx-adj-l-' + p.id + '" class="rule-edit-input" placeholder="Motivo (opcional)"><button class="btn" onclick="FasesExtra.addAdjust(\'' + p.id + '\')">Agregar</button></div>' +
      adj.map(function (a) { return '<div style="display:flex;gap:0.5rem;align-items:center;font-size:13px;padding:0.25rem 0"><span style="flex:1">' + esc(a.name) + ' · <b>' + (a.pts > 0 ? '+' : '') + a.pts + '</b>' + (a.label ? ' · ' + esc(a.label) : '') + '</span><button class="btn" onclick="FasesExtra.removeAdjust(\'' + p.id + '\',' + a.id + ')">✕</button></div>'; }).join('') + '</div>';
    h += '<div style="margin-top:1.25rem;display:flex;gap:0.5rem;flex-wrap:wrap"><button class="btn" onclick="FasesExtra.rename(\'' + p.id + '\')">Renombrar</button><button class="btn" style="color:var(--danger,#ff5f5f)" onclick="FasesExtra.remove(\'' + p.id + '\')">Eliminar fase</button></div>';
    return h;
  }

  function newHtml() {
    return '<div class="section-header"><span class="section-title">＋ Nueva fase</span></div><div class="card" style="padding:1rem;display:grid;gap:0.75rem;max-width:30rem">' +
      '<label>Nombre <input id="fx-new-name" class="rule-edit-input" placeholder="Ej.: Duelos relámpago" style="width:100%"></label>' +
      '<label>Tipo <select id="fx-new-tipo" class="rule-edit-input"><option value="grupal">Grupal (equipos)</option><option value="individual">Individual (jugadores)</option></select></label>' +
      '<label>Copiar juegos de <select id="fx-new-copy" class="rule-edit-input"><option value="">Ninguna (elijo yo)</option><option value="f2">Fase grupal</option>' + extras().map(function (q) { return '<option value="' + q.id + '">' + esc(q.nombre) + '</option>'; }).join('') + '</select></label>' +
      '<button class="btn btn-primary" onclick="FasesExtra.create()">Crear fase</button></div>';
  }

  function gamesOf(srcId) {
    if (srcId === 'f2') return gameList();
    var q = phaseById(srcId); return q && q.games ? q.games.slice() : [];
  }
  function commit(msg) { saveState(); render(); if (msg) showToast('✅', msg); }

  function ensureDom() {
    var nav = document.querySelector('.nav-tabs'), final = document.getElementById('page-final'); if (!nav || !final) return;
    nav.querySelectorAll('[data-fx]').forEach(function (e) { e.remove(); });
    document.querySelectorAll('.page[data-fx]').forEach(function (e) { e.remove(); });
    var anchor = document.querySelector('.nav-tab[data-tab="fase2"]'), after = anchor;
    var mk = function (tab, label) {
      var t = document.createElement('div'); t.className = 'nav-tab'; t.setAttribute('data-tab', tab); t.setAttribute('data-fx', '1'); t.textContent = label;
      t.onclick = function () { goTab(tab); }; after.parentNode.insertBefore(t, after.nextSibling); after = t;
      var pg = document.createElement('div'); pg.className = 'page'; pg.id = 'page-' + tab; pg.setAttribute('data-fx', '1'); final.parentNode.insertBefore(pg, final);
    };
    extras().forEach(function (p) { mk('fx-' + p.id, p.emoji + ' ' + p.nombre); });
    mk('fx-nueva', '＋ Fase');
  }
  function render() {
    extras().forEach(function (p) { var el = document.getElementById('page-fx-' + p.id); if (el) el.innerHTML = pageHtml(p); });
    var n = document.getElementById('page-fx-nueva'); if (n) n.innerHTML = newHtml();
  }

  // ── Final: clasificados de todas las fases, intercalados por puesto (1° de cada una, 2° de cada una…) ──
  function finalSeeds(rankF2) {
    var activas = extras().filter(function (p) { return (+p.clasifican.cantidad || 0) > 0 && (p.fixture || []).length; });
    if (!activas.length) return null;
    var f2 = phaseById('f2'), q2 = (+f2.clasifican.cantidad > 0) ? +f2.clasifican.cantidad : bracketQDefault(TEAMS.length);
    var listas = [(rankF2 || []).slice(0, q2).map(function (x) { return x.n; })];
    activas.forEach(function (p) {
      var top = ranking(p).slice(0, +p.clasifican.cantidad).map(function (r) { return r.n; });
      if (p.tipo === 'individual') {
        var t = Math.max(1, +p.clasifican.tamanoGrupo || 1), eq = [];
        for (var i = 0; i < top.length; i += t) eq.push(top.slice(i, i + t).join(' / '));
        top = eq;
      }
      listas.push(top);
    });
    var out = [], visto = {}, max = Math.max.apply(null, listas.map(function (l) { return l.length; }));
    for (var k = 0; k < max; k++) listas.forEach(function (l) { if (l[k] && !visto[l[k]]) { visto[l[k]] = 1; out.push(l[k]); } });
    return out;
  }
  function allDone() {
    return extras().every(function (p) {
      if (!((+p.clasifican.cantidad || 0) > 0)) return true;
      var res = phaseResults(p.id); return (p.fixture || []).length > 0 && p.fixture.every(function (m) { return res[key(m)]; });
    });
  }
  function seedsHtml() {
    var ctx = bracketCtx(), b = ctx.b, frozen = Object.keys(b.winners || {}).length > 0, n = ctx.seeds.length;
    if (!finalSeeds(ctx.ranking) && !b.seeds) return '';
    var h = '<div class="card" style="padding:0.9rem;margin-bottom:1rem"><div style="font-weight:700;margin-bottom:0.5rem">Cabezas de serie de la Final' + (b.seeds ? ' <span style="font-size:11px;color:var(--muted)">(orden fijado a mano)</span>' : '') + '</div>';
    h += ctx.seeds.map(function (nm, i) {
      var dis = frozen ? ' disabled' : '';
      return '<div style="display:flex;gap:0.4rem;align-items:center;padding:0.2rem 0;font-size:13px"><b style="width:2rem">' + (i + 1) + '°</b><span style="flex:1">' + esc(nm) + '</span>' +
        '<button class="btn"' + (i === 0 ? ' disabled' : dis) + ' onclick="FasesExtra.moveSeed(' + i + ',-1)">↑</button><button class="btn"' + (i === n - 1 ? ' disabled' : dis) + ' onclick="FasesExtra.moveSeed(' + i + ',1)">↓</button></div>';
    }).join('');
    h += '<div style="margin-top:0.5rem;font-size:12px;color:var(--muted)">' + (n > 1 && (n & (n - 1)) ? 'Con ' + n + ' equipos, los ' + (Math.pow(2, Math.ceil(Math.log2(n))) - n) + ' mejores pasan directo. ' : '') + (frozen ? 'Ya hay resultados: el orden quedó fijo.' : 'Podés reordenar antes de jugar.') + '</div>';
    if (b.seeds && !frozen) h += '<button class="btn" style="margin-top:0.5rem" onclick="FasesExtra.autoSeeds()">Volver al orden automático</button>';
    return h + '</div>';
  }
  function renderSeeds() {
    var fin = document.getElementById('page-final'), el = document.getElementById('fx-seeds-root');
    if (!fin) return;
    if (!el) { el = document.createElement('div'); el.id = 'fx-seeds-root'; var br = document.getElementById('bracket-root'); fin.insertBefore(el, br || null); }
    el.innerHTML = seedsHtml();
  }
  function init() { ensurePhases(); ensureDom(); render(); }

  root.FasesExtra = {
    buildFixture: buildFixture, ranking: ranking, finalSeeds: finalSeeds, allDone: allDone, renderSeeds: renderSeeds, seedsHtml: seedsHtml,
    moveSeed: function (i, d) { var ctx = bracketCtx(), a = ctx.seeds.slice(), k = i + d; if (k < 0 || k >= a.length || Object.keys(ctx.b.winners || {}).length) return; var t = a[i]; a[i] = a[k]; a[k] = t; ctx.b.seeds = a; saveState(); renderFinal(); },
    autoSeeds: function () { var b = bracketState(); if (Object.keys(b.winners || {}).length) return; b.seeds = null; saveState(); renderFinal(); }, init: init, render: function (id) { if (id) { var p = phaseById(id), el = document.getElementById('page-fx-' + id); if (p && el) el.innerHTML = pageHtml(p); } render(); },
    create: function () {
      var name = (document.getElementById('fx-new-name').value || '').trim(), tipo = document.getElementById('fx-new-tipo').value, src = document.getElementById('fx-new-copy').value;
      if (!name) { showToast('⚠️', 'Escribí un nombre para la fase'); return; }
      var id = nextId();
      getPhases().push({ id: id, nombre: name, tipo: tipo, emoji: tipo === 'individual' ? '🎯' : '🏁', games: src ? gamesOf(src) : [], fixture: [], clasifican: { cantidad: 0, tamanoGrupo: tipo === 'individual' ? 2 : 1 } });
      ensurePhases(); saveState(); ensureDom(); render(); goTab('fx-' + id); showToast('✅', 'Fase creada');
    },
    toggleGame: function (id, g) { var p = phaseById(id); if (!p || hasResults(p)) return; p.games = p.games || []; var i = p.games.indexOf(g); if (i < 0) p.games.push(g); else p.games.splice(i, 1); p.fixture = []; commit(); },
    copyGames: function (id) { var p = phaseById(id), s = document.getElementById('fx-copy-' + id).value; if (!p || !s || hasResults(p)) return; p.games = gamesOf(s); p.fixture = []; commit('Juegos copiados'); },
    generate: function (id) {
      var p = phaseById(id); if (!p) return;
      if (!(p.games || []).length) { showToast('⚠️', 'Elegí al menos un juego'); return; }
      if (roster(p).length < 2) { showToast('⚠️', 'Hacen falta al menos 2 participantes'); return; }
      if (hasResults(p) && !confirm('Regenerar el fixture borra los resultados cargados de esta fase. ¿Seguir?')) return;
      state[p.id] = {}; p.byes = {};
      var fx = null;
      if (p.modo !== 'todos' && typeof generateCoverageFixture === 'function') {
        try { var r = generateCoverageFixture(roster(p).length, p.games.length, [], []); if (r && r.fixture && r.fixture.length) { fx = r.fixture; p.byes = r.byes || {}; } } catch (e) {}
      }
      p.fixture = fx || buildFixture(roster(p).length, p.games); commit('Fixture generado');
    },
    setResult: function (id, k, w) { var r = phaseResults(id); if (w === null) delete r[k]; else r[k] = { winner: w }; commit(); },
    setModo: function (id, v) { var p = phaseById(id); if (!p || hasResults(p)) { render(); return; } p.modo = v === 'todos' ? 'todos' : 'cobertura'; p.fixture = []; commit(); },
    addAdjust: function (id) {
      var p = phaseById(id); if (!p) return; var i = +document.getElementById('fx-adj-n-' + id).value, pts = parseInt(document.getElementById('fx-adj-p-' + id).value, 10) || 0;
      if (!pts || !roster(p)[i]) return;
      phaseAdjust(id).push({ id: Date.now(), name: roster(p)[i], pts: pts, label: (document.getElementById('fx-adj-l-' + id).value || '').trim(), ts: Date.now() }); commit();
    },
    removeAdjust: function (id, aid) { state.adjust[id] = phaseAdjust(id).filter(function (a) { return a.id !== aid; }); commit(); },
    // Simulacro: resultados aleatorios en todas las fases nuevas
    simulate: function () {
      extras().forEach(function (p) { var res = state[p.id] = {}; (p.fixture || []).forEach(function (m) { var x = Math.random(); res[key(m)] = { winner: x < 0.12 ? 'empate' : (x < 0.56 ? m[1] : m[2]) }; }); });
    },
    reglasHtml: function () {
      var ex = extras(); if (!ex.length) return '';
      return '<div class="section-header" style="margin-top:2rem"><span class="section-title">Fases adicionales</span></div>' + ex.map(function (p) {
        var P = FasesView.pts(p);
        return '<div class="card" style="padding:0.9rem;margin-bottom:0.6rem"><b>' + esc(p.emoji) + ' ' + esc(p.nombre) + '</b> <span style="color:var(--muted);font-size:12px">· ' + (p.tipo === 'individual' ? 'individual' : 'grupal') + '</span><div style="font-size:13px;margin-top:0.35rem">Juegos: ' + ((p.games || []).map(esc).join(', ') || 'sin elegir') + '<br>Victoria ' + P.win + ' pts · Empate ' + P.draw + ' pts · ' + (p.modo === 'todos' ? 'Todos contra todos' : 'Cada uno juega todos los juegos') + '<br>Clasifican a la Final: ' + (+p.clasifican.cantidad || 'sin definir') + (p.tipo === 'individual' && +p.clasifican.cantidad ? ' (equipos de a ' + p.clasifican.tamanoGrupo + ')' : '') + '</div></div>';
      }).join('');
    },
    setPts: function (id, f, v) { var p = phaseById(id); if (!p) return; p.pts = Object.assign({ win: 3, draw: 1 }, p.pts); p.pts[f] = Math.max(0, parseInt(v, 10) || 0); commit(); },
    setQual: function (id, field, v) { var p = phaseById(id); if (!p) return; p.clasifican[field] = Math.max(field === 'tamanoGrupo' ? 1 : 0, parseInt(v, 10) || 0); commit(); },
    rename: function (id) { var p = phaseById(id), n = p && prompt('Nombre de la fase', p.nombre); if (n && n.trim()) { p.nombre = n.trim(); saveState(); ensureDom(); render(); goTab('fx-' + id); } },
    remove: function (id) {
      var p = phaseById(id); if (!p || !confirm('¿Eliminar "' + p.nombre + '" con todos sus resultados?')) return;
      state.phases = state.phases.filter(function (q) { return q.id !== id; }); delete state[id]; delete state.adjust[id]; delete state.cellPts[id];
      saveState(); ensureDom(); render(); goTab('reglas');
    }
  };
  // Reglas: después de pintar la pestaña, se agrega el resumen de fases adicionales
  if (typeof renderReglas === 'function' && !renderReglas._fx) {
    var _rr = renderReglas;
    renderReglas = function () { var out = _rr.apply(this, arguments); try { var el = document.getElementById('reglas-root'); if (el && root.FasesExtra) el.insertAdjacentHTML('beforeend', root.FasesExtra.reglasHtml()); } catch (e) {} return out; };
    renderReglas._fx = true;
  }
  // Arranque: el script carga después del principal, así que acá se arman las pestañas y se retoma la última abierta.
  if (typeof document !== 'undefined' && typeof state !== 'undefined' && document.querySelector('.nav-tabs')) {
    try {
      init();
      var lt = state.lastTab || '';
      if (lt.indexOf('fx-') === 0) activateTab(document.getElementById('page-' + lt) ? lt : 'reglas');
    } catch (e) { console.warn('Fases extra:', e); }
  }
})(typeof window !== 'undefined' ? window : globalThis);
