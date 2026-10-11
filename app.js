/* BRVM Analyste Mobile bootstrap */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.error('SW:',e)));
}
(async()=>{
  for(const p of ['app.p1.js','app.p2.js']){
    const t=await (await fetch(p+'?t='+Date.now(),{cache:'no-store'})).text();
    (0,eval)(t);
  }
})().catch(e=>console.error(e));
