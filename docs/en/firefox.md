# Install in Firefox-based browsers

[Русский](../firefox.md) · [Chromium](chromium.md) · [README](../../README.en.md)

Installation requires a browser running Gecko 142 or later.

## Permanent installation in Firefox

Open the add-on listing and select **Add to Firefox**. [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/clean-timetable-for-tpu/)

You can also install a Mozilla-signed XPI using **Install Add-on From File** on `about:addons`. [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)

## Install the release ZIP

1. Download the [Firefox ZIP from the v1.0.0 release](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-firefox-1.0.0.zip). If you already downloaded it, start at step 2.
2. Paste `about:debugging#/runtime/this-firefox` into the browser's address bar and press Enter.
3. Select **Load Temporary Add-on…**.
4. In the file picker, open the folder where your browser saved the archive. Select the downloaded Firefox ZIP without extracting it. **Clean Timetable for TPU** should appear on the page.

Use the same address in Zen Browser, LibreWolf, Waterfox, and Floorp if your browser supports temporary installation.

A temporary add-on stays loaded until you restart the browser. [Mozilla instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

## Get started

Go to either timetable site, find your group, and open its timetable. If the timetable is already open, reload the tab. Look for **My timetable** above the table. To hide a class, select **Configure** below it, then choose **Skip this class** or **Always hide**. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

If the panel is missing, grant the add-on access to the timetable site and reload the tab.

The Tor Browser and Mullvad Browser teams recommend sticking to their built-in add-ons. [Tor Browser](https://support.torproject.org/tor-browser/features/plugins/) · [Mullvad Browser](https://mullvad.net/en/help/faq#can-i-install-other-extensions)

## Build from source

```sh
npm ci
npm run build:firefox
```

After building, `dist/` contains `tpu-schedule-filter-firefox-1.0.0.zip` and an unpacked `firefox/` directory. For a temporary installation, open the page from step 2 and select the ZIP you built or `dist/firefox/manifest.json`.
