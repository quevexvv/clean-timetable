# Install in Chromium-based browsers

[Русский](../chromium.md) · [Firefox](firefox.md) · [README](../../README.en.md)

Installation requires a browser running Chromium 109 or later.

## Install the release ZIP

1. Download the [Chromium ZIP from the v1.1.0 release](https://github.com/quevexvv/clean-timetable/releases/download/v1.1.0/tpu-schedule-filter-chromium-1.1.0.zip).
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

Go to either timetable site, find your group, and open its timetable. If the timetable is already open, reload the tab. To hide a class, select **Configure** below it, then choose **Skip this class** or **Always hide**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

The **My timetable** panel starts hidden. Click the extension icon to open or close it above the table. To pin the icon in Chrome, open the extensions menu and click the pin next to **Clean Timetable for TPU**. [Chrome Help](https://support.google.com/chrome_webstore/answer/2664769?hl=en)

The **Full timetable** switch in the panel shows hidden classes. If the icon displays `!`, open a group timetable, check the extension’s site access, and reload the tab.

## Build from source

```sh
npm ci
npm run build:chromium
```

After building, `dist/` contains a ZIP archive and an unpacked `chromium/` directory. If you are installing from source, start at step 3 and select `dist/chromium/` in step 4.

## Update

Extract the new ZIP over the files in the installed extension’s folder or rebuild from source. Then click the reload button on the extension’s card and check the version number. Reload the timetable tab so Chrome can load the new scripts.
