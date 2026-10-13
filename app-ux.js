/* BRVM UX improvements v1 */
(function(){
  function nameOf(sym){
    const c = (typeof companies!=='undefined'?companies:[]).find(x=>x[0]===sym);
    return c?c[1]:sym;
  }
  function moversList(items){
    if(!items.length) return '<p class="muted">Aucune variation disponible.</p>';
    return items.map(q=>{
      const v=q.variation_pct;
      const sign=v>0?'+':'';
      const vCls=v>0?'up':(v<0?'down':'flat');
      return `<div class="quote-row" onclick="analyzeSymbol('${q.symbol}')" style="cursor:pointer;padding:8px 0">
        <span class="quote-sym">${q.symbol}</span>
        <span class="quote-name">${nameOf(q.symbol)}</span>
        <span class="quote-price">${typeof fmt==='function'?fmt(q.price):q.price}</span>
        <span class="quote-var ${vCls}">${sign}${typeof fmt==='function'?fmt(v):v}%</span>
      </div>`;
    }).join('');
  }
  window.renderMovers=function(){
    const g=document.getElementById('topGainers');
    const l=document.getElementById('topLosers');
    if(!g||!l||typeof quotes==='undefined')return;
    const arr=Object.keys(quotes).map(sym=>{
      return {
        symbol:sym,
        price:Number(quotes[sym].price),
        variation_pct:quotes[sym].variation_pct==null?null:Number(quotes[sym].variation_pct)
      };
    }).filter(x=>x.price>0 && x.variation_pct!=null && !Number.isNaN(x.variation_pct));
    const sorted=[...arr].sort((a,b)=>b.variation_pct-a.variation_pct);
    g.innerHTML=moversList(sorted.filter(x=>x.variation_pct>0).slice(0,5));
    l.innerHTML=moversList(sorted.filter(x=>x.variation_pct<0).slice(-5).reverse());
  };

  window.fillFundSelect=function(){
    const sel=document.getElementById('fSelect');
    if(!sel||typeof companies==='undefined')return;
    const cur=sel.value;
    sel.innerHTML='<option value="">Choisir une action\u2026</option>';
    companies.forEach(c=>{
      const has=fundamentals&&fundamentals[c[0]];
      sel.add(new Option(c[0]+' \u2014 '+c[1]+(has?'':' (donn\u00e9es limit\u00e9es)'), c[0]));
    });
    if(cur) sel.value=cur;
  };

  window.analyzeSymbol=function(s, opts){
    s=(s||'').toUpperCase().trim();
    if(!s) return;
    opts=opts||{};
    ['fSymbol','tSymbol','pSymbol'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=s;});
    const fSel=document.getElementById('fSelect'); if(fSel) fSel.value=s;
    const tSel=document.getElementById('tSelect'); if(tSel) tSel.value=s;

    ['fPrice','fEPS','fDividend','fBook','fRevenueOld','fRevenueNew','fProfitOld','fProfitNew','fDebt','fEquity','fGrowth'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });

    if(typeof quotes!=='undefined' && quotes[s]){
      const el=document.getElementById('fPrice');
      if(el) el.value=quotes[s].price;
    }
    const f=(typeof fundamentals!=='undefined'?fundamentals[s]:null)||{};
    const map={
      fEPS:f.eps, fDividend:f.dividend, fBook:f.book, fGrowth:f.growth,
      fRevenueOld:f.revenueOld, fRevenueNew:f.revenueNew,
      fProfitOld:f.profitOld, fProfitNew:f.profitNew,
      fDebt:f.debt!=null?f.debt:f.total_liabilities, fEquity:f.equity
    };
    Object.keys(map).forEach(id=>{
      if(map[id]!=null){ const el=document.getElementById(id); if(el) el.value=map[id]; }
    });

    let info=document.getElementById('fundAutoInfo');
    if(!info){
      info=document.createElement('p');
      info.id='fundAutoInfo';
      info.className='muted';
      const card=document.querySelector('#fundamental .card');
      const actions=card && card.querySelector('.actions');
      if(actions) actions.parentNode.insertBefore(info, actions);
    }
    if(info){
      const bits=[];
      if(f.per_ref!=null) bits.push('PER ref '+Number(f.per_ref).toFixed(2)+'x');
      if(f.yield_ref!=null) bits.push('Rdt '+Number(f.yield_ref).toFixed(2)+'%');
      if(f.market_cap_mds!=null) bits.push('Capi '+f.market_cap_mds+' Mds');
      if(f.roe!=null) bits.push('ROE '+Number(f.roe).toFixed(1)+'%');
      if(f.source) bits.push(f.source);
      info.textContent=bits.length? (s+' \u00b7 '+bits.join(' \u00b7 ')) : (s+' \u00b7 donn\u00e9es fondamentales partielles');
    }

    if(opts.tab==='technical'){
      const btn=document.querySelector('[data-tab="technical"]');
      if(btn) btn.click();
      setTimeout(function(){
        if(typeof applyTechSymbol==='function') applyTechSymbol(s);
      }, 80);
    } else {
      const btn=document.querySelector('[data-tab="fundamental"]');
      if(btn) btn.click();
      setTimeout(function(){
        if(typeof calcFundamental==='function') calcFundamental();
      }, 50);
    }
  };

  const _rc = typeof window.renderCompanies==='function' ? window.renderCompanies : null;
  if(_rc){
    window.renderCompanies=function(){
      _rc();
      if(typeof renderMovers==='function') renderMovers();
    };
  }

  function boot(){
    if(typeof fillFundSelect==='function') fillFundSelect();
    if(typeof fillTechSelect==='function') fillTechSelect();
    if(typeof renderMovers==='function') renderMovers();
    if(typeof loadFundamentals==='function'){
      loadFundamentals().then(function(){
        fillFundSelect();
        if(typeof fillCompareSelects==='function') fillCompareSelects();
        if(typeof renderDataQuality==='function') renderDataQuality();
        if(typeof renderMovers==='function') renderMovers();
      });
    }
  }
  if(document.readyState==='complete') setTimeout(boot, 600);
  else window.addEventListener('load', function(){ setTimeout(boot, 600); });
})();
