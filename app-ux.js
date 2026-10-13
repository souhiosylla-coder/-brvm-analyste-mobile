/* BRVM UX v2 — fiche, watchlist, alertes, marché Fund/Tech */
(function(){
  const WKEY='brvm_watchlist', AKEY='brvm_alert_threshold';
  function getW(){try{return JSON.parse(localStorage.getItem(WKEY))||[];}catch(e){return [];}}
  function setW(a){localStorage.setItem(WKEY,JSON.stringify(a));}
  function alertTh(){const v=Number(localStorage.getItem(AKEY));return Number.isFinite(v)&&v>0?v:5;}
  function nameOf(sym){const c=(typeof companies!=='undefined'?companies:[]).find(x=>x[0]===sym);return c?c[1]:sym;}
  function sectorOf(sym){const c=(typeof companies!=='undefined'?companies:[]).find(x=>x[0]===sym);return c?c[2]:'\u2014';}
  function fnum(n){return typeof fmt==='function'?fmt(n):Number(n).toLocaleString('fr-FR');}

  window.toggleWatch=function(sym){
    sym=(sym||'').toUpperCase();
    let w=getW();
    if(w.includes(sym)) w=w.filter(x=>x!==sym); else w.push(sym);
    setW(w);
    if(typeof renderWatchlist==='function') renderWatchlist();
    if(typeof renderCompanies==='function') renderCompanies();
    if(typeof renderSheet==='function' && window._sheetSym===sym) renderSheet(sym);
  };
  window.isWatched=function(sym){return getW().includes((sym||'').toUpperCase());};
  window.renderWatchlist=function(){
    const box=document.getElementById('watchList');
    if(!box)return;
    const w=getW();
    if(!w.length){box.innerHTML='<p class="muted">Aucun favori. Touchez \u2605 sur un titre pour l\u2019ajouter.</p>';return;}
    box.innerHTML=w.map(sym=>{
      const q=quotes&&quotes[sym];
      const v=q&&q.variation_pct;
      const vCls=v>0?'up':(v<0?'down':'flat');
      const vTxt=v==null?'\u2014':((v>0?'+':'')+fnum(v)+'%');
      return `<div class="quote-row" style="cursor:pointer" onclick="openSheet('${sym}')">
        <span class="quote-sym">${sym}</span>
        <span class="quote-name">${nameOf(sym)}</span>
        <span class="quote-price">${q?fnum(q.price):'\u2014'}</span>
        <span class="quote-var ${vCls}">${vTxt}</span>
      </div>`;
    }).join('');
  };

  window.renderAlerts=function(){
    const box=document.getElementById('alertList');
    const thEl=document.getElementById('alertThreshold');
    if(thEl&&!thEl._bound){
      thEl.value=alertTh();
      thEl.addEventListener('change',()=>{localStorage.setItem(AKEY,String(Number(thEl.value)||5));renderAlerts();});
      thEl._bound=true;
    }
    if(!box||typeof quotes==='undefined')return;
    const th=alertTh();
    const hits=Object.keys(quotes).map(sym=>({sym,v:quotes[sym].variation_pct,p:quotes[sym].price}))
      .filter(x=>x.v!=null&&Math.abs(Number(x.v))>=th)
      .sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
    if(!hits.length){box.innerHTML='<p class="muted">Aucune variation \u2265 '+th+' % sur la s\u00e9ance affich\u00e9e.</p>';return;}
    box.innerHTML=hits.map(x=>{
      const vCls=x.v>0?'up':'down';
      return `<div class="quote-row" style="cursor:pointer" onclick="openSheet('${x.sym}')">
        <span class="quote-sym">${x.sym}</span>
        <span class="quote-name">${nameOf(x.sym)}</span>
        <span class="quote-price">${fnum(x.p)}</span>
        <span class="quote-var ${vCls}">${x.v>0?'+':''}${fnum(x.v)}%</span>
      </div>`;
    }).join('');
  };

  function moversList(items){
    if(!items.length) return '<p class="muted">Aucune variation.</p>';
    return items.map(q=>{
      const v=q.variation_pct, sign=v>0?'+':'', vCls=v>0?'up':(v<0?'down':'flat');
      return `<div class="quote-row" style="cursor:pointer;padding:8px 0" onclick="openSheet('${q.symbol}')">
        <span class="quote-sym">${q.symbol}</span>
        <span class="quote-name">${nameOf(q.symbol)}</span>
        <span class="quote-price">${fnum(q.price)}</span>
        <span class="quote-var ${vCls}">${sign}${fnum(v)}%</span>
      </div>`;
    }).join('');
  }
  window.renderMovers=function(){
    const g=document.getElementById('topGainers'), l=document.getElementById('topLosers');
    if(!g||!l||typeof quotes==='undefined')return;
    const arr=Object.keys(quotes).map(sym=>({symbol:sym,price:Number(quotes[sym].price),variation_pct:quotes[sym].variation_pct==null?null:Number(quotes[sym].variation_pct)}))
      .filter(x=>x.price>0&&x.variation_pct!=null&&!Number.isNaN(x.variation_pct));
    const sorted=[...arr].sort((a,b)=>b.variation_pct-a.variation_pct);
    g.innerHTML=moversList(sorted.filter(x=>x.variation_pct>0).slice(0,5));
    l.innerHTML=moversList(sorted.filter(x=>x.variation_pct<0).slice(-5).reverse());
  };

  window.renderCompanies=function(){
    const cc=document.getElementById('companyCount'); if(cc) cc.textContent=String(companies.length);
    const qc=Object.keys(quotes||{}).filter(k=>quotes[k]&&Number(quotes[k].price)>0).length;
    const qe=document.getElementById('quoteCount'); if(qe) qe.textContent=String(qc);
    let sf=document.getElementById('sectorFilter');
    if(sf&&sf.options.length===1){ [...new Set(companies.map(c=>c[2]))].sort().forEach(s=>sf.add(new Option(s,s))); }
    const q=(document.getElementById('companySearch')?.value||'').toLowerCase();
    const sec=sf?sf.value:'';
    let list=companies.filter(c=>(!sec||c[2]===sec)&&c.join(' ').toLowerCase().includes(q));
    list.sort((a,b)=>{
      const va=quotes[a[0]]?.variation_pct, vb=quotes[b[0]]?.variation_pct;
      if(va==null&&vb==null)return 0; if(va==null)return 1; if(vb==null)return -1; return vb-va;
    });
    const el=document.getElementById('companyList');
    if(!el)return;
    el.innerHTML=list.map(c=>{
      const qot=quotes[c[0]];
      const price=qot?fnum(qot.price):'\u2014';
      const v=qot?.variation_pct;
      let vCls='flat',vTxt='\u2014';
      if(v!=null&&!Number.isNaN(v)){vCls=v>0?'up':(v<0?'down':'flat');vTxt=(v>0?'+':'')+fnum(v)+'%';}
      const star=isWatched(c[0])?'\u2605':'\u2606';
      return `<div style="border-bottom:1px solid rgba(255,255,255,.06);padding:10px 0">
        <div class="quote-row" style="border:0;padding:0;cursor:pointer" onclick="openSheet('${c[0]}')">
          <span class="quote-sym">${c[0]}</span>
          <span class="quote-name">${c[1]}</span>
          <span class="quote-price">${price}</span>
          <span class="quote-var ${vCls}">${vTxt}</span>
        </div>
        <div class="actions" style="margin-top:6px;gap:6px">
          <button type="button" class="secondary" style="padding:6px 10px;font-size:.78rem" onclick="event.stopPropagation();openSheet('${c[0]}')">Fiche</button>
          <button type="button" class="secondary" style="padding:6px 10px;font-size:.78rem" onclick="event.stopPropagation();analyzeSymbol('${c[0]}')">Fond.</button>
          <button type="button" class="secondary" style="padding:6px 10px;font-size:.78rem" onclick="event.stopPropagation();analyzeSymbol('${c[0]}',{tab:'technical'})">Tech.</button>
          <button type="button" class="secondary" style="padding:6px 10px;font-size:.78rem" onclick="event.stopPropagation();toggleWatch('${c[0]}')">${star}</button>
        </div>
      </div>`;
    }).join('')||'<p class="muted">Aucun r\u00e9sultat.</p>';
    if(typeof renderMovers==='function') renderMovers();
    if(typeof renderWatchlist==='function') renderWatchlist();
    if(typeof renderAlerts==='function') renderAlerts();
  };

  window.openSheet=function(sym){
    sym=(sym||'').toUpperCase().trim();
    if(!sym)return;
    window._sheetSym=sym;
    const btn=document.querySelector('[data-tab="sheet"]');
    if(btn) btn.click();
    renderSheet(sym);
  };
  window.renderSheet=function(sym){
    sym=(sym||window._sheetSym||'').toUpperCase();
    const box=document.getElementById('sheetBody');
    if(!box||!sym)return;
    const q=quotes&&quotes[sym];
    const f=(fundamentals&&fundamentals[sym])||{};
    const v=q&&q.variation_pct;
    const vTxt=v==null?'\u2014':((v>0?'+':'')+fnum(v)+'%');
    const star=isWatched(sym)?'\u2605 Retirer':'\u2606 Favori';
    const per=q&&f.eps>0?(q.price/f.eps):f.per_ref;
    const dy=q&&f.dividend!=null?(100*f.dividend/q.price):f.yield_ref;
    const pb=q&&f.book>0?(q.price/f.book):f.pb;
    box.innerHTML=`
      <h2 style="margin:0 0 4px">${sym} \u2014 ${nameOf(sym)}</h2>
      <p class="muted" style="margin:0 0 10px">${sectorOf(sym)}</p>
      <div class="row">
        <div class="metric"><span>Cours</span><strong>${q?fnum(q.price)+' FCFA':'\u2014'}</strong></div>
        <div class="metric"><span>Variation</span><strong class="quote-var ${v>0?'up':(v<0?'down':'flat')}">${vTxt}</strong></div>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="metric"><span>PER</span><strong>${per!=null?fnum(per)+'x':'\u2014'}</strong></div>
        <div class="metric"><span>Rendement</span><strong>${dy!=null?fnum(dy)+'%':'\u2014'}</strong></div>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="metric"><span>P/B</span><strong>${pb!=null?fnum(pb)+'x':'\u2014'}</strong></div>
        <div class="metric"><span>ROE</span><strong>${f.roe!=null?fnum(f.roe)+'%':'\u2014'}</strong></div>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="metric"><span>BPA</span><strong>${f.eps!=null?fnum(f.eps):'\u2014'}</strong></div>
        <div class="metric"><span>Dividende</span><strong>${f.dividend!=null?fnum(f.dividend):'\u2014'}</strong></div>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="metric"><span>Capi. (Mds)</span><strong>${f.market_cap_mds!=null?f.market_cap_mds:'\u2014'}</strong></div>
        <div class="metric"><span>Book</span><strong>${f.book!=null?fnum(f.book):'\u2014'}</strong></div>
      </div>
      <p class="muted" style="margin-top:10px">${f.source||'Sources : BloomAfrik / cotations diff\u00e9r\u00e9es'}</p>
      <div class="actions">
        <button onclick="analyzeSymbol('${sym}')">Fondamental</button>
        <button class="secondary" onclick="analyzeSymbol('${sym}',{tab:'technical'})">Technique</button>
        <button class="secondary" onclick="toggleWatch('${sym}');renderSheet('${sym}')">${star}</button>
        <button class="secondary" onclick="document.getElementById('pSymbol').value='${sym}';document.querySelector('[data-tab=portfolio]').click()">Portefeuille</button>
      </div>
      <p class="muted" style="margin-top:12px">Graphique technique</p>
      <div class="chart-wrap" style="height:200px"><canvas id="sheetChart"></canvas></div>
    `;
    setTimeout(function(){
      try{
        let closes=[];
        if(typeof priceHistory!=='undefined' && priceHistory[sym]) closes=(priceHistory[sym]||[]).map(b=>b.close).filter(x=>x>0);
        if(closes.length<2 && typeof closesOf==='function') closes=closesOf(sym);
        if(closes.length<2 && q) closes=[q.price];
        if(typeof Chart==='undefined'||closes.length<2)return;
        const canvas=document.getElementById('sheetChart');
        if(!canvas)return;
        if(window._sheetChart) window._sheetChart.destroy();
        window._sheetChart=new Chart(canvas,{type:'line',data:{labels:closes.map((_,i)=>i+1),datasets:[{label:sym,data:closes,borderColor:'#3b82f6',tension:.2,pointRadius:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false}}}});
      }catch(e){console.error(e);}
    },200);
  };

  window.fillFundSelect=function(){
    const sel=document.getElementById('fSelect');
    if(!sel||typeof companies==='undefined')return;
    const cur=sel.value;
    sel.innerHTML='<option value="">Choisir une action\u2026</option>';
    companies.forEach(c=>{sel.add(new Option(c[0]+' \u2014 '+c[1],c[0]));});
    if(cur)sel.value=cur;
  };
  window.analyzeSymbol=function(s,opts){
    s=(s||'').toUpperCase().trim(); if(!s)return;
    opts=opts||{};
    ['fSymbol','tSymbol','pSymbol'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=s;});
    const fSel=document.getElementById('fSelect'); if(fSel) fSel.value=s;
    const tSel=document.getElementById('tSelect'); if(tSel) tSel.value=s;
    ['fPrice','fEPS','fDividend','fBook','fRevenueOld','fRevenueNew','fProfitOld','fProfitNew','fDebt','fEquity','fGrowth'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    if(quotes&&quotes[s]){const el=document.getElementById('fPrice');if(el)el.value=quotes[s].price;}
    const f=(fundamentals&&fundamentals[s])||{};
    const map={fEPS:f.eps,fDividend:f.dividend,fBook:f.book,fGrowth:f.growth,fRevenueOld:f.revenueOld,fRevenueNew:f.revenueNew,fProfitOld:f.profitOld,fProfitNew:f.profitNew,fDebt:f.debt!=null?f.debt:f.total_liabilities,fEquity:f.equity};
    Object.keys(map).forEach(id=>{if(map[id]!=null){const el=document.getElementById(id);if(el)el.value=map[id];}});
    if(opts.tab==='technical'){
      document.querySelector('[data-tab="technical"]')?.click();
      setTimeout(()=>{if(typeof applyTechSymbol==='function')applyTechSymbol(s);},80);
    } else {
      document.querySelector('[data-tab="fundamental"]')?.click();
      setTimeout(()=>{if(typeof calcFundamental==='function')calcFundamental();},50);
    }
  };

  function boot(){
    fillFundSelect();
    if(typeof fillTechSelect==='function') fillTechSelect();
    renderMovers(); renderWatchlist(); renderAlerts();
    if(typeof loadFundamentals==='function'){
      loadFundamentals().then(()=>{fillFundSelect();renderCompanies();});
    }
    if(typeof loadHistory==='function'){
      loadHistory().then(()=>{if(typeof fillTechSelect==='function')fillTechSelect();});
    }
  }
  if(document.readyState==='complete') setTimeout(boot,500);
  else window.addEventListener('load',()=>setTimeout(boot,500));
})();
