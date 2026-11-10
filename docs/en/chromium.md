# Install in Chromium-based browsers

[Русский](../chromium.md) · [Firefox](firefox.md) · [README](../../README.en.md)

## Build

Installation requires a browser running Chromium 109 or later.

```sh
npm ci
npm run build:chromium
```

After building, `dist/` contains `tpu-schedule-filter-chromium-1.0.0.zip` and an unpacked `chromium/` directory. Select the `dist/chromium/` folder when installing. If you only have the ZIP, extract it first.

## Install

| Browser | Extensions page |
| --- | --- |
| Chromium, Google Chrome | `chrome://extensions` |
| Microsoft Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |
| Yandex Browser | `browser://extensions` |

1. Open the extensions page and enable **Developer mode**.
2. Select **Load unpacked** and choose the `dist/chromium/` folder.
3. Open or reload your group timetable. Look for **My timetable** above the table. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

If the panel is missing, grant the extension access to the timetable site and reload the tab.

## Update

After rebuilding, reload the extension on the extensions page and refresh the timetable tab.
