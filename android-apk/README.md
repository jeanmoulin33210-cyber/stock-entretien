# Tests culinaires — Android

Application Android native légère qui ouvre l'application web **Tests culinaires** dans un WebView sécurisé.

- URL : https://jeanmoulin33210-cyber.github.io/stock-entretien/tests-culinaires.html
- Package : `fr.jeanmoulin.testsculinaires`
- Version : 338.0
- Android minimum : 8.0 (API 26)

Le wrapper gère JavaScript, stockage web, fenêtres du rapport, sélection de fichiers, liens externes et téléchargement des PDF générés en `blob:`.

## Construction

```bash
gradle -p android-apk assembleDebug
```

APK : `android-apk/app/build/outputs/apk/debug/app-debug.apk`.
