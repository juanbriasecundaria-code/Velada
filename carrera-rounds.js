/* Carrera de Mentes: lógica pura de la hoja (sin DOM ni red). */
(function(root){
  'use strict';
  const CATS=[
    {k:'C',n:'Celeste / Azul',s:'Historia y Geografía',e:'🌍',c:'#5ec8ff'},
    {k:'A',n:'Amarillo',s:'Naturaleza y Ciencia',e:'🔬',c:'#ffd23f'},
    {k:'M',n:'Marrón',s:'Artes',e:'🎨',c:'#c08a5e'},
    {k:'R',n:'Rosa',s:'Entretenimiento y Espectáculos',e:'🎬',c:'#ff7eb6'},
    {k:'V',n:'Verde',s:'Deportes y Juegos',e:'⚽',c:'#4cdb7a'}
  ];
  const fresh=(target,mins)=>({cells:CATS.map(()=>[0,0,0]),rival:0,target:target||3,mins:mins||0,endAt:null,hist:[],over:null});
  const crowns=cells=>cells.filter(r=>r.every(Boolean)).length;
  // Resultado desde el punto de vista del equipo de este celular.
  function evaluate(s,now){
    const own=crowns(s.cells), rv=s.rival;
    if(own>=s.target||rv>=s.target){
      const kind=own===rv?'draw':own>rv?'win':'lose';
      return {kind,reason:'coronas'};
    }
    if(s.endAt&&now>=s.endAt)return {kind:own===rv?'draw':own>rv?'win':'lose',reason:'tiempo'};
    return null;
  }
  function settle(s,now){ if(!s.over){const r=evaluate(s,now);if(r)s.over=r;} return s; }
  function toggle(s,r,i,now){
    if(s.over||!s.cells[r]||i<0||i>2)return s;
    s.cells[r][i]=s.cells[r][i]?0:1;s.hist.push({t:'c',r,i});
    return settle(s,now||Date.now());
  }
  function setRival(s,d,now){
    if(s.over)return s;
    const next=Math.max(0,Math.min(9,s.rival+d)); if(next===s.rival)return s;
    s.hist.push({t:'r',d:next-s.rival});s.rival=next;
    return settle(s,now||Date.now());
  }
  function undo(s){
    const h=s.hist.pop(); if(!h)return s;
    if(h.t==='c')s.cells[h.r][h.i]=s.cells[h.r][h.i]?0:1; else s.rival=Math.max(0,s.rival-h.d);
    s.over=null; return s; // deshacer reabre la partida
  }
  // Coronas del rival recibidas en vivo: reemplazan al contador manual.
  function applyRival(s,n,now){
    n=Math.max(0,Math.min(9,n|0)); if(n===s.rival)return s;
    s.rival=n; s.hist=s.hist.filter(h=>h.t!=='r'); s.over=null;
    return settle(s,now||Date.now());
  }
  function restart(s){ return fresh(s.target,s.mins); }
  root.CarreraLogic={CATS,fresh,crowns,evaluate,settle,toggle,setRival,applyRival,undo,restart};
  if(typeof module!=='undefined')module.exports=root.CarreraLogic;
})(typeof window==='undefined'?globalThis:window);
