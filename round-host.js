/* Preserve fixture metadata when existing game code replaces buzzer state. */
(function(){
  window.attachRoundHost=function(ref,apply){
    let loaded=false, match=null;
    const tx=ref.transaction.bind(ref);
    ref.set=function(value,cb){
      const expected=match&&match.id;
      return tx(current=>{
        if(!loaded || (current&&current.fixture&&current.fixture.id)!==expected)return;
        if(match && (!match.active || !current?.fixture?.active))return;
        const next=Object.assign({},value);
        if(current&&current.fixture){next.fixture=current.fixture;next.names=current.fixture.names;}
        return next;
      },(err,committed,snap)=>{
        if(err && typeof showToast==='function')showToast('⚠️ No se pudo actualizar el juego: '+err.message);
        if(cb)cb(err,committed,snap);
      },false);
    };
    ref.on('value',snap=>{
      const next=(snap.val()||{}).fixture||null;
      const changed=(match&&match.id)!==(next&&next.id);
      match=next;loaded=true;
      apply(next,changed);
    });
    return ()=>match;
  };
  window.roundHostBanner=function(match,target){
    let el=document.getElementById('round-fixture-banner');
    if(!el){
      el=document.createElement('div');el.id='round-fixture-banner';
      el.style.cssText='padding:14px;margin:10px 0;border:1px solid rgba(200,240,96,.35);border-radius:14px;background:rgba(200,240,96,.07);color:var(--accent,#c8f060);text-align:center;font:700 14px/1.5 sans-serif;overflow-wrap:anywhere';
      const anchor=document.querySelector(target);if(anchor)anchor.before(el);else document.body.prepend(el);
    }
    el.textContent=BuzzerRounds.caption(match);
    return el;
  };
})();
