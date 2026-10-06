/* Vista compartida de las fases adicionales (TV y celulares). Solo lee: recibe el estado y devuelve HTML. */
(function (root) {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var key = function (m) { return m[0] + '-' + m[1] + '-' + m[2]; };
  function extras(state) { return (state && Array.isArray(state.phases) ? state.phases : []).filter(function (p) { return p && p.id !== 'f1' && p.id !== 'f2'; }); }
  function names(p, PL, TM) { return (p.tipo === 'individual' ? PL : TM) || []; }
  function pts(p) { var d = p.pts || {}; return { win: d.win != null ? +d.win : 3, draw: d.draw != null ? +d.draw : 1 }; }
  function rank(p, state, PL, TM) {
    var P = pts(p), res = (state && state[p.id]) || {}, rows = names(p, PL, TM).map(function (n, i) { return { i: i, n: n, pj: 0, g: 0, e: 0, p: 0, pts: 0 }; });
    (p.fixture || []).forEach(function (m) {
      var r = res[key(m)], A = rows[m[1]], B = rows[m[2]]; if (!r || !A || !B) return;
      A.pj++; B.pj++;
      if (r.winner === 'empate') { A.e++; B.e++; A.pts += P.draw; B.pts += P.draw; }
      else if (r.winner === m[1]) { A.g++; B.p++; A.pts += P.win; }
      else if (r.winner === m[2]) { B.g++; A.p++; B.pts += P.win; }
    });
    ((state && state.adjust && state.adjust[p.id]) || []).forEach(function (a) {
      var r = rows.find(function (x) { return x.n === a.name; }); if (r) r.pts += (+a.pts || 0);
    });
    return rows.sort(function (a, b) { return b.pts - a.pts || b.g - a.g || a.i - b.i; });
  }
  function progress(p, state) { var res = (state && state[p.id]) || {}, f = p.fixture || []; return { done: f.filter(function (m) { return res[key(m)]; }).length, total: f.length }; }
  function mine(n, o) {
    if (!o || !o.me) return false; var f = String(o.me).split(' ')[0];
    return n === o.me || (o.team && n === o.team) || String(n).split(/\s*\/\s*/).some(function (x) { return x === o.me || x === f; });
  }
  // opt: { me, tv }
  function html(p, state, PL, TM, opt) {
    opt = opt || {}; var big = !!opt.tv, fs = big ? 26 : 14, rows = rank(p, state, PL, TM), pr = progress(p, state), q = +(p.clasifican && p.clasifican.cantidad) || 0, medals = ['🥇', '🥈', '🥉'];
    var h = '<div style="color:var(--text,#f0efe8);font-size:' + fs + 'px"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.6em"><b style="font-size:1.15em">' + esc(p.emoji) + ' ' + esc(p.nombre) + '</b><span style="opacity:.65;font-size:.8em">' + pr.done + '/' + pr.total + ' partidos' + (q ? ' · clasifican ' + q : '') + '</span></div>';
    h += rows.map(function (r, k) {
      var me = mine(r.n, opt), cl = q && k < q;
      return '<div style="display:flex;align-items:center;gap:.6em;padding:.45em .7em;margin-bottom:.3em;border-radius:10px;border:1px solid ' + (me ? 'var(--accent,#c8f060)' : 'var(--border2,rgba(255,255,255,.12))') + ';background:' + (me ? 'rgba(200,240,96,.12)' : cl ? 'rgba(96,180,240,.10)' : 'rgba(255,255,255,.03)') + '">' +
        '<span style="width:1.8em;text-align:center">' + (k < 3 ? medals[k] : (k + 1) + '°') + '</span><span style="flex:1;font-weight:' + (me ? 800 : 600) + '">' + esc(r.n) + (me ? ' · vos' : '') + '</span>' +
        '<span style="opacity:.6;font-size:.8em">' + r.g + 'G ' + r.e + 'E ' + r.p + 'P</span><b style="min-width:2.2em;text-align:right">' + r.pts + '</b></div>';
    }).join('');
    return h + '</div>';
  }
  // Tarjetas para el celular: una por fase nueva
  function cards(state, PL, TM, opt) {
    var ex = extras(state); if (!ex.length) return '';
    return ex.map(function (p) { return '<div class="gh-card" style="margin-top:1rem;padding:.9rem;border-radius:14px;background:var(--surface,rgba(255,255,255,.04));border:1px solid var(--border2,rgba(255,255,255,.12))">' + html(p, state, PL, TM, opt) + '</div>'; }).join('');
  }
  root.FasesView = { extras: extras, rank: rank, progress: progress, html: html, cards: cards, pts: pts, names: names };
})(typeof window !== 'undefined' ? window : globalThis);
