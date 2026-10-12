/* BRVM Analyste Mobile bootstrap */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.error('SW:',e)));
}
(async()=>{
  try{
    const parts=await Promise.all(
      ['app.p1.js','app.p2.js'].map(p=>
        fetch(p+'?t='+Date.now(),{cache:'no-store'}).then(r=>{
          if(!r.ok)throw new Error('Impossible de charger '+p+' ('+r.status+')');
          return r.text();
        })
      )
    );
    (0,eval)(parts.join('\n'));
  }catch(e){
    console.error(e);
    const st=document.getElementById('liveStatus');
    if(st)st.textContent='Erreur de chargement — videz le cache (Ctrl+F5).';
  }
})();
