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

  function gameBonusLabel(g) { return (typeof BONUS_F2 !== 'undefined' && BONUS_F2[g]) || ''; }
  function ranking(p) { return FasesView.rank(p, state, PLAYERS, TEAMS); }
  // Primera ronda con algún cruce sin resultado (la que se puede apostar).
  function pendingRound(p) {
    var res = phaseResults(p.id), rs = [];
    (p.fixture || []).forEach(function (m) { if (rs.indexOf(m[0]) < 0) rs.push(m[0]); });
    rs.sort(function (a, b) { return a - b; });
    for (var i = 0; i < rs.length; i++) if ((p.fixture || []).some(function (m) { return m[0] === rs[i] && !res[key(m)]; })) return rs[i];
    return 0;
  }
  function betWin(id) { return (state.betWindowX && state.betWindowX[id]) || { open: false, round: 0 }; }
  function betsHtml(p) {
    var bw = betWin(p.id), pend = pendingRound(p), open = !!bw.open, who = {};
    if (open && bw.round) (p.fixture || []).forEach(function (m) { if (m[0] === bw.round) Object.keys(((state.betsX || {})[p.id] || {})[key(m)] || {}).forEach(function (n) { who[n] = 1; }); });
    var n = Object.keys(who).length, btn = function (col, bg, fn, txt) { return '<button onclick="' + fn + '" style="width:100%;padding:0.8rem;border-radius:var(--radius);border:1.5px solid ' + col + ';background:' + bg + ';color:' + col + ';font-family:inherit;font-size:14px;font-weight:800;cursor:pointer">' + txt + '</button>'; };
    var hasFx = !!(p.fixture || []).length, body, txt = 'font-size:12px;color:var(--muted);margin:0.5rem 0 0.7rem;line-height:1.5';
    if (!hasFx) body = '<div style="' + txt + '">Generá el fixture para habilitar apuestas.</div>';
    else if (open) body = '<div style="' + txt + '">Los invitados pueden apostar los duelos de la <b style="color:var(--gold)">Ronda ' + bw.round + '</b>. Cerralas antes de empezar a jugar.' + (n ? ' <b style="color:var(--success)">' + n + ' ya apostaron.</b>' : '') + '</div>' + btn('var(--danger)', 'rgba(255,95,95,0.12)', "FasesExtra.closeBets('" + p.id + "')", '🔒 Cerrar apuestas de la Ronda ' + bw.round);
    else if (pend) body = '<div style="' + txt + '">Apuestas cerradas. Al abrirlas van a corresponder a la <b style="color:var(--gold)">Ronda ' + pend + '</b>. Cada acierto suma 1 punto ' + (p.tipo === 'individual' ? 'al apostador' : 'al equipo del apostador') + '; si apuesta a su propio duelo y lo pierde, se le anulan sus puntos de apuestas.</div>' + btn('var(--success)', 'rgba(78,203,126,0.12)', "FasesExtra.openBets('" + p.id + "')", '🔓 Abrir apuestas · Ronda ' + pend);
    else body = '<div style="' + txt + '">🏁 No quedan rondas pendientes para apostar.</div>';
    return '<div class="card" style="margin-top:1.25rem;border-color:' + (open ? 'var(--gold)' : 'var(--border2)') + '"><div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem"><span style="font-size:12px;font-weight:700;color:' + (open ? 'var(--gold)' : 'var(--muted)') + '">🃏 Apuestas ' + (open ? '· ABIERTAS' : '· cerradas') + '</span>' +
      '<span style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:3px 9px;border-radius:99px;background:' + (open ? 'rgba(245,200,66,0.15)' : 'var(--surface2)') + ';color:' + (open ? 'var(--gold)' : 'var(--muted)') + '">' + (open ? 'Ronda ' + bw.round : 'en pausa') + '</span></div>' + body + '</div>';
  }
  function comodinesHtml(p) {
    var list = state['comodines_' + p.id] || [], ent = p.tipo === 'individual' ? 'jugador' : 'equipo';
    var h = '<div class="section-header" style="margin-top:1.25rem"><span class="section-title"><span class="dot-indicator impostor"></span>Ruleta de comodines</span></div><div class="card" style="margin-bottom:1.25rem">' +
      '<p style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:0.75rem">Girala cuando quieras condimentar la noche: elige un ' + ent + ' al azar y le toca un comodín (bueno o malo). Ninguno mueve más de 1 punto.</p>' +
      '<button onclick="openRuleta(\'' + p.id + '\')" style="width:100%;padding:0.85rem;border-radius:var(--radius);border:1.5px solid var(--gold);background:var(--gold-dim);color:var(--gold);font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.02em">🎰 Girar la ruleta</button>';
    if (list.length) h += '<div style="margin-top:0.9rem">' + list.slice().reverse().map(function (c) {
      var cm = (typeof comodinByKey === 'function' && comodinByKey(c.key)) || { emoji: '🎲', name: c.key };
      var st = c.status === 'pending' ? '⏳ pendiente' : ((c.delta || 0) > 0 ? '+' : '') + (c.delta || 0) + ' pt' + (c.note ? ' · ' + esc(c.note) : '');
      return '<div style="display:flex;gap:0.5rem;align-items:center;font-size:13px;padding:0.25rem 0"><span style="flex:1">' + esc(cm.emoji) + ' ' + esc(cm.name) + ' — <b>' + esc(String(c.player).split(' ')[0]) + '</b> · ' + st + '</span><button onclick="deleteComodin(\'' + c.id + '\',\'' + p.id + '\')" title="Borrar" style="padding:0.3rem 0.45rem;border-radius:8px;border:1px solid rgba(255,95,95,0.25);background:transparent;color:var(--danger);cursor:pointer;font-size:11px">✕</button></div>';
    }).join('') + '</div>';
    return h + '</div>';
  }


  // Estilos acotados a las fases nuevas (no tocan la Fase grupal ni otras pantallas): botones, inputs y checks con el look de la Fase grupal.
  (function injectStyle() {
    try {
      if (typeof document === 'undefined' || !document.head || document.getElementById('fx-style')) return;
      var S = '.page[data-fx]', N = '#fx-new-host', st = document.createElement('style'); st.id = 'fx-style';
      st.textContent =
        S + ' .btn,' + N + ' .btn{background:var(--surface2);color:var(--text);border:1px solid var(--border2);border-radius:var(--radius);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
        S + ' .btn.btn-primary,' + N + ' .btn.btn-primary{background:var(--accent);color:#0f0f13;border-color:var(--accent)}' +
        S + ' .btn:disabled,' + N + ' .btn:disabled{opacity:.45;cursor:default}' +
        S + ' input[type=number],' + S + ' input[type=text],' + N + ' input[type=text]{padding:0.4rem 0.55rem;border-radius:var(--radius);border:1px solid var(--border2);background:var(--surface);color:var(--text);font-family:inherit;font-size:13px}' +
        S + ' input[type=number]:focus,' + S + ' input[type=text]:focus,' + N + ' input[type=text]:focus{outline:none;border-color:var(--accent)}' +
        S + ' input[type=checkbox]{accent-color:var(--accent)}' +
        S + ' select.rule-edit-input,' + N + ' select.rule-edit-input{color-scheme:dark}';
      document.head.appendChild(st);
    } catch (e) {}
  })();

  var cfgOpen = {};
  var jsq = function (v) { return esc(String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")); };
  var first = function (v) { return esc(String(v || '?').split('/')[0].trim()); };
  // Puntos de un participante en una ronda: null = sin cargar, 'bye' = descansa (mismo criterio visual que la Fase grupal).
  var roundPts = function (p, i, r, res, P) { return FasesView.roundPts(p, i, r, res, P); };
  function gameColors(g) {
    var gi = (typeof GAMES_F2 !== 'undefined') ? GAMES_F2.indexOf(g) : -1;
    return (gi >= 0 && typeof GAME_COLORS_F2 !== 'undefined' && GAME_COLORS_F2[gi]) || ['var(--surface2)', 'var(--muted)'];
  }

  function pageHtml(p) {
    var names = roster(p), games = (p.games || []), res = phaseResults(p.id), locked = hasResults(p), P = FasesView.pts(p);
    var fixture = p.fixture || [], rk = ranking(p), q = +p.clasifican.cantidad || 0;
    var rounds = []; fixture.forEach(function (m) { if (rounds.indexOf(m[0]) < 0) rounds.push(m[0]); }); rounds.sort(function (a, b) { return a - b; });
    var done = fixture.filter(function (m) { return res[key(m)]; }).length;
    var editing = !locked && typeof _fixtureEditMode !== 'undefined' && !!_fixtureEditMode[p.id];
    var h = '<div class="stats-grid"><div class="stat-card"><div class="stat-num">' + done + '</div><div class="stat-label">Duelos jugados</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + (fixture.length - done) + '</div><div class="stat-label">Pendientes</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + (rk[0] ? rk[0].pts : 0) + '</div><div class="stat-label">Puntaje líder</div></div></div>';

    // ── Configuración (mismo panel colapsable que la Fase grupal) ──
    h += '<details class="control-panel" id="fx-config-' + p.id + '" style="margin-bottom:1.25rem"' + (cfgOpen[p.id] ? ' open' : '') + ' ontoggle="FasesExtra.cfgOpen(\'' + p.id + '\',this.open)"><summary><span class="control-panel-title">🎛️ Configuración de ' + esc(p.nombre) +
      '<span class="control-panel-sub" style="display:block;font-weight:500">' + (p.tipo === 'individual' ? 'Individual' : 'Grupal') + ' · juegos, clasificación y puntos</span></span><span class="rule-chevron">▾</span></summary><div class="control-panel-body">';
    h += '<div class="card" style="padding:0.9rem"><div style="font-weight:700;margin-bottom:0.5rem">Juegos de la fase' + (locked ? ' 🔒' : '') + '</div><div style="display:flex;flex-wrap:wrap;gap:0.4rem">';
    gameList().forEach(function (g) {
      var on = games.indexOf(g) >= 0;
      h += '<label style="padding:0.3rem 0.6rem;border:1px solid var(--border2);border-radius:99px;font-size:12px;cursor:' + (locked ? 'default' : 'pointer') + ';' + (on ? 'background:var(--accent-dim);' : 'opacity:.6;') + '"><input type="checkbox" ' + (on ? 'checked ' : '') + (locked ? 'disabled ' : '') + 'onchange="FasesExtra.toggleGame(\'' + p.id + '\',' + JSON.stringify(g).replace(/"/g, '&quot;') + ')" style="margin-right:4px">' + esc(g) + '</label>';
    });
    h += '</div><div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;align-items:center"><select id="fx-copy-' + p.id + '" class="rule-edit-input" ' + (locked ? 'disabled' : '') + '><option value="">Copiar juegos de…</option><option value="f2">Fase grupal</option>' +
      extras().filter(function (x) { return x.id !== p.id; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.nombre) + '</option>'; }).join('') +
      '</select><button class="btn" ' + (locked ? 'disabled' : '') + ' onclick="FasesExtra.copyGames(\'' + p.id + '\')">Copiar</button>' +
      '<select class="rule-edit-input" onchange="FasesExtra.setModo(\'' + p.id + '\',this.value)" title="Tipo de fixture"><option value="cobertura"' + (p.modo !== 'todos' ? ' selected' : '') + '>Cada uno juega todos los juegos (con descansos)</option><option value="todos"' + (p.modo === 'todos' ? ' selected' : '') + '>Todos contra todos</option></select></div></div>';
    h += '<div class="card" style="padding:0.9rem;margin-top:0.75rem"><div style="font-weight:700;margin-bottom:0.5rem">Clasifican a la Final</div><div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;font-size:13px"><label>Cantidad <input type="number" min="0" max="' + names.length + '" value="' + p.clasifican.cantidad + '" style="width:4rem" onchange="FasesExtra.setQual(\'' + p.id + '\',\'cantidad\',this.value)"></label>' +
      (p.tipo === 'individual' ? '<label>Se agrupan de a <input type="number" min="1" max="6" value="' + p.clasifican.tamanoGrupo + '" style="width:3.5rem" onchange="FasesExtra.setQual(\'' + p.id + '\',\'tamanoGrupo\',this.value)"></label>' : '') +
      '</div><div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;font-size:13px;margin-top:0.6rem"><b>Puntos</b><label>Victoria <input type="number" min="0" max="20" value="' + P.win + '" style="width:3.5rem" onchange="FasesExtra.setPts(\'' + p.id + '\',\'win\',this.value)"></label><label>Empate <input type="number" min="0" max="20" value="' + P.draw + '" style="width:3.5rem" onchange="FasesExtra.setPts(\'' + p.id + '\',\'draw\',this.value)"></label></div></div>';
    h += '<div style="margin-top:0.9rem;display:flex;gap:0.5rem;flex-wrap:wrap"><button class="btn" onclick="FasesExtra.rename(\'' + p.id + '\')">Renombrar</button><button class="btn" style="color:var(--danger,#ff5f5f)" onclick="FasesExtra.remove(\'' + p.id + '\')">Eliminar fase</button></div></div></details>';

    h += comodinesHtml(p);

    h += '<div id="podium-fx-' + p.id + '"></div>';

    // ── Clasificación (misma tabla que la Fase grupal) ──
    h += '<div class="section-header"><span class="section-title"><span class="dot-indicator fase2"></span>Clasificación ' + (p.tipo === 'individual' ? 'individual' : 'grupal') + '</span>' + (q ? '<span class="especial-badge">★ Clasifican ' + q + ' a la Final</span>' : '') + '</div>';
    h += '<div class="card" style="padding:0"><div class="table-wrap"><table class="ranking"><thead><tr><th style="width:36px">#</th><th>' + (p.tipo === 'individual' ? 'Jugador' : 'Equipo') + '</th>' +
      rounds.map(function (r, n) { return '<th>R' + (n + 1) + '</th>'; }).join('') + '<th title="Apuestas acertadas">🃏</th><th title="Comodines">🎰</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
      rk.map(function (r, k) {
        var cl = k < q, badge = cl && k === 0 ? 'gold' : k === 1 ? 'accent' : '';
        var cells = rounds.map(function (rd, ri) {
          var v = roundPts(p, r.i, rd, res, P), ov = FasesView.cellOv(state, p.id, r.n, ri), cls = ov !== null ? ' overridden' : '';
          var click = ' onclick="editCellPts(\'' + p.id + '\',\'' + jsq(r.n) + '\',' + ri + ')" style="cursor:pointer" title="Tocá para editar los puntos de esta ronda"';
          if (ov !== null) v = ov;
          if (v === 'bye') return '<td class="round-pts bye"' + click + ' title="Descansa esta ronda">😴</td>';
          if (v === null) return '<td class="round-pts pending"' + click + '>—</td>';
          return '<td class="round-pts' + (v >= 4 ? ' bonus' : v > 0 ? ' win' : '') + cls + '"' + click + '>' + v + '</td>';
        }).join('');
        var cell = function (v) { return v ? '<td class="round-pts ' + (v > 0 ? 'win' : '') + '">' + (v > 0 ? '+' : '') + v + '</td>' : '<td class="round-pts pending">—</td>'; };
        return '<tr class="' + (cl ? 'classifica' : '') + '"><td><div class="pos-badge ' + badge + '">' + (k + 1) + '</div></td><td class="player-name" style="font-size:12px"><div class="player-name-inner">' +
          (typeof playerAvatarHtml === 'function' ? playerAvatarHtml(r.n, r.i) : '') + '<span>' + esc(r.n) + '</span>' + (cl ? '<span class="classifica-tag">★ Clasifica</span>' : '') + '</div></td>' +
          cells + cell(r.bets) + cell(r.como) + '<td style="text-align:right"><span class="total-pts">' + r.pts + '</span></td></tr>';
      }).join('') + '</tbody></table></div></div>';

    // ── Fixture (mismas filas y chips que la Fase grupal) ──
    var digital = function (m) { return typeof BuzzerRounds !== 'undefined' && !!BuzzerRounds.gameId(games[m[3]]); };
    h += '<div class="section-header" style="margin-top:1.5rem"><span class="section-title"><span class="dot-indicator fase2"></span>Fixture ' + esc(p.nombre) + '</span></div><div class="card" style="padding:0.75rem">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;gap:0.5rem;flex-wrap:wrap"><span style="font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted)">Fixture</span><div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">' +
      (fixture.some(digital) ? '<button class="fixture-edit-toggle" onclick="openAutoResultadosModal()">🔄 Cargar resultados automáticamente</button>' : '') +
      (locked ? '<span style="font-size:11px;color:var(--muted);opacity:0.6">🔒 Fijo (hay resultados)</span>' : '<button class="fixture-edit-toggle" onclick="FasesExtra.generate(\'' + p.id + '\')">🎲 ' + (fixture.length ? 'Regenerar fixture' : 'Generar fixture') + '</button>' +
        (fixture.length ? '<button class="fixture-edit-toggle' + (editing ? ' active' : '') + '" onclick="toggleFixtureEdit(\'' + p.id + '\')">' + (editing ? '✓ Cerrar editor' : '✏️ Editar enfrentamientos') + '</button>' : '')) + '</div></div>';
    if (!fixture.length) h += '<div style="font-size:12px;color:var(--muted);padding:0.5rem 0.25rem">Todavía no hay fixture: elegí los juegos en la configuración y tocá "🎲 Generar fixture".</div>';
    rounds.forEach(function (r, n) {
      var ms = fixture.filter(function (m) { return m[0] === r; }), playing = {};
      ms.forEach(function (m) { playing[m[1]] = 1; playing[m[2]] = 1; });
      var byes = names.map(function (nm, i) { return playing[i] ? '' : '<span class="bye-tag">😴 Descansa: ' + first(nm) + '</span>'; }).join(' ');
      h += '<div class="fixture-round"><div class="round-label">Ronda ' + (n + 1) + ' ' + byes + (ms.some(digital) ? '<button class="fixture-edit-toggle" style="margin-left:10px" onclick="activateBuzzerRound(\'' + p.id + '\',' + r + ',this)">▶ Activar ronda ' + (n + 1) + '</button>' : '') + '</div>';
      ms.forEach(function (m) {
        var k = key(m), cur = res[k], g = games[m[3]] || '?', c = gameColors(g), A = names[m[1]], B = names[m[2]], mi = fixture.indexOf(m), sid = 'fe-' + p.id + '-';
        if (editing) {
          var opt = function (list, sel) { return list.map(function (t, ti) { return '<option value="' + ti + '"' + (ti === sel ? ' selected' : '') + '>' + first(t) + '</option>'; }).join(''); };
          h += '<div class="fixture-edit-row"><select class="fixture-edit-select" id="' + sid + 'a-' + mi + '">' + opt(names, m[1]) + '</select><span class="fixture-edit-vs">vs</span><select class="fixture-edit-select" id="' + sid + 'b-' + mi + '">' + opt(names, m[2]) + '</select>' +
            '<select class="fixture-edit-select" style="max-width:140px" id="' + sid + 'g-' + mi + '">' + games.map(function (gn, gi) { return '<option value="' + gi + '"' + (gi === m[3] ? ' selected' : '') + '>' + esc(gn) + '</option>'; }).join('') + '</select>' +
            '<button class="fixture-edit-save" style="background:var(--info);color:#0f0f13" onclick="saveFixtureMatch(\'' + p.id + '\',' + mi + ',document.getElementById(\'' + sid + 'a-' + mi + '\'),document.getElementById(\'' + sid + 'b-' + mi + '\'),document.getElementById(\'' + sid + 'g-' + mi + '\'))">✓</button></div>';
          return;
        }
        var txt = cur ? (cur.winner === 'empate' ? 'Empate' : '✓ ' + first(names[cur.winner]) + (cur.bonus ? ' +bonus' : '')) : 'Cargar';
        h += '<div class="match-row ' + (cur ? 'done' : '') + '" onclick="openModal(\'' + p.id + '\',\'' + jsq(k) + '\',\'' + jsq(g) + '\',\'' + jsq(A) + '\',\'' + jsq(B) + '\',' + m[1] + ',' + m[2] + ')">' +
          '<span class="match-game-badge" style="background:' + c[0] + ';color:' + c[1] + ';font-weight:600">' + esc(g) + '</span>' +
          '<span class="match-players" style="font-size:12px">' + first(A) + ' vs ' + first(B) + '</span><span class="match-result ' + (cur ? 'set' : '') + '">' + txt + '</span></div>';
      });
      h += '</div>';
    });
    h += '</div>';

    h += betsHtml(p);
    // Ajustes manuales de puntos
    var adj = phaseAdjust(p.id);
    h += '<div class="section-header" style="margin-top:1.25rem"><span class="section-title">Ajustes manuales de puntos</span></div><div class="card" style="padding:0.75rem"><div style="display:flex;gap:0.4rem;flex-wrap:wrap"><select id="fx-adj-n-' + p.id + '" class="rule-edit-input">' + names.map(function (n, i) { return '<option value="' + i + '">' + esc(n) + '</option>'; }).join('') + '</select><input id="fx-adj-p-' + p.id + '" type="number" value="1" style="width:4rem"><input id="fx-adj-l-' + p.id + '" class="rule-edit-input" placeholder="Motivo (opcional)"><button class="btn" onclick="FasesExtra.addAdjust(\'' + p.id + '\')">Agregar</button></div>' +
      adj.map(function (a) { return '<div style="display:flex;gap:0.5rem;align-items:center;font-size:13px;padding:0.25rem 0"><span style="flex:1">' + esc(a.name) + ' · <b>' + (a.pts > 0 ? '+' : '') + a.pts + '</b>' + (a.label ? ' · ' + esc(a.label) : '') + '</span><button class="btn" onclick="FasesExtra.removeAdjust(\'' + p.id + '\',' + a.id + ')">✕</button></div>'; }).join('') + '</div>';
    return h;
  }

  function newHtml() {
    return '<div class="card" style="padding:1rem;display:grid;gap:0.75rem;border-color:rgba(96,180,240,0.3)"><div style="font-weight:700">＋ Nueva fase <span style="font-weight:500;font-size:12px;color:var(--muted)">· se crea con el mismo formato que la Fase grupal</span></div>' +
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
  }
  function render() {
    extras().forEach(function (p) {
      var el = document.getElementById('page-fx-' + p.id); if (!el) return;
      el.innerHTML = pageHtml(p);
      // Podio animado en vivo, el mismo que la Fase grupal.
      if (typeof renderPodium === 'function') { try { renderPodium('podium-fx-' + p.id, ranking(p).map(function (r) { return { n: r.n, i: r.i, pts: { total: r.pts } }; }), p.id); } catch (e) { console.warn('[podio]', e); } }
    });
    var host = document.getElementById('fx-new-host'); if (host) host.innerHTML = newHtml();
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
  // Datos de origen de un clasificado (fase y puesto), para mostrarlo en la Final como a los de la Fase grupal.
  function seedInfo(name) {
    var activas = extras().filter(function (p) { return (+p.clasifican.cantidad || 0) > 0 && (p.fixture || []).length; });
    for (var a = 0; a < activas.length; a++) {
      var p = activas[a], top = ranking(p).slice(0, +p.clasifican.cantidad).map(function (r) { return r.n; });
      var t = p.tipo === 'individual' ? Math.max(1, +p.clasifican.tamanoGrupo || 1) : 1, k = 0;
      for (var i = 0; i < top.length; i += t, k++) {
        var nm = p.tipo === 'individual' ? top.slice(i, i + t).join(' / ') : top[i];
        if (nm === name) { var res = phaseResults(p.id); return { label: p.emoji + ' ' + p.nombre, pos: i + 1, done: (p.fixture || []).every(function (m) { return res[key(m)]; }) }; }
      }
    }
    return null;
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
    newHtml: newHtml, cfgOpen: function (id, v) { cfgOpen[id] = !!v; },
    buildFixture: buildFixture, ranking: ranking, finalSeeds: finalSeeds, seedInfo: seedInfo, allDone: allDone, renderSeeds: renderSeeds, seedsHtml: seedsHtml,
    moveSeed: function (i, d) { var ctx = bracketCtx(), a = ctx.seeds.slice(), k = i + d; if (k < 0 || k >= a.length || Object.keys(ctx.b.winners || {}).length) return; var t = a[i]; a[i] = a[k]; a[k] = t; ctx.b.seeds = a; saveState(); renderFinal(); },
    autoSeeds: function () { var b = bracketState(); if (Object.keys(b.winners || {}).length) return; b.seeds = null; saveState(); renderFinal(); }, init: init, render: function (id) { if (id) { var p = phaseById(id), el = document.getElementById('page-fx-' + id); if (p && el) el.innerHTML = pageHtml(p); } render(); },
    create: function () {
      var name = (document.getElementById('fx-new-name').value || '').trim(), tipo = document.getElementById('fx-new-tipo').value, src = document.getElementById('fx-new-copy').value;
      if (!name) { showToast('⚠️', 'Escribí un nombre para la fase'); return; }
      var id = nextId();
      getPhases().push({ id: id, nombre: name, tipo: tipo, emoji: tipo === 'individual' ? '🎯' : '🏁', games: src ? gamesOf(src) : [], fixture: [], clasifican: { cantidad: 0, tamanoGrupo: tipo === 'individual' ? 2 : 1 } });
      ensurePhases(); saveState(); ensureDom(); render(); if (typeof renderReglas === 'function') { try { renderReglas(); } catch (e) {} } cfgOpen[id] = true; render(); goTab('fx-' + id); showToast('✅', 'Fase creada');
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
    toggleBonus: function (id, k, gi) {
      var r = phaseResults(id)[k], p = phaseById(id); if (!r || r.winner === 'empate' || !p) return;
      if (r.bonus) { delete r.bonus; delete r.bp; } else { r.bonus = true; r.bp = bonusPtsExtra((p.games || [])[gi]); }
      commit();
    },
    setResult: function (id, k, w) {
      var r = phaseResults(id); if (w === null) delete r[k]; else r[k] = { winner: w };
      if (w !== null && typeof resolvePendingComodines === 'function') { try { resolvePendingComodines(id, k, w, false); } catch (e) {} }
      commit();
    },
    openBets: function (id) { var p = phaseById(id), r = p && pendingRound(p); if (!r) { showToast('🏁', 'No quedan rondas pendientes'); return; } state.betWindowX = state.betWindowX || {}; state.betWindowX[id] = { open: true, round: r, ts: Date.now() }; commit('Apuestas abiertas · Ronda ' + r); },
    closeBets: function (id) { var w = betWin(id); state.betWindowX = state.betWindowX || {}; state.betWindowX[id] = { open: false, round: w.round || 0, ts: Date.now() }; commit('Apuestas cerradas'); },
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
      state.phases = state.phases.filter(function (q) { return q.id !== id; }); delete state[id]; delete state.adjust[id]; delete state.cellPts[id]; delete state['comodines_' + id]; if (state.betsX) delete state.betsX[id]; if (state.betWindowX) delete state.betWindowX[id];
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
