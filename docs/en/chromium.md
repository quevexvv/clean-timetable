# Install in Chromium-based browsers

[Русский](../chromium.md) · [Firefox](firefox.md) · [README](../../README.en.md)

Installation requires a browser running Chromium 109 or later.

## Install

Download and extract the [Chromium ZIP from the v1.0.0 release](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-chromium-1.0.0.zip).

| Browser                 | Extensions page        |
| ----------------------- | ---------------------- |
| Chromium, Google Chrome | `chrome://extensions`  |
| Microsoft Edge          | `edge://extensions`    |
| Brave                   | `brave://extensions`   |
| Opera                   | `opera://extensions`   |
| Vivaldi                 | `vivaldi://extensions` |
| Yandex Browser          | `browser://extensions` |

1. Open the extensions page and enable **Developer mode**.
2. Select **Load unpacked** and choose the folder containing `manifest.json`.
3. Open or reload your group timetable. Look for **My timetable** above the table. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

If the panel is missing, grant the extension access to the timetable site and reload the tab.

## Build from source

```sh
npm ci
npm run build:chromium
```

After building, `dist/` contains a ZIP archive and an unpacked `chromium/` directory. If you are installing from source, select `dist/chromium/` in step 2.

## Update

Extract the new ZIP into the installed extension’s folder or rebuild from source. Then reload the extension on the extensions page and refresh the timetable tab.
