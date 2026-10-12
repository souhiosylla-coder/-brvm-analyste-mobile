/* tech charts addon */
if(typeof priceHistory==='undefined'){var priceHistory=(function(){try{return JSON.parse(localStorage.getItem('brvm_price_history'))||{};}catch(e){return {};}})();}
async function loadHistory(){
  try{
    const r=await fetch('history.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('h');
    const data=await r.json();
    const remote=data.history||{};
    Object.keys(remote).forEach(sym=>{
      const map={};
      (priceHistory[sym]||[]).forEach(b=>{if(b&&b.date)map[b.date]=b.close;});
      (remote[sym]||[]).forEach(b=>{if(b&&b.date&&b.close>0)map[b.date]=b.close;});
      priceHistory[sym]=Object.keys(map).sort().map(d=>({date:d,close:map[d]}));
    });
    try{localStorage.setItem('brvm_price_history',JSON.stringify(priceHistory));}catch(e){}
  }catch(e){console.error('history',e);}
}
function closesOf(sym){
  const bars=priceHistory[sym]||[];
  return bars.map(b=>b.close).filter(x=>Number.isFinite(x)&&x>0);
}
function applyTechSymbol(sym){
  sym=(sym||'').toUpperCase().trim();
  if(!sym)return;
  const el=document.getElementById('tSymbol');
  if(el)el.value=sym;
  const sel=document.getElementById('tSelect');
  if(sel)sel.value=sym;
  let closes=closesOf(sym);
  if(closes.length<1&&typeof quotes!=='undefined'&&quotes[sym]&&quotes[sym].price>0)closes=[Number(quotes[sym].price)];
  const ta=document.getElementById('tPrices');
  if(ta)ta.value=closes.join(', ');
  const info=document.getElementById('techHistInfo');
  if(info){
    const n=closes.length;
    info.textContent=n>=5?(sym+' \u00b7 '+n+' s\u00e9ances \u00b7 graphiques auto'):(sym+' \u00b7 historique insuffisant ('+n+' pt). S\'enrichit chaque s\u00e9ance.');
  }
  if(closes.length>=5 && typeof calcTechnical==='function')calcTechnical();
  else{
    const c=document.getElementById('technicalComment');
    if(c){c.textContent='Historique trop court pour RSI/MACD (min. 5 cl\u00f4tures). Titres avec s\u00e9ries longues : BBGC, SNTS, ORAC, ETIT, BOAC, CBIBF.';c.classList.remove('hidden');}
  }
}
function fillTechSelect(){
  const sel=document.getElementById('tSelect');
  if(!sel||typeof companies==='undefined')return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Choisir une action\u2026</option>';
  companies.forEach(c=>{
    const n=(priceHistory[c[0]]||[]).length;
    sel.add(new Option(c[0]+' \u2014 '+c[1]+(n?(' ('+n+')'):''),c[0]));
  });
  if(cur)sel.value=cur;
}
(function(){
  function go(){
    if(typeof loadHistory==='function'){
      loadHistory().then(function(){
        if(typeof fillTechSelect==='function')fillTechSelect();
      });
    }
  }
  if(document.readyState==='complete')setTimeout(go,500);
  else window.addEventListener('load',function(){setTimeout(go,500);});
})();
