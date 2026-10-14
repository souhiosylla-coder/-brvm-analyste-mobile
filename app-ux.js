/* BRVM UX v4 — fiche, watchlist, alertes, comparateur secteur */
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
    if(typeof window.__brvmActivateTab==='function') window.__brvmActivateTab('sheet');
    else { const btn=document.querySelector('[data-tab="sheet"]'); if(btn) btn.click(); }
    renderSheet(sym);
  };

  function sheetFmt(n,d){
    if(n==null||n===''||Number.isNaN(Number(n))) return '\u2014';
    d=d==null?2:d;
    return Number(n).toLocaleString('fr-FR',{maximumFractionDigits:d,minimumFractionDigits:0});
  }
  function sheetMoney(n){
    if(n==null||Number.isNaN(Number(n))) return '\u2014';
    const v=Number(n);
    if(Math.abs(v)>=1e9) return sheetFmt(v/1e9,2)+' Mds';
    if(Math.abs(v)>=1e6) return sheetFmt(v/1e6,1)+' M';
    return sheetFmt(v,0);
  }
  function sheetMetric(label, value, hint){
    return `<div class="metric"><span>${label}</span><strong>${value}</strong>${hint?`<span style="font-size:.7rem;opacity:.75">${hint}</span>`:''}</div>`;
  }
  function sheetMissingBanner(f,q){
    const miss=[];
    if(!q||q.price==null) miss.push('cours');
    if(f.eps==null&&f.per_ref==null) miss.push('BPA / PER');
    if(f.dividend==null&&f.yield_ref==null) miss.push('dividende');
    if(f.book==null&&f.pb==null) miss.push('book / P/B');
    if(f.revenueNew==null&&!f.real_ca) miss.push('chiffre d\'affaires');
    if(f.profitNew==null) miss.push('r\u00e9sultat net');
    if(f.debt==null&&f.total_liabilities==null) miss.push('dettes');
    if(f.equity==null) miss.push('capitaux propres');
    if(!miss.length) return '';
    return `<div class="notice" style="margin-top:10px;background:rgba(234,179,8,.12);border-color:rgba(234,179,8,.35)">
      <b>Donn\u00e9es manquantes :</b> ${miss.join(', ')}. Les ratios concern\u00e9s affichent \u00ab \u2014 \u00bb.
    </div>`;
  }

  window.renderSheet=function(sym){
    sym=(sym||window._sheetSym||'').toUpperCase();
    const box=document.getElementById('sheetBody');
    if(!box||!sym)return;
    const q=(typeof quotes!=='undefined'&&quotes[sym])||null;
    const f=((typeof fundamentals!=='undefined'&&fundamentals[sym])||{});
    const name=nameOf(sym);
    const sector=sectorOf(sym);
    const star=isWatched(sym)?'\u2605 Retirer':'\u2606 Favori';
    const price=q&&q.price!=null?Number(q.price):null;
    const varp=q&&q.variation_pct!=null?Number(q.variation_pct):null;
    const vCls=varp>0?'up':(varp<0?'down':'flat');
    const vTxt=varp==null?'\u2014':((varp>0?'+':'')+sheetFmt(varp,2)+'%');
    const per=(price!=null&&f.eps>0)?(price/f.eps):(f.per_ref!=null?f.per_ref:null);
    const dy=(price!=null&&f.dividend!=null&&price>0)?(100*f.dividend/price):(f.yield_ref!=null?f.yield_ref:null);
    const pb=(price!=null&&f.book>0)?(price/f.book):(f.pb!=null?f.pb:null);
    const roe=f.roe!=null?f.roe:((f.profitNew!=null&&f.equity>0)?(100*f.profitNew/f.equity):null);
    const debt=f.debt!=null?f.debt:f.total_liabilities;
    const de=(debt!=null&&f.equity>0)?(debt/f.equity):null;
    let histN=0;
    try{
      if(typeof priceHistory!=='undefined'&&priceHistory[sym]) histN=(priceHistory[sym]||[]).length;
      else if(typeof closesOf==='function') histN=(closesOf(sym)||[]).length;
    }catch(e){}
    const src=f.source||'Sources : BloomAfrik / cotations diff\u00e9r\u00e9es BRVM';
    const seance=(typeof quotesMeta!=='undefined'&&quotesMeta&&quotesMeta.retrieved_on)||(q&&q.date)||'\u2014';
    box.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
        <div>
          <h2 style="margin:0 0 2px;font-size:1.15rem">${sym}</h2>
          <p style="margin:0;font-size:.92rem">${name}</p>
          <p class="muted" style="margin:2px 0 0">${sector}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.25rem;font-weight:700">${price!=null?sheetFmt(price,0)+' <span style="font-size:.75rem;font-weight:500">FCFA</span>':'\u2014'}</div>
          <div class="quote-var ${vCls}" style="font-size:.95rem">${vTxt}</div>
          <div class="muted" style="font-size:.72rem">S\u00e9ance ${seance}</div>
        </div>
      </div>
      ${sheetMissingBanner(f,q)}
      <p class="muted" style="margin:14px 0 6px;font-weight:600;color:var(--text)">Valorisation</p>
      <div class="row">
        ${sheetMetric('PER', per!=null?sheetFmt(per,2)+'x':'\u2014', f.eps!=null?'via BPA':'r\u00e9f. march\u00e9')}
        ${sheetMetric('Rendement', dy!=null?sheetFmt(dy,2)+'%':'\u2014', f.dividend!=null?'div./cours':'r\u00e9f. march\u00e9')}
      </div>
      <div class="row" style="margin-top:8px">
        ${sheetMetric('P/B', pb!=null?sheetFmt(pb,2)+'x':'\u2014', f.book!=null?'cours/book':'r\u00e9f.')}
        ${sheetMetric('ROE', roe!=null?sheetFmt(roe,2)+'%':'\u2014', 'r\u00e9sultat / CP')}
      </div>
      <p class="muted" style="margin:14px 0 6px;font-weight:600;color:var(--text)">Donn\u00e9es par action</p>
      <div class="row">
        ${sheetMetric('BPA', f.eps!=null?sheetFmt(f.eps,2):'\u2014','FCFA')}
        ${sheetMetric('Dividende', f.dividend!=null?sheetFmt(f.dividend,2):'\u2014','FCFA')}
      </div>
      <div class="row" style="margin-top:8px">
        ${sheetMetric('Book value', f.book!=null?sheetFmt(f.book,2):'\u2014','FCFA')}
        ${sheetMetric('Capitalisation', f.market_cap_mds!=null?sheetFmt(f.market_cap_mds,1)+' Mds':'\u2014','FCFA')}
      </div>
      <p class="muted" style="margin:14px 0 6px;font-weight:600;color:var(--text)">Comptes (si disponibles)</p>
      <div class="row">
        ${sheetMetric('CA / PNB N', sheetMoney(f.revenueNew), f.real_ca?'source officielle':'')}
        ${sheetMetric('R\u00e9sultat net N', sheetMoney(f.profitNew),'')}
      </div>
      <div class="row" style="margin-top:8px">
        ${sheetMetric('CA N-1', sheetMoney(f.revenueOld),'')}
        ${sheetMetric('R\u00e9sultat N-1', sheetMoney(f.profitOld),'')}
      </div>
      <div class="row" style="margin-top:8px">
        ${sheetMetric('Dettes', sheetMoney(debt),'')}
        ${sheetMetric('Capitaux propres', sheetMoney(f.equity),'')}
      </div>
      <div class="row" style="margin-top:8px">
        ${sheetMetric('D/E', de!=null?sheetFmt(de,2)+'x':'\u2014','dettes/CP')}
        ${sheetMetric('Croissance (r\u00e9f.)', f.growth!=null?sheetFmt(f.growth,1)+'%':'\u2014','valo')}
      </div>
      <p class="muted" style="margin:14px 0 6px;font-weight:600;color:var(--text)">Tendance (${histN} point${histN>1?'s':''})</p>
      <div class="chart-wrap" style="height:200px"><canvas id="sheetChart"></canvas></div>
      <p class="muted" style="font-size:.72rem;margin-top:-6px">${histN<5?'Historique court \u2014 indicateurs techniques limit\u00e9s.':'Historique suffisant pour une lecture technique de base.'}</p>
      <div class="actions" style="margin-top:12px">
        <button type="button" onclick="analyzeSymbol('${sym}')">Fondamental</button>
        <button type="button" class="secondary" onclick="analyzeSymbol('${sym}',{tab:'technical'})">Technique</button>
        <button type="button" class="secondary" onclick="toggleWatch('${sym}');renderSheet('${sym}')">${star}</button>
        <button type="button" class="secondary" onclick="document.getElementById('pSymbol').value='${sym}';if(window.__brvmActivateTab)__brvmActivateTab('portfolio');else document.querySelector('[data-tab=portfolio]').click()">Portefeuille</button>
      </div>
      <div class="notice" style="margin-top:14px;font-size:.78rem">
        <b>Sources & limites</b><br>${src}<br>
        Cotations diff\u00e9r\u00e9es (pas du temps r\u00e9el). Ratios calcul\u00e9s localement.
        Les scores et ratios sont <b>indicatifs</b> et ne constituent pas un conseil d'investissement.
      </div>
    `;
    setTimeout(function(){
      try{
        let closes=[];
        if(typeof priceHistory!=='undefined' && priceHistory[sym])
          closes=(priceHistory[sym]||[]).map(b=>Number(b.close||b)).filter(x=>x>0);
        if(closes.length<2 && typeof closesOf==='function')
          closes=(closesOf(sym)||[]).map(Number).filter(x=>x>0);
        if(closes.length<2 && price!=null) closes=[price];
        const canvas=document.getElementById('sheetChart');
        if(!canvas||typeof Chart==='undefined')return;
        if(window._sheetChart){try{window._sheetChart.destroy();}catch(e){}}
        if(closes.length<2){
          canvas.parentElement.innerHTML='<p class="muted">Pas assez de points pour un graphique.</p>';
          return;
        }
        const up=closes[closes.length-1]>=closes[0];
        window._sheetChart=new Chart(canvas,{
          type:'line',
          data:{labels:closes.map((_,i)=>i+1),datasets:[{label:sym,data:closes,borderColor:up?'#22c55e':'#ef4444',backgroundColor:up?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)',fill:true,tension:.25,pointRadius:closes.length>20?0:2.5,borderWidth:2}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+sheetFmt(ctx.raw,0)+' FCFA'}}},scales:{x:{display:false,grid:{display:false}},y:{ticks:{callback:v=>sheetFmt(v,0),font:{size:10}},grid:{color:'rgba(255,255,255,.06)'}}}}
        });
      }catch(e){console.error('sheetChart',e);}
    },180);
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
      if(window.__brvmActivateTab) window.__brvmActivateTab('technical');
      else document.querySelector('[data-tab="technical"]')?.click();
      setTimeout(()=>{if(typeof applyTechSymbol==='function')applyTechSymbol(s);},80);
    } else {
      if(window.__brvmActivateTab) window.__brvmActivateTab('fundamental');
      else document.querySelector('[data-tab="fundamental"]')?.click();
      setTimeout(()=>{if(typeof calcFundamental==='function')calcFundamental();},50);
    }
  };

  window.compareBySector=function(){
    try{
      const s1=(document.getElementById('c1')||{}).value||'';
      const base=s1||(window._sheetSym||'');
      if(!base||typeof companies==='undefined'){alert('Choisissez d\u2019abord le titre 1 (ou ouvrez une fiche).');return;}
      const sec=(companies.find(c=>c[0]===base)||[])[2];
      if(!sec){alert('Secteur inconnu pour '+base);return;}
      const peers=companies.filter(c=>c[2]===sec).map(c=>c[0]);
      const pick=[base].concat(peers.filter(x=>x!==base)).slice(0,4);
      ['c1','c2','c3','c4'].forEach((id,i)=>{const el=document.getElementById(id);if(el) el.value=pick[i]||'';});
      if(typeof runCompare==='function') runCompare();
    }catch(e){console.error(e);}
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
