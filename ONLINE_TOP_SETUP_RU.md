# Как включить онлайн-топ

Игра уже умеет отправлять и загружать рекорды через Firebase Realtime Database.

1. Открой Firebase Console и создай проект.
2. Открой Realtime Database.
3. Создай базу данных в режиме test mode.
4. Скопируй URL базы. Он похож на:

```text
https://project-name-default-rtdb.firebaseio.com
```

5. Открой игру, войди в настройки разработчика кодом `GLOW-DEV-2702`.
6. В поле "Онлайн-топ" вставь Firebase URL и нажми "Сохранить".
7. После этого рекорды будут отправляться в онлайн-топ и видны на других устройствах.

Для сайта на GitHub Pages лучше вставить этот URL в `script.js` в строку:

```js
const ONLINE_LEADERBOARD_URL = "";
```

Например:

```js
const ONLINE_LEADERBOARD_URL = "https://project-name-default-rtdb.firebaseio.com";
```

Потом нужно загрузить обновленные файлы на сайт.
