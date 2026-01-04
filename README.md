# 🎵 Sounds

Une application web minimaliste pour créer et écouter des ambiances sonores personnalisées. Mixez différents sons de la nature, de la ville ou de la musique pour créer votre propre paysage sonore.

## 🚀 Démo en direct

[Accédez à l'application ici !](https://sounds-iota.vercel.app/)

## ✨ Fonctionnalités

- **🎚️ Mixeur de sons :** Jouez plusieurs sons simultanément et ajustez leur volume individuellement.
- **💾 Snapshots :** Sauvegardez vos mixages préférés pour les réécouter plus tard. Il est possible de sauvegarder plusieurs "snapshots".
- **🔀 Générateur aléatoire :** Laissez l'application créer une ambiance aléatoire pour vous.
- **⏱️ Minuteur :** Endormez-vous avec votre ambiance sonore grâce au minuteur intégré.
- **🔇 Stop :** Un bouton pour arrêter tous les sons en un seul clic.
- **🎶 Audio Stretching :** Utilise l'algorithme _Paulstretch_ pour étirer les sons et créer des textures sonores uniques.
- **🎨 Palette de couleurs :** Une interface simple et apaisante.

## 🛠️ Technologies utilisées

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Paulstretch.js](https://github.com/paul-nasca/paulstretch-js) pour la manipulation audio
- [LocalForage](https://github.com/localForage/localForage) pour le stockage côté client
- Déployé sur [Vercel](https://vercel.com/)

## ⚙️ Installation et Lancement

Pour lancer le projet en local, suivez ces étapes :

1.  **Clonez le dépôt :**

    ```bash
    git clone https://github.com/your-username/sounds.git
    cd sounds
    ```

2.  **Installez les dépendances :**

    ```bash
    npm install
    ```

3.  **Lancez le serveur de développement :**
    ```bash
    npm run dev
    ```
    L'application sera disponible à l'adresse `http://localhost:5173`.

## 📖 Comment utiliser

1.  Cliquez sur les icônes pour activer les sons.
2.  Utilisez les curseurs (sliders) qui apparaissent pour ajuster le volume de chaque son.
3.  Utilisez les boutons en bas pour sauvegarder, charger ou générer des mixages.

## 🗺️ Feuille de route

Certaines des fonctionnalités prévues incluent :

- [ ] Intégration d'un filtre basé sur le bruit de Perlin.

Pour plus de détails, consultez le fichier [ROADMAP.md](ROADMAP.md).

## 📄 Licence

Ce projet est sous licence MIT.

## Sources

All sounds come from :

- https://orangefreesounds.com/sound-effects/
  or
- https://freesound.org/
  Api docs are to be found here :
- https://freesound.org/docs/api/authentication.html
