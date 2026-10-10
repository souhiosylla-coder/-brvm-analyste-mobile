#!/usr/bin/env python3
"""Récupère les cotations publiques affichées sur le site de la BRVM."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

URL = "https://www.brvm.org/fr"
OUT = Path("quotes.json")
QUOTE_RE = re.compile(
    r"\b([A-Z]{3,5})\s+((?:\d{1,3}(?:\s\d{3})*))\s+(-?\d+,\d{2})%"
)
EXCLUDED = {"BRVM", "FCFA", "CFA", "GMT"}


def to_int(value):
    return int(
        value.replace("\u202f", " ")
        .replace("\xa0", " ")
        .replace(" ", "")
    )


def main():
    response = requests.get(
        URL,
        headers={"User-Agent": "BRVM-Analyste-Mobile/1.0"},
        timeout=30,
    )
    response.raise_for_status()

    page_text = BeautifulSoup(
        response.text, "html.parser"
    ).get_text(" ", strip=True)

    seen = set()
    quotes = []

    for match in QUOTE_RE.finditer(page_text):
        symbol, raw_price, raw_change = match.groups()

        if symbol in EXCLUDED or symbol in seen:
            continue

        try:
            price = to_int(raw_price)
            change = float(raw_change.replace(",", "."))
        except ValueError:
            continue

        if price <= 0:
            continue

        seen.add(symbol)
        quotes.append({
            "symbol": symbol,
            "price": price,
            "variation_pct": change,
        })

    if len(quotes) < 10:
        raise SystemExit(
            f"Arrêt de sécurité : seulement "
            f"{len(quotes)} cotations reconnues."
        )

    now = datetime.now(timezone.utc)

    data = {
        "source": URL,
        "updated_at_utc": now.isoformat(
            timespec="seconds"
        ).replace("+00:00", "Z"),
        "retrieved_on": now.date().isoformat(),
        "quote_count": len(quotes),
        "quotes": quotes,
        "notice": (
            "Données extraites de la page publique BRVM. "
            "Confirmer la date de séance officielle."
        ),
    }

    OUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"{len(quotes)} cotations enregistrées dans {OUT}")


if __name__ == "__main__":
    main()
