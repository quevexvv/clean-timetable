# Установка в браузерах на базе Chromium

[English](en/chromium.md) · [Firefox](firefox.md) · [README](../README.md)

Для установки нужен браузер на Chromium 109 или новее.

## Установка

Скачайте [Chromium ZIP из релиза v1.0.0](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-chromium-1.0.0.zip) и распакуйте его.

| Браузер                 | Страница расширений    |
| ----------------------- | ---------------------- |
| Chromium, Google Chrome | `chrome://extensions`  |
| Microsoft Edge          | `edge://extensions`    |
| Brave                   | `brave://extensions`   |
| Opera                   | `opera://extensions`   |
| Vivaldi                 | `vivaldi://extensions` |
| Яндекс Браузер          | `browser://extensions` |

1. Откройте страницу расширений и включите **«Режим разработчика»**.
2. Нажмите **«Загрузить распакованное расширение»** и выберите папку с `manifest.json`.
3. Откройте или обновите расписание группы. Над таблицей появится **«Моё расписание»**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

Если панель отсутствует, разрешите расширению доступ к сайту расписания и обновите вкладку.

## Сборка из исходников

```sh
npm ci
npm run build:chromium
```

В `dist/` появятся ZIP-архив и распакованная сборка `chromium/`. Для установки из исходников выберите папку `dist/chromium/` на шаге 2.

## Обновление

Распакуйте новый ZIP в папку установленного расширения или пересоберите его из исходников. Затем перезагрузите расширение на странице расширений и обновите вкладку с расписанием.
