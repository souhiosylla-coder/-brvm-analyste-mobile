#!/usr/bin/env python3
"""Synchronise quotes.json et fundamentals.json depuis l'API publique BloomAfrik."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import requests

API = "https://api.bloomafrik.com/api/v1/stocks"
SCALE = 1000  # montants API en milliers de FCFA
ROOT = Path(__file__).resolve().parents[1]


def fnum(x):
    if x is None or x == "":
        return None
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def fetch_stocks():
    r = requests.get(
        API,
        params={"limit": 100, "sort_by": "ticker", "sort_dir": "asc"},
        headers={
            "Accept": "application/json",
            "Origin": "https://app.bloomafrik.com",
            "Referer": "https://app.bloomafrik.com/",
            "User-Agent": "BRVM-Analyste-Mobile/1.0",
        },
        timeout=60,
    )
    r.raise_for_status()
    data = r.json().get("data") or []
    if len(data) < 10:
        raise SystemExit(f"Trop peu de titres: {len(data)}")
    return data


def build_quotes(stocks):
    quotes = []
    for s in stocks:
        px = fnum(s.get("close_price"))
        if not px or px <= 0:
            continue
        var = fnum(s.get("daily_change_pct"))
        quotes.append(
            {
                "symbol": s["ticker"],
                "price": int(px) if px == int(px) else round(px, 2),
                "variation_pct": round(var, 2) if var is not None else None,
            }
        )
    quotes.sort(key=lambda q: q["symbol"])
    return {
        "source": "BloomAfrik API",
        "updated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "retrieved_on": stocks[0].get("last_price_date") if stocks else None,
        "quote_count": len(quotes),
        "quotes": quotes,
    }


def build_fundamentals(stocks, previous):
    prev_f = (previous or {}).get("fundamentals") or {}
    out = {}
    for s in stocks:
        t = s["ticker"]
        f = dict(prev_f.get(t) or {})
        eps, dps, bv = fnum(s.get("eps")), fnum(s.get("dividend_per_share")), fnum(s.get("book_value_per_share"))
        per, dy, mcap = fnum(s.get("per_ratio")), fnum(s.get("dividend_yield")), fnum(s.get("market_cap"))
        rev, ni, eq = fnum(s.get("revenue")), fnum(s.get("net_income")), fnum(s.get("shareholder_equity"))
        liab, roe = fnum(s.get("total_liabilities")), fnum(s.get("roe_pct"))
        px = fnum(s.get("close_price"))

        if eps is not None:
            f["eps"] = round(eps, 2)
        if dps is not None:
            f["dividend"] = round(dps, 2)
        if bv is not None:
            f["book"] = round(bv, 2)
        if per is not None:
            f["per_ref"] = round(per, 2)
        if dy is not None:
            f["yield_ref"] = round(dy, 2)
        if mcap is not None:
            f["market_cap_mds"] = round(mcap / 1e9, 1)
        if rev is not None:
            f["revenueNew"] = int(rev * SCALE)
        if ni is not None:
            f["profitNew"] = int(ni * SCALE)
        if eq is not None:
            f["equity"] = int(eq * SCALE)
        if liab is not None:
            f["debt"] = int(liab * SCALE)
        if roe is not None:
            f["roe"] = round(roe, 2)
        if px and bv and bv > 0:
            f["pb"] = round(px / bv, 2)
        f["source"] = f"BloomAfrik API · exercice {s.get('last_fiscal_year') or '?'} · séance {s.get('last_price_date')}"
        f["real_ca"] = rev is not None or ni is not None
        out[t] = f

    return {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "notice": "Données synchronisées depuis api.bloomafrik.com (48 titres). Montants CA/RN/CP/dettes en FCFA (×1000 depuis l'API).",
        "market_aligned": sorted(out.keys()),
        "real_tickers": sorted(t for t, f in out.items() if f.get("real_ca")),
        "fundamentals": out,
    }


def main():
    stocks = fetch_stocks()
    quotes = build_quotes(stocks)
    prev = None
    fp = ROOT / "fundamentals.json"
    if fp.exists():
        prev = json.loads(fp.read_text(encoding="utf-8"))
    fund = build_fundamentals(stocks, prev)

    (ROOT / "quotes.json").write_text(json.dumps(quotes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    fp.write_text(json.dumps(fund, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK {quotes['quote_count']} cotations, {len(fund['fundamentals'])} fondamentaux")


if __name__ == "__main__":
    main()
