# BRVM Analyste Mobile

Application web progressive (PWA) permettant de consulter facilement les cotations de la **Bourse Régionale des Valeurs Mobilières (BRVM)** sur mobile.

---

## Aperçu

Application légère et responsive conçue pour afficher les cours des actions BRVM en temps quasi réel, avec une interface optimisée pour smartphone.

> Les données sont extraites automatiquement du site officiel de la BRVM.

---

## Fonctionnalités

- Affichage des cotations BRVM (symbole, cours, variation)
- Interface mobile-first (PWA)
- Mise à jour automatique des données via GitHub Actions
- Fichier `quotes.json` toujours à jour
- Installation possible sur l’écran d’accueil (PWA)

---

## Technologies

| Technologie       | Utilisation                          |
|-------------------|--------------------------------------|
| HTML / CSS / JS   | Interface utilisateur (PWA)          |
| Python            | Script de récupération des cotations |
| BeautifulSoup     | Scraping du site BRVM                |
| GitHub Actions    | Mise à jour automatique quotidienne  |

---

## Structure du projet

```
├── index.html                  # Application principale
├── quotes.json                 # Cotations à jour
├── scripts/
│   └── update_quotes.py        # Script de scraping
├── .github/workflows/
│   └── update-quotes.yml       # Action de mise à jour auto
└── README.md
```

---

## Mise à jour automatique des cotations

Les cotations sont mises à jour automatiquement **du lundi au vendredi à 12h15 UTC** grâce à une GitHub Action.

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

## Auteur

**Souhio Sylla**  
GitHub : [souhiosylla-coder](https://github.com/souhiosylla-coder)

---

## Licence

Ce projet est open source.  
Les données affichées proviennent du site public de la BRVM.
