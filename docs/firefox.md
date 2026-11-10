# Установка в браузерах на базе Firefox

[English](en/firefox.md) · [Chromium](chromium.md) · [README](../README.md)

## Сборка

Для установки нужен браузер на Gecko 142 или новее.

```sh
npm ci
npm run build:firefox
```

В `dist/` появятся архив `tpu-schedule-filter-firefox-1.0.0.zip` и распакованная сборка `firefox/`.

## Установка

| Браузер | Страница временной установки |
| --- | --- |
| Firefox, Firefox ESR | `about:debugging#/runtime/this-firefox` |
| Zen Browser, LibreWolf, Waterfox, Floorp | Та же страница, если в браузере доступна временная установка |

1. Откройте страницу временной установки и нажмите **«Загрузить временное дополнение»**.
2. Выберите ZIP для Firefox или `dist/firefox/manifest.json`.
3. Откройте или обновите расписание группы. Над таблицей появится **«Моё расписание»**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

Временная установка действует до перезапуска браузера. [Инструкция Mozilla](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

Если панель отсутствует, разрешите дополнению доступ к сайту расписания и обновите вкладку.

Разработчики Tor Browser и Mullvad Browser рекомендуют обходиться встроенными дополнениями. [Tor Browser](https://support.torproject.org/tor-browser/features/plugins/) · [Mullvad Browser](https://mullvad.net/en/help/faq#can-i-install-other-extensions)

## Постоянная установка в Firefox

Получите подписанный Mozilla XPI и откройте его через **«Установить дополнение из файла»** на странице `about:addons`. [Подпись и распространение](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
