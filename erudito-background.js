(function initNumRain(){
  const container = document.getElementById('num-rain');
  if(!container) return;
  const NUMS = [];
  // genera "cifras" variadas con onda numérica/aproximación
  const samples = ['206','7,4','1.927','42','3,14','99','12.500','365','1.000.000','2026','88','0,5','451','321','9.000','64','10⁹','÷','%','≈','150','2.500','37°','100','50/50','π','√','1.609','60','24','4K','180°','f1.8','ISO','215','290','70'];
  for(let i=0;i<80;i++) NUMS.push(samples[i % samples.length]);
  const COLORS = ['rgba(255,95,95,IDX)','rgba(245,200,66,IDX)','rgba(96,180,240,IDX)','rgba(240,239,232,IDX)'];
  function randColor(o){ return COLORS[Math.floor(Math.random()*COLORS.length)].replace('IDX', o.toFixed(2)); }
  function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  const COL_W=92, ROW_H=34;
  const cols = Math.ceil(window.innerWidth/COL_W)+1;
  const visRows = Math.ceil(window.innerHeight/ROW_H)+4;
  const halfRows = visRows+3;
  const colEls=[], colData=[];
  let pool = shuffle(NUMS), pi=0;

  for(let c=0;c<cols;c++){
    const x=c*COL_W, dir=c%2===0?1:-1, speed=0.25+(c%5)*0.055;
    const col=document.createElement('div'); col.className='nrain-col'; col.style.left=x+'px'; col.style.width=COL_W+'px';
    const colWords=[];
    for(let r=0;r<halfRows;r++){ colWords.push(pool[pi%pool.length]); pi++; }
    for(let half=0;half<2;half++){
      for(let r=0;r<halfRows;r++){
        const span=document.createElement('span'); span.className='nrain-word'; span.textContent=colWords[r];
        const sz=10+Math.floor(Math.random()*7), op=0.08+Math.random()*0.30;
        span.style.fontSize=sz+'px'; span.style.color=randColor(op);
        col.appendChild(span);
        setTimeout(()=>span.classList.add('vis'), 100+Math.random()*600);
      }
    }
    const loopH=halfRows*ROW_H, stagger=-(Math.random()*loopH), startY=dir===1?stagger:stagger-loopH;
    col.style.transform=`translateY(${startY}px)`;
    container.appendChild(col); colEls.push(col); colData.push({y:startY,dir,speed,loopH});
  }
  let last=null;
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) last=null; });
  function tick(ts){
    if(!last){ last=ts; requestAnimationFrame(tick); return; }
    const dt=Math.min(ts-last,32); last=ts;
    for(let c=0;c<cols;c++){
      const d=colData[c]; d.y+=d.dir*d.speed*dt*0.05;
      if(d.dir===1 && d.y>=0) d.y-=d.loopH;
      else if(d.dir===-1 && d.y<=-d.loopH) d.y+=d.loopH;
      colEls[c].style.transform=`translateY(${d.y}px)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
