![Image locale](src/assets/README/banner_readme03.png)
***
# VigneApp v1.0.2

### 🚀 React + Vite + Tailwind Template

Une template moderne prête à l’emploi pour démarrer rapidement un projet frontend avec **React**, **Vite** et **TailwindCSS**.

---

## ✨ Features

* ⚛️ **React** — bibliothèque UI moderne
* ⚡ **Vite** — build tool ultra rapide
* 🎨 **TailwindCSS** — styling rapide et flexible
* 🔥 **Hot Reload** instantané
* 🧩 Structure simple et propre
* ⚙️ PostCSS configuré (autoprefixer + nesting)

---

## 📦 Installation

Clone le projet :

```bash
git clone <ton-repo>
cd <nom-du-projet>
```

Installe les dépendances :

```bash
npm install
```

---

## 🚀 Lancer le projet

```bash
npm run dev
```

Puis ouvre :

```
http://localhost:5173
```

---

## 🛠️ Stack technique

* React
* Vite
* TailwindCSS
* PostCSS
* Autoprefixer
* PostCSS Nesting

---

## 📁 Structure du projet

```
src/
 ├── assets/        # Images, fonts
 ├── components/    # Composants React
 ├── App.jsx
 ├── main.jsx
 └── index.css      # Tailwind importé ici
```

---

## 🎨 Utilisation de Tailwind

Tailwind est déjà configuré.

Dans ton CSS principal :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Exemple dans React :

```jsx
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

---

## ⚠️ Notes

* Assure-toi que les fichiers sont bien inclus dans `tailwind.config.js` :

```js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

* Le support du **CSS nesting** est activé via PostCSS.

---

## 🎯 Objectif

Cette template a été créée pour :

* 🚀 Démarrer rapidement un projet
* 🧪 Tester des idées sans config
* 📚 Apprendre React + Tailwind dans un environnement propre

---

## 📄 Licence

Libre d’utilisation pour projets personnels et professionnels.

---

## 💡 Améliorations possibles

* Ajout de React Router
* Ajout d’un système de UI (Shadcn/UI, etc.)
* Dark mode
* ESLint / Prettier avancé

---

## 🤝 Contribution

Les contributions sont les bienvenues !

---

## ⭐ Support

Si cette template t’aide, n’hésite pas à laisser une ⭐ sur le repo !
