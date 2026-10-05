/* Ensayo real: observación de Firebase + confirmaciones humanas. No crea resultados. */
(function () {
  'use strict';
  const files = {
    argentinos: '100_Argentinos_Dicen.html', movies: 'guess_Movies_Songs.html',
    palabras: 'palabras_a_tiempo.html', erudito: 'el_erudito.html', carrera: 'carrera_de_mentes.html'
  };
  const checks = { phones: false, tv: false };
  let selected = '', scan = null, busy = false;
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const byId = id => document.getElementById(id);
  function matches() {
    const rows = [];
    ['f2'].forEach(phase => {
      const fixture = phase === 'f1' ? F1_FIXTURE : F2_FIXTURE;
      const roster = phase === 'f1' ? PLAYERS : TEAMS;
      const games = phase === 'f1' ? GAMES_F1 : GAMES_F2;
      fixture.forEach((entry, index) => {
        const [round, a, b, g] = entry;
        const game = BuzzerRounds.gameId(games[g]);
        if (!game || !roster[a] || !roster[b]) return;
        rows.push({ phase, index, round, a, b, game, nameA: roster[a], nameB: roster[b],
          gameName: games[g], key: round + '-' + a + '-' + b, id: phase + '-' + round + '-' + a + '-' + b });
      });
    });
    return rows;
  }
  function current() { return matches().find(x => x.phase + ':' + x.index === selected); }
  function line(ok, label, detail) {
    return `<div style="padding:.55rem .65rem;margin:.4rem 0;border-radius:8px;background:${ok ? 'rgba(78,203,126,.11)' : 'rgba(245,200,66,.09)'};border:1px solid ${ok ? 'rgba(78,203,126,.35)' : 'rgba(245,200,66,.25)'};font-size:12px;line-height:1.45">
      ${ok ? '✓' : '○'} <b>${label}</b>${detail ? ' · ' + esc(detail) : ''}</div>`;
  }
  function render() {
    const body = byId('ensayo-modal-body');
    if (!body) return;
    const options = matches();
    if (!options.some(x => x.phase + ':' + x.index === selected)) {
      const first = options.find(x => x.game === 'argentinos') || options[0];
      selected = first ? first.phase + ':' + first.index : '';
    }
    const m = current();
    if (!m) {
      body.innerHTML = '<p style="color:var(--muted);margin:1rem 0">No hay cruces digitales válidos en el fixture. Configurá al menos una estación digital para hacer el ensayo.</p>';
      return;
    }
    const hub = new URL('index.html?game=' + m.game, location.href).href;
    const online = scan && scan.online;
    const fixture = scan && scan.fixture;
    const active = scan && scan.active;
    const buzz = scan && scan.buzz;
    const live = scan && scan.live;
    const applied = scan && scan.applied;
    const result = scan && scan.result;
    body.innerHTML = `
      <p style="font-size:12px;color:var(--muted);line-height:1.55;margin:.5rem 0 1rem">Usá la misma dirección publicada en la PC y los dos celulares. Este ensayo usa el fixture y los puntajes reales: hacé un backup antes y reiniciá los puntajes de prueba al terminar.</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.9rem">
        <button class="btn btn-ghost" onclick="downloadNightBackup(true)">⬇️ Guardar backup completo</button>
        <button class="btn btn-ghost" onclick="ensayoRefresh()" ${busy ? 'disabled' : ''}>${busy ? '⏳ Comprobando…' : '↻ Comprobar estado'}</button>
      </div>
      <label for="ensayo-match" style="font-size:11px;color:var(--muted)">Cruce para probar</label>
      <select id="ensayo-match" onchange="ensayoSelect(this.value)" style="display:block;width:100%;padding:.65rem;margin:.3rem 0 1rem;border-radius:8px;background:var(--surface2);color:var(--text);border:1px solid var(--border2)">
        ${options.map(x => `<option value="${x.phase}:${x.index}" ${x.phase + ':' + x.index === selected ? 'selected' : ''}>${x.phase === 'f1' ? 'Individual' : 'Equipos'} · R${x.round} · ${esc(x.gameName)} · ${esc(x.nameA)} vs ${esc(x.nameB)}</option>`).join('')}
      </select>
      ${line(online, 'Conexión con la base', scan && scan.error ? scan.error : (online ? 'lectura en vivo correcta' : 'comprobá la conexión'))}
      ${line(fixture, 'Fixture publicado', fixture ? 'este cruce figura con los participantes correctos' : 'guardá el fixture y volvé a comprobar')}
      <div style="border-top:1px solid var(--border2);padding-top:.7rem;margin-top:1rem">
        <b>1. Activar y abrir la mesa</b>
        <p style="font-size:12px;color:var(--muted);margin:.4rem 0">Activar este cruce reinicia el marcador de ese juego. Abrí su pantalla en modo conductor.</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="ensayoActivate(this)">▶ Activar este cruce</button>
          <button class="btn btn-ghost" onclick="ensayoOpenGame()">↗ Abrir juego</button>
        </div>
        ${line(active, 'Cruce activo', active ? 'los nombres coinciden en la base' : 'activá el cruce y actualizá')}
      </div>
      <div style="border-top:1px solid var(--border2);padding-top:.7rem;margin-top:1rem">
        <b>2. Probar dos celulares</b>
        <p style="font-size:12px;color:var(--muted);margin:.4rem 0">Escaneá este QR en ambos celulares. Elegí ${esc(m.nameA)} en uno y ${esc(m.nameB)} en el otro; comprobá que no aparecen participantes ajenos. En los juegos con buzzer, abrilo desde el conductor y tocá desde ambos teléfonos.</p>
        <div id="ensayo-qr" style="display:inline-flex;background:white;padding:8px;border-radius:8px;min-width:216px;min-height:216px;margin:.4rem 0"></div>
        <div style="font-size:11px;word-break:break-all;color:var(--muted)">${esc(hub)}</div>
        <label style="display:block;font-size:12px;margin:.6rem 0"><input type="checkbox" onchange="ensayoCheck('phones',this.checked)" ${checks.phones ? 'checked' : ''}> Verifiqué los dos celulares y sus nombres</label>
        ${m.game === 'argentinos' || m.game === 'movies' ? line(buzz, 'Buzzer recibido', buzz ? 'el juego registró un ganador del toque' : 'esperando una pulsación válida') : '<p style="font-size:11px;color:var(--muted)">Este juego no usa buzzer; verificá la selección de identidad en los teléfonos.</p>'}
      </div>
      <div style="border-top:1px solid var(--border2);padding-top:.7rem;margin-top:1rem">
        <b>3. Marcador y TV</b>
        <p style="font-size:12px;color:var(--muted);margin:.4rem 0">Sumá un punto desde el conductor. Abrí la TV y comprobá que muestra el mismo cambio.</p>
        <button class="btn btn-ghost" onclick="openTVMode()">📺 Abrir Modo TV</button>
        ${line(live, 'Marcador publicado', live ? scan.score : 'sumá un punto y comprobá otra vez')}
        <label style="display:block;font-size:12px;margin:.6rem 0"><input type="checkbox" onchange="ensayoCheck('tv',this.checked)" ${checks.tv ? 'checked' : ''}> Vi el cambio correcto en la TV</label>
      </div>
      <div style="border-top:1px solid var(--border2);padding-top:.7rem;margin-top:1rem">
        <b>4. Cargar y revisar el resultado</b>
        <p style="font-size:12px;color:var(--muted);margin:.4rem 0">Terminá la partida antes de abrir la carga: ese botón congela el marcador al abrirse. Revisá ganador, bonus y puntos, confirmá, y volvé aquí para comprobarlo.</p>
        <button class="btn btn-ghost" onclick="ensayoOpenResults()">🔄 Abrir carga de resultados</button>
        ${line(result, 'Captura del juego', result ? 'resultado disponible en la base' : 'pendiente de capturar')}
        ${line(applied, 'Tabla actualizada', applied ? 'el cruce tiene resultado guardado' : 'confirmá la carga y actualizá')}
      </div>
      <div style="border-top:1px solid var(--border2);padding-top:.7rem;margin-top:1rem">
        <b>5. Cerrar el ensayo</b>
        <p style="font-size:12px;color:var(--muted);margin:.4rem 0">Descargá un backup del ensayo si querés conservarlo. Para arrancar la noche desde cero, usá <b>Reiniciar puntos de la noche</b> en el panel de administración y comprobá la tabla otra vez. Esa acción borra resultados de prueba.</p>
        ${online && fixture && active && checks.phones && live && checks.tv && applied ? line(true, 'Ensayo completo', 'conexión, participantes, marcador, TV y tabla verificados') : line(false, 'Ensayo pendiente', 'completá los pasos y volvé a comprobar')}
      </div>`;
    renderGuestQRCode(hub, 'ensayo-qr');
  }
  async function refresh() {
    const m = current(); if (!m || busy) return;
    busy = true; render();
    const next = { online: false, fixture: false, active: false, buzz: false,
      live: false, applied: false, result: false, score: '' };
    try {
      if (!window._rtdb) throw new Error('Firebase todavía no está disponible');
      const db = window._rtdb;
      const [conn, fixture, game, live, results] = await Promise.all([
        db.ref('.info/connected').once('value'), db.ref('velada/fixture').once('value'),
        db.ref(BuzzerRounds.paths[m.game]).once('value'),
        db.ref('velada/enVivo/' + m.id).once('value'),
        db.ref('velada/resultados/' + m.id).once('value')
      ]);
      next.online = conn.val() === true;
      const f = fixture.val(), phase = f && f[m.phase];
      next.fixture = !!(phase && Array.isArray(phase.fixture) && phase.fixture.some(e =>
        e[0] === m.round && e[1] === m.a && e[2] === m.b) &&
        (m.phase === 'f1' ? phase.players[m.a] === m.nameA && phase.players[m.b] === m.nameB
          : phase.teams[m.a] === m.nameA && phase.teams[m.b] === m.nameB));
      const g = game.val() || {}, activeMatch = g.fixture;
      next.active = !!(activeMatch && activeMatch.active && activeMatch.phase === m.phase &&
        activeMatch.key === m.key && activeMatch.names &&
        activeMatch.names.a === m.nameA && activeMatch.names.b === m.nameB);
      next.buzz = next.active && !!(g.winner && g.winner.matchId === activeMatch.id);
      const l = live.val();
      next.live = next.active && !!(l && l.matchId === m.id && l.names &&
        l.names.a === m.nameA && l.names.b === m.nameB && l.marcador &&
        Number.isFinite(l.marcador.a) && Number.isFinite(l.marcador.b) &&
        (l.marcador.a !== 0 || l.marcador.b !== 0));
      if (next.live) next.score = m.nameA + ' ' + l.marcador.a + ' – ' + l.marcador.b + ' ' + m.nameB;
      next.result = !!results.val();
      next.applied = !!((m.phase === 'f1' ? state.f1 : state.f2)[m.key]);
    } catch (e) { next.error = e.code || e.message || 'error de lectura'; }
    scan = next; busy = false; render();
  }
  window.openEnsayoGuiado = function () {
    byId('ensayo-modal-bg').classList.add('open');
    render(); refresh();
  };
  window.closeEnsayoGuiado = function () { byId('ensayo-modal-bg').classList.remove('open'); };
  window.ensayoRefresh = refresh;
  window.ensayoSelect = function (value) {
    selected = value; scan = null; checks.phones = false; checks.tv = false;
    render(); refresh();
  };
  window.ensayoCheck = function (key, value) { checks[key] = value; render(); };
  window.ensayoActivate = async function (button) {
    const m = current(); if (!m) return;
    await activateBuzzerMatch(m.phase, m.index, button);
    scan = null; checks.phones = false; checks.tv = false;
    refresh();
  };
  window.ensayoOpenGame = function () {
    const m = current(); if (m) window.open(files[m.game], '_blank');
  };
  window.ensayoOpenResults = function () {
    closeEnsayoGuiado(); openAutoResultadosModal();
  };
  byId('ensayo-modal-bg').addEventListener('click', e => {
    if (e.target.id === 'ensayo-modal-bg') closeEnsayoGuiado();
  });
})();
