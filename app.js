/* BRVM Analyste Mobile bootstrap */
(async()=>{
  const parts=['app.p1.js','app.p2.js'];
  for(const p of parts){
    const t=await (await fetch(p+'?t='+Date.now(),{cache:'no-store'})).text();
    (0,eval)(t);
  }
})().catch(e=>{console.error(e);document.body.insertAdjacentHTML('beforeend','<p style="color:red;padding:1rem">Erreur chargement app: '+e.message+'</p>');});
