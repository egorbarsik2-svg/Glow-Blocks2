# Как обновить игру на Google Sites

Локальная версия игры уже обновлена. Чтобы обновление появилось на сайте Google, нужно обновить источник, который встроен в Google Sites.

## Если игра вставлена через Netlify

1. Откройте Netlify Drop: https://app.netlify.com/drop
2. Перетащите туда обновленную папку `block-blast-offline`.
3. Если Netlify даст новую ссылку, откройте Google Sites.
4. Нажмите на блок игры -> изменить вставку -> замените URL на новую ссылку `https://...`.
5. Нажмите `Опубликовать`.

## Если игра вставлена через GitHub Pages

1. Откройте репозиторий игры на GitHub.
2. Замените файлы `index.html`, `styles.css`, `script.js` и `_headers` на новые.
3. Дождитесь обновления GitHub Pages.
4. В Google Sites нажмите `Опубликовать` еще раз.

## Если игра вставлена кодом в Google Sites

Google Sites не обновит файлы `styles.css` и `script.js` автоматически. Лучше использовать Netlify или GitHub Pages и вставлять игру по URL.

## Готовый архив

Архив для загрузки: `block-blast-offline-google-update.zip`.

Внутри лежат обновленные файлы игры:

- `index.html`
- `styles.css`
- `script.js`
- `_headers`
