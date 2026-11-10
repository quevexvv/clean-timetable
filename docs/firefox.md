# Установка в браузерах на базе Firefox

[English](en/firefox.md) · [Chromium](chromium.md) · [README](../README.md)

Для установки нужен браузер на Gecko 142 или новее.

## Постоянная установка в Firefox

Откройте страницу расширения и нажмите **«Добавить в Firefox»**. [Mozilla Add-ons](https://addons.mozilla.org/ru/firefox/addon/clean-timetable-for-tpu/)

Подписанный Mozilla XPI также можно установить через **«Установить дополнение из файла»** на странице `about:addons`. [Подпись и распространение](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)

## Установка готового ZIP

1. Скачайте [Firefox ZIP из релиза v1.0.0](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-firefox-1.0.0.zip). Если архив уже скачан, переходите к шагу 2.
2. Вставьте `about:debugging#/runtime/this-firefox` в адресную строку браузера и нажмите Enter.
3. Нажмите **«Загрузить временное дополнение…»**.
4. В окне выбора файла откройте папку, куда браузер сохранил архив. Выберите скачанный Firefox ZIP без распаковки. На странице должно появиться **Clean Timetable for TPU**.

В Zen Browser, LibreWolf, Waterfox и Floorp используйте тот же адрес, если браузер поддерживает временную установку.

Временная установка действует до перезапуска браузера. [Инструкция Mozilla](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

## Как начать пользоваться

Перейдите на один из сайтов расписания, найдите свою группу и откройте её расписание. Если расписание уже открыто, обновите вкладку. Над таблицей появится панель **«Моё расписание»**. Чтобы скрыть пару, нажмите **«Настроить»** под ней и выберите **«Пропустить пару»** или **«Скрывать всегда»**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

Если панель отсутствует, разрешите дополнению доступ к сайту расписания и обновите вкладку.

Разработчики Tor Browser и Mullvad Browser рекомендуют обходиться встроенными дополнениями. [Tor Browser](https://support.torproject.org/tor-browser/features/plugins/) · [Mullvad Browser](https://mullvad.net/en/help/faq#can-i-install-other-extensions)

## Сборка из исходников

```sh
npm ci
npm run build:firefox
```

В `dist/` появятся архив `tpu-schedule-filter-firefox-1.0.0.zip` и распакованная сборка `firefox/`. Для временной установки откройте страницу из шага 2 и выберите собранный ZIP или `dist/firefox/manifest.json`.
