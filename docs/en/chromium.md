# Install in Chromium-based browsers

[Русский](../chromium.md) · [Firefox](firefox.md) · [README](../../README.en.md)

Installation requires a browser running Chromium 109 or later.

## Install the release ZIP

1. Download the [Chromium ZIP from the v1.0.0 release](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-chromium-1.0.0.zip). If you already downloaded it, start at step 2.
2. Find the downloaded Chromium ZIP and extract it. Open the extracted folder and find `manifest.json`.
3. Paste the extensions page address from the table below into your browser's address bar and press Enter. Enable **Developer mode**.
4. Select **Load unpacked** and choose the entire folder containing `manifest.json`. **Clean Timetable for TPU** will appear in the extensions list.

| Browser                 | Extensions page        |
| ----------------------- | ---------------------- |
| Chromium, Google Chrome | `chrome://extensions`  |
| Microsoft Edge          | `edge://extensions`    |
| Brave                   | `brave://extensions`   |
| Opera                   | `opera://extensions`   |
| Vivaldi                 | `vivaldi://extensions` |
| Yandex Browser          | `browser://extensions` |

## Get started

Go to either timetable site, find your group, and open its timetable. If the timetable is already open, reload the tab. Look for **My timetable** above the table. To hide a class, select **Configure** below it, then choose **Skip this class** or **Always hide**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

If the panel is missing, grant the extension access to the timetable site and reload the tab.

## Build from source

```sh
npm ci
npm run build:chromium
```

After building, `dist/` contains a ZIP archive and an unpacked `chromium/` directory. If you are installing from source, start at step 3 and select `dist/chromium/` in step 4.

## Update

Extract the new ZIP into the installed extension’s folder or rebuild from source. Then reload the extension on the extensions page and refresh the timetable tab.
