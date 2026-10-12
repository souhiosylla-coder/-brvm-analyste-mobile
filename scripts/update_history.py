#!/usr/bin/env python3
"""Construit history.json : merge quotes.json + optional kwayisi (10 j)."""
from __future__ import annotations
import json, re, time, urllib.request
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "history.json"
UA = "Mozilla/5.0 (compatible; BRVM-Analyste-Mobile/1.0)"

def load_existing():
    if OUT.exists():
        try:
            return json.loads(OUT.read_text(encoding="utf-8")).get("history") or {}
        except Exception:
            return {}
    return {}

def merge_quotes(history):
    qpath = ROOT / "quotes.json"
    if not qpath.exists():
        return history
    q = json.loads(qpath.read_text(encoding="utf-8"))
    seance = q.get("retrieved_on") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for item in q.get("quotes") or []:
        sym, px = item.get("symbol"), item.get("price")
        if not sym or not isinstance(px, (int, float)) or px <= 0:
            continue
        series = {b["date"]: b["close"] for b in (history.get(sym) or []) if isinstance(b, dict)}
        series[seance] = float(px)
        history[sym] = [{"date": d, "close": series[d]} for d in sorted(series)][-180:]
    return history

def fetch_kwayisi(sym):
    url = f"https://afx.kwayisi.org/brvm/{sym.lower()}.html"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
    out = {}
    for m in re.finditer(
        r"(\d{4}-\d{2}-\d{2})\s*</t[dh]>\s*<t[dh][^>]*>\s*([\d\s,]+)\s*</t[dh]>\s*<t[dh][^>]*>\s*([\d\s,]+)",
        html, re.I,
    ):
        try:
            out[m.group(1)] = float(m.group(3).replace(" ", "").replace(",", ""))
        except ValueError:
            pass
    return out

def main():
    history = load_existing()
    history = merge_quotes(history)
    thin = [s for s, bars in history.items() if len(bars) < 8][:25]
    for sym in thin:
        try:
            got = fetch_kwayisi(sym)
            if got:
                series = {b["date"]: b["close"] for b in (history.get(sym) or [])}
                series.update(got)
                history[sym] = [{"date": d, "close": series[d]} for d in sorted(series)][-180:]
                print("kwayisi", sym, len(history[sym]))
            time.sleep(0.5)
        except Exception as e:
            print("skip", sym, e)
    payload = {
        "source": "quotes.json + kwayisi",
        "updated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "Historique différé, non officiel.",
        "history": history,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("symbols", len(history), "file", OUT)

if __name__ == "__main__":
    main()
