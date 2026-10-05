/* Marcador de todos los equipos: el roster no depende de que llegue una carta. */
(function(root){
  const model={teams:[],players:[],fullNames:{},photos:{},last:null,bound:false};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function setRoster(data){
    const f=data&&data.f2||{};
    if(Array.isArray(f.teams))model.teams=f.teams.filter(Boolean);
    model.players=data?.f1?.players||[];model.fullNames=f.fullNames||{};render(model.last||{});
  }
  function avatar(name){
    const full=model.fullNames[name]||name;
    const nick=Object.keys(model.fullNames).find(n=>model.fullNames[n]===name)||name;
    const photo=model.photos[name]||model.photos[full]||model.photos[nick];
    return photo?'<img class="guess-team-photo" src="'+esc(photo)+'" alt="'+esc(name)+'">':'<span class="guess-team-photo guess-team-initial">'+esc(name.trim()[0]||'?')+'</span>';
  }
  function html(d){
    const g=d?.group||{},teams=model.teams.length?model.teams:(g.teams||[]);
    const scores=g.scores||{},queue=g.queue||[],turn=d?.phase==='playing_g'?queue[g.turn]:null;
    return teams.map(t=>{
      const names=String(t).split('/').map(n=>n.trim()).filter(Boolean);
      const score=Number.isFinite(scores[t])?scores[t]:t===d?.nameA?d.scoreA||0:t===d?.nameB?d.scoreB||0:0;
      return '<div class="part-gteam'+(turn?.team===t?' turn':'')+'"><div class="guess-team-photos">'+names.map(avatar).join('')+'</div><div class="part-gname">'+esc(names.join(' & '))+'</div><div class="part-gscore">'+score+'</div></div>';
    }).join('');
  }
  function render(d){
    model.last=d||{};
    const enabled=model.teams.length>0||!!d?.group;
    if(typeof document==='undefined')return;
    document.body.classList.toggle('guess-all-teams',enabled);
    // El marcador de dos equipos se usa solo para una partida manual sin roster.
    if(typeof MODE!=='undefined'&&MODE==='participant')document.body.classList.toggle('guess-group',enabled);
    const el=document.getElementById('p-gboard');if(el)el.innerHTML=enabled?html(d):'';
  }
  function bind(db){
    if(model.bound||!db)return;model.bound=true;
    db.ref('velada/fixture').on('value',s=>setRoster(s.val()),e=>console.warn('No se pudo leer el roster de Guess',e));
    (async()=>{
      if(!root.firebase.firestore){
        await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});
      }
      root.firebase.firestore().collection('ndj').doc('photos').onSnapshot(s=>{
        if(!s.exists)return;
        try{model.photos=JSON.parse(s.data().data||'{}');render(model.last||{});}catch(e){console.warn('Fotos de Guess inválidas',e);}
      });
    })().catch(e=>console.warn('No se pudieron cargar las fotos de Guess',e));
  }
  root.GuessTeams={setRoster,html,render,bind,setPhotos:photos=>{model.photos=photos||{};render(model.last||{});}};
})(typeof window==='undefined'?globalThis:window);
