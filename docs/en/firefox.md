# Install in Firefox-based browsers

[Русский](../firefox.md) · [Chromium](chromium.md) · [README](../../README.en.md)

## Build

Installation requires a browser running Gecko 142 or later.

```sh
npm ci
npm run build:firefox
```

After building, `dist/` contains `tpu-schedule-filter-firefox-1.0.0.zip` and an unpacked `firefox/` directory.

## Install

| Browser | Temporary installation page |
| --- | --- |
| Firefox, Firefox ESR | `about:debugging#/runtime/this-firefox` |
| Zen Browser, LibreWolf, Waterfox, Floorp | The same page where temporary installation is available |

1. Open the temporary installation page and choose **Load Temporary Add-on**.
2. Select the Firefox ZIP or `dist/firefox/manifest.json`.
3. Open or reload your group timetable. Look for **My timetable** above the table. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

A temporary add-on stays loaded until you restart the browser. [Mozilla instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

If the panel is missing, grant the add-on access to the timetable site and reload the tab.

The Tor Browser and Mullvad Browser teams recommend sticking to their built-in add-ons. [Tor Browser](https://support.torproject.org/tor-browser/features/plugins/) · [Mullvad Browser](https://mullvad.net/en/help/faq#can-i-install-other-extensions)

## Permanent installation in Firefox

Obtain a Mozilla-signed XPI and use **Install Add-on From File** on `about:addons`. [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
