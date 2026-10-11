# BRVM Analyste Mobile

Application web progressive (PWA) permettant de consulter facilement les cotations de la **Bourse Régionale des Valeurs Mobilières (BRVM)** sur mobile.

---

## Aperçu

Application légère et responsive conçue pour afficher les cours des actions BRVM en données **différées**, avec une interface optimisée pour smartphone.

> Les données sont extraites automatiquement de la page publique de la BRVM.

---

## Fonctionnalités

- Affichage des cotations BRVM (symbole, cours, variation)
- Analyse fondamentale (ratios, score avec niveau de confiance)
- Analyse technique (RSI Wilder, MACD 12-26-9, MM, Bollinger)
- Portefeuille virtuel (coût moyen pondéré)
- Mise à jour automatique via GitHub Actions
- Interface mobile-first

---

## Technologies

| Technologie       | Utilisation                          |
|-------------------|--------------------------------------|
| HTML / CSS / JS   | Interface utilisateur (PWA)          |
| Python            | Script de récupération des cotations |
| BeautifulSoup     | Scraping du site BRVM                |
| GitHub Actions    | Mise à jour horaire en séance (lun–ven) |

---

## Structure du projet

```
├── index.html                  # Application principale
├── quotes.json                 # Cotations à jour
├── fundamentals.json           # Données financières
├── scripts/
│   └── update_quotes.py        # Script de scraping
├── .github/workflows/
│   └── update-quotes.yml       # Action de mise à jour auto
└── README.md
```

---

## Mise à jour automatique des cotations

Les cotations sont mises à jour automatiquement **du lundi au vendredi, toutes les heures entre 08:05 et 16:05 UTC** (séance BRVM approximative) via GitHub Actions. Les cours sont **différés** (source page publique BRVM), pas du temps réel.

Une validation empêche d’écraser un fichier valide par une extraction trop incomplète.

Tu peux aussi lancer la mise à jour manuellement :
1. Va dans l’onglet **Actions**
2. Sélectionne le workflow **Mise à jour des cotations BRVM**
3. Clique sur **Run workflow**

---

## Installation locale (pour développement)

```bash
# Cloner le dépôt
git clone https://github.com/souhiosylla-coder/-brvm-analyste-mobile.git
cd -brvm-analyste-mobile

# Installer les dépendances Python
pip install requests beautifulsoup4

# Mettre à jour les cotations manuellement
python scripts/update_quotes.py
```

Ouvre ensuite simplement `index.html` dans ton navigateur.

---

## Avertissement

Les cotations sont **différées** et extraites de la page publique BRVM. Confirmer avec le bulletin officiel. Les analyses et scores sont **indicatifs** et ne constituent pas un conseil d’investissement.

---

## Auteur

**Souhio Sylla**  
GitHub : [souhiosylla-coder](https://github.com/souhiosylla-coder)

---

## Licence

Ce projet est open source.  
Les données affichées proviennent du site public de la BRVM.
