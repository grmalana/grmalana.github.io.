// Dark/light theme (remembers choice)
const root = document.documentElement, btn = document.getElementById('theme');
const saved = localStorage.getItem('theme');
if (saved) root.dataset.theme = saved;
btn.textContent = root.dataset.theme === 'light' ? '☀️' : '🌙';
btn.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  btn.textContent = next === 'light' ? '☀️' : '🌙';
});

// Reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

// Name outline in front of the photo: copy the name + clip it to the photo's shape
(function(){
  const photo=document.querySelector('.me'), layer=document.querySelector('.front-layer');
  const h1=document.querySelector('.title-fill'), line=document.querySelector('.title-line');
  if(!photo||!layer) return;
  // repeat the name 6x so it can scroll endlessly (both layers get the same text)
  const name=(h1&&h1.textContent.trim())||'';
  const rep=(name+'\u00A0\u00A0\u00A0\u00A0').repeat(6);
  if(h1){h1.setAttribute('aria-label',name);h1.textContent=rep;}
  if(line) line.textContent=rep;
  function sync(){
    const url='url("'+(photo.currentSrc||photo.src)+'")';
    layer.style.webkitMaskImage=url; layer.style.maskImage=url;
    layer.classList.add('ready');
  }
  if(photo.complete&&photo.naturalWidth) sync();
  photo.addEventListener('load',sync);
})();


// Work Gallery (3D coverflow): the picture under the cursor slides to the centre
document.querySelectorAll('.coverflow').forEach(cf=>{
  const slides=[...cf.querySelectorAll('.cf-slide')], n=slides.length;
  const stage=cf.querySelector('.cf-stage');
  const info=cf.querySelector('.cf-info'), t=info.querySelector('h3'), p=info.querySelector('p'), a=info.querySelector('a');
  const canHover=matchMedia('(hover:hover)').matches;   // false on phones/tablets
  const SPREAD=parseFloat(cf.dataset.spread)||1;       // wider spacing for tall (portrait) pictures
  const STEP=650;                                        // ms per slide while the cursor rests on a side picture
  let i=0, timer, first=true, mx=0, my=0;
  function render(){
    slides.forEach((s,k)=>{
      let d=(k-i+n)%n; if(d>n/2) d-=n;
      const ad=Math.abs(d), sg=Math.sign(d);
      const off=ad===0?0:(ad===1?54:84)*sg*SPREAD;              // how far from the centre (% of slide width)
      const rot=ad===0?0:(ad===1?24:34)*sg;              // tilt toward the centre
      const sc=1-ad*.17;
      s.style.transform='translateX(calc(-50% + '+off+'%)) rotateY('+rot+'deg) scale('+sc+')';
      s.style.opacity=ad>2?0:(ad===0?1:ad===1?.9:.5);
      s.style.filter='brightness('+(1-ad*.28)+') blur('+(ad>1?1.5:0)+'px)';
      s.style.zIndex=10-ad;
      s.style.pointerEvents=ad>2?'none':'auto';
    });
    const s=slides[i];
    const setInfo=()=>{t.textContent=s.dataset.title||'';p.textContent=s.dataset.desc||'';a.href=s.dataset.link||'#';info.style.opacity=1;};
    if(first){setInfo();first=false;} else {info.style.opacity=0;setTimeout(setInfo,220);}
  }
  function go(k){i=(k+n)%n;render();}
  function stop(){clearInterval(timer);timer=null;}
  // one step toward whichever picture is under the cursor (stops when it is the centre one)
  function follow(){
    const el=document.elementFromPoint(mx,my), s=el&&el.closest&&el.closest('.cf-slide');
    const k=s?slides.indexOf(s):-1; if(k<0||k===i) return;
    let d=(k-i+n)%n; if(d>n/2) d-=n;
    go(i+Math.sign(d));
  }
  if(canHover){
    stage.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
    stage.addEventListener('mouseenter',e=>{mx=e.clientX;my=e.clientY;stop();setTimeout(follow,150);timer=setInterval(follow,STEP);});
    stage.addEventListener('mouseleave',stop);
  } else {
    timer=setInterval(()=>go(i+1),4500);                 // phones: auto-slide
  }
  slides.forEach((s,k)=>s.addEventListener('click',()=>{if(k!==i)go(k);}));
  let x0=null;
  cf.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  cf.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;
    if(Math.abs(dx)>40)go(i+(dx<0?1:-1));x0=null;});
  document.addEventListener('keydown',e=>{
    const r=cf.getBoundingClientRect(); if(r.bottom<innerHeight*.35||r.top>innerHeight*.65)return;
    if(e.key==='ArrowRight')go(i+1); if(e.key==='ArrowLeft')go(i-1);
  });
  render();
});

