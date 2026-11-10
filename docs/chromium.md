# Установка в браузерах на базе Chromium

[English](en/chromium.md) · [Firefox](firefox.md) · [README](../README.md)

## Сборка

Для установки нужен браузер на Chromium 109 или новее.

```sh
npm ci
npm run build:chromium
```

В `dist/` появятся архив `tpu-schedule-filter-chromium-1.0.0.zip` и распакованная сборка `chromium/`. Для установки выбирайте папку `dist/chromium/`. Если у вас только ZIP, сначала распакуйте его.

## Установка

| Браузер | Страница расширений |
| --- | --- |
| Chromium, Google Chrome | `chrome://extensions` |
| Microsoft Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |
| Яндекс Браузер | `browser://extensions` |

1. Откройте страницу расширений и включите **«Режим разработчика»**.
2. Нажмите **«Загрузить распакованное расширение»** и выберите папку `dist/chromium/`.
3. Откройте или обновите расписание группы. Над таблицей появится **«Моё расписание»**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

Если панель отсутствует, разрешите расширению доступ к сайту расписания и обновите вкладку.

## Обновление

После повторной сборки перезагрузите расширение на странице расширений и обновите вкладку с расписанием.
