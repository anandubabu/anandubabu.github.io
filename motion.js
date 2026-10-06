/* Motion layer for the portfolio — scroll reveals, hero motion graphics,
   the coverage simulation and small interaction details.
   Static file, no dependencies. Respects prefers-reduced-motion. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const animated=!still;
 if(animated)root.classList.add('motion');
 const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const EASE='cubic-bezier(.16,1,.3,1)';
 let epoch=0; // bumped on language switch so text effects never overwrite fresh copy

 /* ------------------------------------------------------------------
    Coverage simulation (thesis card)
    Three satellites sweep ground tracks across the grid; cells light up
    inside each footprint and fade until the next pass. Called from the
    shared render loop in index.html.
    ------------------------------------------------------------------ */
 {
  const COLS=15,ROWS=8,R=2.3,heat=new Float32Array(COLS*ROWS);
  const sats=[{off:0,amp:.3,ph:0,sp:1,color:'#a4c9fa'},{off:.37,amp:.34,ph:2.1,sp:.86,color:'#6be5d2'},{off:.71,amp:.26,ph:4.2,sp:1.12,color:'#a4c9fa'}];
  const at=(s,u)=>[-2.5+u*(COLS+5),(ROWS-1)/2+s.amp*ROWS*Math.sin(u*Math.PI*2.5+s.ph)];
  const where=(s,t)=>{let u=(t*.55*s.sp+s.off)%1;if(u<0)u+=1;return u};
  let last=null;
  const step=(t,dt)=>{
   const k=Math.exp(-dt*2.1);for(let i=0;i<heat.length;i++)heat[i]*=k;
   for(const s of sats){const [sx,sy]=at(s,where(s,t));
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const d=Math.hypot(c-sx,r-sy);if(d<R){const v=1-.55*(d/R)**2,i=r*COLS+c;if(v>heat[i])heat[i]=v}}}
  };
  window.drawCoverage=(x,w,h,t)=>{
   if(last===null){for(let i=130;i>0;i--)step(t-i*.02,.02);last=t}
   const dt=clamp(t-last,0,.06);last=t;if(dt)step(t,dt);
   const cell=Math.min(w/17,h/10),gx=(w-cell*COLS)/2,gy=(h-cell*ROWS)/2,gap=Math.max(2,cell*.16);
   for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const v=heat[r*COLS+c];x.fillStyle=`rgba(107,229,210,${(.07+v*.58).toFixed(3)})`;x.fillRect(gx+c*cell,gy+r*cell,cell-gap,cell-gap)}
   const px=(p)=>[gx+p[0]*cell+(cell-gap)/2,gy+p[1]*cell+(cell-gap)/2];
   x.save();x.beginPath();x.rect(gx-cell*.9,gy-cell*.7,cell*COLS+cell*1.8-gap,cell*ROWS+cell*1.4-gap);x.clip();
   for(const s of sats){
    x.strokeStyle=s.color+'3d';x.lineWidth=1;x.setLineDash([2,5]);x.beginPath();
    for(let j=0;j<=60;j++){const p=px(at(s,j/60));j?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])}x.stroke();x.setLineDash([]);
    const u=where(s,t),p=px(at(s,u));
    const g=x.createRadialGradient(p[0],p[1],0,p[0],p[1],R*cell);g.addColorStop(0,'rgba(107,229,210,.16)');g.addColorStop(1,'rgba(107,229,210,0)');
    x.fillStyle=g;x.beginPath();x.arc(p[0],p[1],R*cell,0,Math.PI*2);x.fill();
    x.strokeStyle=s.color+'8c';x.beginPath();x.arc(p[0],p[1],R*cell,0,Math.PI*2);x.stroke();
    x.fillStyle=s.color;x.shadowColor=s.color;x.shadowBlur=12;x.beginPath();x.arc(p[0],p[1],3,0,Math.PI*2);x.fill();x.shadowBlur=0;
   }
   x.restore();
   if(gx>=46){
    x.font='10px ui-monospace,monospace';x.fillStyle='#7f97a8';x.textAlign='right';x.textBaseline='middle';
    x.fillText('70°N',gx-12,gy+4);x.fillText('45°N',gx-12,gy+cell*ROWS-gap-4);
    x.strokeStyle='#3a5565';x.beginPath();x.moveTo(gx-6,gy);x.lineTo(gx-6,gy+cell*ROWS-gap);x.stroke();
    x.textAlign='left';
   }
  };
  if(still&&typeof render==='function')render(0);
 }

 /* ------------------------------------------------------------------
    Structure: progress bar, ticker, toolkit chips, timeline rail
    ------------------------------------------------------------------ */
 const nav=$('nav');
 if(nav){const bar=document.createElement('div');bar.className='scroll-progress';bar.setAttribute('aria-hidden','true');nav.append(bar)}

 const tagline=$('.tagline'),tagSpan=tagline&&$('span',tagline);
 if(animated&&tagSpan){
  const items=['PYTHON','MACHINE LEARNING','EMBEDDED AI','XGBOOST','PYTORCH','SIGNAL PROCESSING','FASTAPI','ONNX RUNTIME','DOCKER','ROS 2'];
  const set=items.map(t=>`<span>${t}</span><i>·</i>`).join('');
  tagSpan.className='ticker';tagSpan.setAttribute('aria-label',items.join(', '));
  tagSpan.innerHTML=`<span class="ticker-track" aria-hidden="true">${set}${set}</span>`;
 }

 $$('.skill p').forEach(p=>{
  const parts=p.textContent.split('·').map(s=>s.trim()).filter(Boolean);
  if(parts.length<2)return;
  p.className='chip-list';p.textContent='';
  for(const t of parts){const c=document.createElement('span');c.className='chip';c.textContent=t;p.append(c)}
 });

 const timeline=$('.timeline-item')?.parentElement;
 if(timeline){
  timeline.classList.add('timeline');
  const rail=document.createElement('i');rail.className='timeline-rail';rail.setAttribute('aria-hidden','true');timeline.append(rail);
  $('[data-t="present"]',timeline)?.closest('.timeline-item')?.classList.add('is-current');
  if(still)timeline.style.setProperty('--rail','1');
 }

 /* ------------------------------------------------------------------
    Scroll-linked values: progress, active nav link, rail, parallax
    ------------------------------------------------------------------ */
 const links=$$('.navlinks a').map(a=>({a,target:$(a.getAttribute('href'))})).filter(l=>l.target);
 const portraitImg=$('.portrait-frame img');
 let queued=false;
 const onScroll=()=>{
  queued=false;
  const y=scrollY,max=root.scrollHeight-innerHeight;
  nav?.style.setProperty('--scroll',max>0?clamp(y/max).toFixed(4):'0');
  let current=null;
  for(const l of links)if(l.target.getBoundingClientRect().top<=innerHeight*.42)current=l;
  if(max>0&&y>=max-4&&links.length)current=links[links.length-1];
  for(const l of links)l.a.classList.toggle('is-active',l===current);
  if(timeline&&animated){const r=timeline.getBoundingClientRect();timeline.style.setProperty('--rail',clamp((innerHeight*.66-r.top)/r.height).toFixed(4))}
  if(portraitImg&&animated)portraitImg.style.setProperty('--par',Math.min(y*.05,16).toFixed(1)+'px');
 };
 const requestScroll=()=>{if(!queued){queued=true;requestAnimationFrame(onScroll)}};
 addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll);onScroll();

 /* ------------------------------------------------------------------
    Pointer spotlight
    ------------------------------------------------------------------ */
 if(matchMedia('(pointer: fine)').matches)$$('.project,.contact').forEach(el=>el.addEventListener('pointermove',e=>{
  const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left).toFixed(0)+'px');el.style.setProperty('--my',(e.clientY-r.top).toFixed(0)+'px');
 }));

 /* ------------------------------------------------------------------
    Orbit rings around the portrait (front half passes over, back half
    behind the frame)
    ------------------------------------------------------------------ */
 const scene=$('.portrait-scene'),frame=scene&&$('.portrait-frame',scene);
 let orbitTick=null;
 if(frame){
  const NS='http://www.w3.org/2000/svg',TRAIL=9;
  const el=(n,p,at={})=>{const e=document.createElementNS(NS,n);for(const k in at)e.setAttribute(k,at[k]);p?.append(e);return e};
  const back=el('svg',null,{class:'orbit-ring orbit-back','aria-hidden':'true'}),front=el('svg',null,{class:'orbit-ring orbit-front','aria-hidden':'true'});
  scene.insertBefore(back,frame);frame.after(front);
  // Both orbits are centred on the base of the frame so the front arcs run below the portrait, never across the face
  const rings=[{rx:.585,ry:.092,rot:-8,drop:.012,color:'#6be5d2',speed:.36,phase:.9},{rx:.68,ry:.118,rot:6,drop:.0,color:'#a4c9fa',speed:-.23,phase:3.9}];
  for(const r of rings){
   r.layers=[back,front].map(svg=>{const g=el('g',svg,{color:r.color});const path=el('path',g,{stroke:r.color});const dots=Array.from({length:TRAIL},(_,i)=>el('circle',g,{fill:r.color,class:i?'':'head',opacity:0}));return{g,path,dots}});
  }
  const layout=()=>{
   const W=frame.offsetWidth,H=frame.offsetHeight,mid=scene.getBoundingClientRect().left+frame.offsetLeft+W/2,room=Math.min(mid,root.clientWidth-mid)-14; // keep the orbits inside the viewport
   for(const r of rings){
    r.RX=Math.min(W*r.rx,room);r.RY=W*r.ry*r.RX/(W*r.rx);
    const t=`translate(${frame.offsetLeft+W/2} ${frame.offsetTop+H+W*r.drop}) rotate(${r.rot})`;
    r.layers[0].g.setAttribute('transform',t);r.layers[1].g.setAttribute('transform',t);
    r.layers[0].path.setAttribute('d',`M${-r.RX} 0A${r.RX} ${r.RY} 0 0 1 ${r.RX} 0`);
    r.layers[1].path.setAttribute('d',`M${r.RX} 0A${r.RX} ${r.RY} 0 0 1 ${-r.RX} 0`);
   }
  };
  orbitTick=ms=>{
   for(const r of rings){
    const a=r.phase+ms/1000*r.speed,dir=Math.sign(r.speed);
    for(let i=0;i<TRAIL;i++){
     const ak=a-dir*i*.07,s=Math.sin(ak),inFront=s>=0,f=1-i/TRAIL;
     const on=r.layers[inFront?1:0].dots[i],off=r.layers[inFront?0:1].dots[i];
     on.setAttribute('cx',(r.RX*Math.cos(ak)).toFixed(1));on.setAttribute('cy',(r.RY*s).toFixed(1));
     on.setAttribute('r',i?(.5+1.5*f).toFixed(2):inFront?3.4:2.4);
     on.setAttribute('opacity',((i?f*f*.7:1)*(inFront?1:.4)).toFixed(2));off.setAttribute('opacity',0);
    }
   }
  };
  layout();orbitTick(0);
  const relayout=()=>{layout();if(still)orbitTick(0)};new ResizeObserver(relayout).observe(frame);addEventListener('resize',relayout);
 }

 /* ------------------------------------------------------------------
    Ambient dot field behind the hero — a slow travelling wave that also
    responds to the pointer
    ------------------------------------------------------------------ */
 let ambientTick=null;
 if(animated){
  const c=document.createElement('canvas');c.className='ambient';c.setAttribute('aria-hidden','true');document.body.prepend(c);
  const x=c.getContext('2d'),GAP=34;let w=0,h=0,d=1,px=-9999,py=-9999,tx=-9999,ty=-9999;
  const fit=()=>{d=Math.min(devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=Math.round(w*d);c.height=Math.round(h*d)};
  fit();addEventListener('resize',fit);
  addEventListener('pointermove',e=>{tx=e.pageX;ty=e.pageY;if(px<-9000){px=tx;py=ty}},{passive:true});
  ambientTick=ms=>{
   const t=ms/1000;px+=(tx-px)*.12;py+=(ty-py)*.12;
   x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);x.fillStyle='#8fd9d4';
   const ox=(w%GAP)/2,near=py<h+160;
   for(let gy=GAP/2;gy<h;gy+=GAP)for(let gx=ox;gx<w;gx+=GAP){
    const wave=(Math.sin(gx*.011+gy*.019-t*.8)+1)/2,band=wave**8;
    let glow=0;if(near){const dx=gx-px,dy=gy-py;glow=Math.exp(-(dx*dx+dy*dy)/26000)}
    const s=1+band*.8+glow*1.4;
    x.globalAlpha=Math.min(.07+band*.2+glow*.5,.75);x.fillRect(gx-s/2,gy-s/2,s,s);
   }
   x.globalAlpha=1;
  };
 }

 /* One loop for the hero graphics; paused when the hero is off screen */
 if(animated){
  const hero=$('.hero');let visible=true,raf=0;
  const loop=ms=>{raf=0;if(!visible||document.hidden)return;orbitTick?.(ms);ambientTick?.(ms);raf=requestAnimationFrame(loop)};
  const start=()=>{if(!raf)raf=requestAnimationFrame(loop)};
  if(hero)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)start()},{rootMargin:'120px'}).observe(hero);
  document.addEventListener('visibilitychange',start);start();
 }

 /* ------------------------------------------------------------------
    Text decode effect for the monospace eyebrows
    ------------------------------------------------------------------ */
 const GLYPHS='01<>/\\_=+*#';
 const decode=(el,delay=0,duration=750)=>{
  if(!animated||el.children.length)return;
  const final=el.textContent,mine=epoch,begin=performance.now()+delay;let lastDraw=0;
  const frame=now=>{
   if(mine!==epoch)return;
   if(now<begin||now-lastDraw<38){requestAnimationFrame(frame);return}
   lastDraw=now;
   const p=clamp((now-begin)/duration),n=Math.floor(p*final.length);let s=final.slice(0,n);
   for(let i=n;i<final.length;i++)s+=/\s/.test(final[i])?final[i]:GLYPHS[Math.random()*GLYPHS.length|0];
   el.textContent=s;if(p<1)requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 };

 /* ------------------------------------------------------------------
    Scroll reveals (Web Animations API — nothing is left behind on the
    element afterwards, so hover states keep working)
    ------------------------------------------------------------------ */
 const KEYS={
  up:[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],
  left:[{opacity:0,transform:'translateX(-18px)'},{opacity:1,transform:'translateX(0)'}],
  fade:[{opacity:0},{opacity:1}],
  pop:[{opacity:0,transform:'translateY(8px) scale(.92)'},{opacity:1,transform:'translateY(0) scale(1)'}],
  mask:[{clipPath:'inset(0 -4% 100% -4%)',transform:'translateY(.45em)'},{clipPath:'inset(-12% -4% -18% -4%)',transform:'translateY(0)'}]
 };
 const DUR={up:850,left:800,fade:900,pop:520,mask:1000};
 if(animated){
  const tag=(el,type='up',delay=0,opts={})=>{if(!el)return;el.dataset.reveal=type;el._d=delay;el._o=opts};
  const group=(els,type,base=0,gap=70)=>els.forEach((el,i)=>tag(el,type,base+i*gap));
  const heading=(scope,base=0)=>{
   const eb=$('.eyebrow',scope);tag(eb,'fade',base,{decode:true});
   tag($('h2',scope),'mask',base+90);
   $$('p',scope).forEach((p,i)=>tag(p,'up',base+220+i*90));
  };

  tag(tagline,'fade',0,{hold:true});
  const strip=$('.intelligence-strip');
  if(strip){heading($('.intelligence-copy',strip));$$('.mini-viz',strip).forEach((v,i)=>tag(v,'up',180+i*140,{hold:true}))}
  $$('.section-heading').forEach(s=>heading(s));
  $$('.project').forEach(p=>{tag(p,'up',0,{batch:true});group($$('.chip',p),'pop',260,55)});
  const about=$('.about');if(about)heading(about);
  $$('.timeline-item').forEach((t,i)=>tag(t,'left',i*130));
  $$('.skill').forEach((s,i)=>{s.dataset.enter='';s._d=i*120;tag($('h3',s),'up',150+i*120);group($$('.chip',s),'pop',280+i*120,45)});
  const contact=$('.contact');
  if(contact){heading(contact);tag($('.email',contact),'up',420);tag($('.socials',contact),'up',520)}
  tag($('footer'),'fade');

  const settle=1150; // let the hero finish before anything else on the first screen moves
  const io=new IntersectionObserver(entries=>{
   let n=0;
   for(const e of entries){
    if(!e.isIntersecting)continue;
    const el=e.target;io.unobserve(el);
    let delay=el._d||0;const o=el._o||{};
    if(o.batch)delay+=n++*110;
    if(o.hold)delay+=Math.max(0,settle-performance.now());
    if('enter' in el.dataset){setTimeout(()=>el.classList.add('is-in'),delay);continue}
    const type=el.dataset.reveal;
    el.classList.add('is-in');
    el.animate(KEYS[type]||KEYS.up,{duration:DUR[type]||850,delay,easing:EASE,fill:'backwards'});
    if(o.decode)decode(el,delay+60);
   }
  },{rootMargin:'0px 0px -7% 0px',threshold:.01});
  $$('[data-reveal],[data-enter]').forEach(el=>io.observe(el));

  decode($('.hero .eyebrow'),250,900);
 }

 /* ------------------------------------------------------------------
    Language switch: cross-fade instead of a hard swap
    ------------------------------------------------------------------ */
 if(typeof window.lang==='function'){
  const swap=window.lang;
  window.lang=l=>{
   epoch++;
   if(animated&&document.startViewTransition)document.startViewTransition(()=>swap(l));else swap(l);
  };
 }
})();
