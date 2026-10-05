/* Numeración estable de los equipos para las fotos publicadas en GitHub. */
(function (root) {
  'use strict';
  const clean = s => String(s || '').trim();
  // Este orden es el de la lista original de jugadores. Los números son
  // estables: no dependen del ranking ni del orden en que se elijan nombres.
  const roster = ['Risu','Totti','Thiago','Mica','Valentín','Laza','Lara','Martín','Cori','Flor','Tomás'];
  const fixed = [
    ['Martín','Valentín'], ['Laza','Tomás'], ['Thiago','Lara'],
    ['Totti','Risu'], ['Cori','Flor','Mica']
  ];
  const key = names => names.slice().sort((a, b) => roster.indexOf(a) - roster.indexOf(b)).join('|');
  const fixedPairs = new Set(fixed.filter(x => x.length === 2).map(key));
  function pair(name) {
    const parts = String(name || '').split('/').map(clean).filter(Boolean);
    if (parts.length !== 2 || parts[0] === parts[1]) return null;
    const indices = parts.map(p => roster.findIndex(n => n.toLocaleLowerCase('es') === p.toLocaleLowerCase('es')));
    if (indices.some(i => i < 0)) return null;
    return indices[0] < indices[1] ? [roster[indices[0]], roster[indices[1]]]
      : [roster[indices[1]], roster[indices[0]]];
  }
  function all() {
    const out = []; let number = 6;
    roster.forEach((a, i) => roster.slice(i + 1).forEach(b => {
      if (!fixedPairs.has(key([a, b]))) out.push({ names: [a, b], file: 'equipo' + number++ + '.jpg' });
    }));
    return out;
  }
  const byPair = new Map(all().map(x => [key(x.names), x.file]));
  function filename(names) {
    const pairNames = pair(names.join(' / '));
    if (!pairNames) return null;
    const fixedIdx = fixed.findIndex(x => x.length === 2 && key(x) === key(pairNames));
    return fixedIdx >= 0 ? 'equipo' + (fixedIdx + 1) + '.jpg' : byPair.get(key(pairNames)) || null;
  }
  function mapping() {
    return fixed.map((names, i) => ({ names, file: 'equipo' + (i + 1) + '.jpg' })).concat(all());
  }
  root.VeladaDuplas = { pair, all, mapping, filename };
})(window);
