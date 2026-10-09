/* The TV's existing state channels decide when to display the common TEG round.
   La TV abre TEG Express en modo «tv» (solo mirar): la partida la maneja la pantalla conductora. */
(function(){
 let frame=null;
 function sync(){
  try{
   const raw=window._tvCachedState||localStorage.getItem('ndj_state'),s=typeof raw==='string'?JSON.parse(raw):raw;
   const visible=s?.activeCommonRound?.id==='teg';
   if(visible&&!frame){frame=document.createElement('iframe');frame.src='teg_express.html?role=tv';frame.title='Mapa en vivo · TEG Express';frame.allow='fullscreen';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:700;background:#0a0a0e';document.body.append(frame);}
   if(frame)frame.hidden=!visible;
  }catch(e){}
 }
 window.addEventListener('storage',sync);window.addEventListener('message',sync);setInterval(sync,1000);sync();
})();
