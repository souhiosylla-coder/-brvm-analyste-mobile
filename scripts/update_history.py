#!/usr/bin/env python3
"""Enrichit history.json avec la clôture du jour (quotes.json).
Pas d'appel réseau externe pour éviter de bloquer GitHub Actions.
"""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "history.json"
QPATH = ROOT / "quotes.json"

def main() -> None:
    history = {}
    if OUT.exists():
        try:
            history = json.loads(OUT.read_text(encoding="utf-8")).get("history") or {}
        except Exception:
            history = {}

    if not QPATH.exists():
        print("quotes.json absent — rien à fusionner")
        return

    q = json.loads(QPATH.read_text(encoding="utf-8"))
    seance = q.get("retrieved_on") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    n_new = 0
    for item in q.get("quotes") or []:
        sym, px = item.get("symbol"), item.get("price")
        if not sym or not isinstance(px, (int, float)) or px <= 0:
            continue
        series = {b["date"]: b["close"] for b in (history.get(sym) or []) if isinstance(b, dict) and b.get("date")}
        before = series.get(seance)
        series[seance] = float(px)
        if before != series[seance]:
            n_new += 1
        history[sym] = [{"date": d, "close": series[d]} for d in sorted(series)][-180:]

    payload = {
        "source": "quotes.json (cumul quotidien)",
        "updated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": "Historique différé. S'enrichit à chaque séance via GitHub Actions.",
        "history": history,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"history.json OK — {len(history)} titres, {n_new} points mis à jour (séance {seance})")

if __name__ == "__main__":
    main()