// Typing effect for headings with class="typing" (starts when scrolled into view)
document.querySelectorAll('.typing').forEach(el=>{
  const text=el.textContent.trim();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.setAttribute('aria-label',text); el.textContent=''; el.classList.add('caret');
  new IntersectionObserver((es,o)=>{ if(!es[0].isIntersecting) return; o.disconnect();
    let k=0; const tick=()=>{ el.textContent=text.slice(0,++k); if(k<text.length) setTimeout(tick,85); }; tick();
  },{threshold:.4}).observe(el);
});

// About: stack of trait cards that cycles (click for the next one)
(function(){
  const box=document.querySelector('.traits'); if(!box) return;
  const cards=[...box.querySelectorAll('.trait')], n=cards.length; let i=0, timer;
  const pose=[ 'translate(0,0) rotate(-6deg)', 'translate(16px,-14px) rotate(5deg) scale(.96)', 'translate(30px,-26px) rotate(12deg) scale(.92)' ];
  function render(){
    cards.forEach((c,k)=>{
      const d=(k-i+n)%n;
      c.style.transform=d<3?pose[d]:pose[2];
      c.style.opacity=d===0?1:d===1?.75:d===2?.45:0;
      c.style.zIndex=10-d;
    });
  }
  function next(){i=(i+1)%n;render();}
  function start(){clearInterval(timer);timer=setInterval(next,2600);}
  box.addEventListener('click',()=>{next();start();});
  render(); start();
})();

// Awards: 3D tilt + cursor spotlight (desktop only)
(function(){
  const cards=document.querySelectorAll('.award-card');
  const canTilt=matchMedia('(hover:hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!canTilt) return;
  cards.forEach(c=>{
    c.addEventListener('pointermove',e=>{
      const r=c.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(x*100)+'%');
      c.style.setProperty('--my',(y*100)+'%');
      c.style.transform='perspective(900px) rotateX('+((.5-y)*8)+'deg) rotateY('+((x-.5)*10)+'deg) translateY(-6px)';
    });
    c.addEventListener('pointerleave',()=>{c.style.transform='';});
  });
})();

// Awards: count-up number
(function(){
  const el=document.querySelector('.award-count b'); if(!el) return;
  const target=+el.dataset.count;
  new IntersectionObserver((es,o)=>{
    if(!es[0].isIntersecting) return; o.disconnect();
    let n=0; const tick=()=>{ el.textContent=++n; if(n<target) setTimeout(tick,220); }; tick();
  },{threshold:.6}).observe(el);
})();

// Picture check for the galleries: try other common file endings, then show exactly which file is missing
document.querySelectorAll('.cf-slide img').forEach(img=>{
  const original=img.getAttribute('src')||''; const tries=['.jpeg','.png','.JPG','.PNG','.webp']; let k=0;
  function failed(){
    if(k<tries.length){ img.src=original.replace(/\.[A-Za-z0-9]+$/,tries[k++]); return; }
    const box=img.closest('.cf-slide'); box.classList.add('missing'); box.dataset.missing=original;
  }
  img.addEventListener('error',failed);
  if(img.complete&&img.naturalWidth===0&&original) failed();
});