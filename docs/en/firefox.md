# Install in Firefox-based browsers

[Русский](../firefox.md) · [Chromium](chromium.md) · [README](../../README.en.md)

Installation requires a browser running Gecko 142 or later.

## Permanent installation in Firefox

Open the add-on listing and select **Add to Firefox**. [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/clean-timetable-for-tpu/)

You can also install a Mozilla-signed XPI using **Install Add-on From File** on `about:addons`. [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)

## Temporary installation from a ZIP

Download the [Firefox ZIP from the v1.0.0 release](https://github.com/quevexvv/clean-timetable/releases/download/v1.0.0/tpu-schedule-filter-firefox-1.0.0.zip).

| Browser                                  | Temporary installation page                             |
| ---------------------------------------- | ------------------------------------------------------- |
| Firefox, Firefox ESR                     | `about:debugging#/runtime/this-firefox`                 |
| Zen Browser, LibreWolf, Waterfox, Floorp | The same page where temporary installation is available |

1. Open the temporary installation page and choose **Load Temporary Add-on**.
2. Select the downloaded ZIP. If you built the extension yourself, you can select `dist/firefox/manifest.json`.
3. Open or reload your group timetable. Look for **My timetable** above the table. [my-rasp](https://my-rasp.tpu.ru/) · [ro-rasp](https://ro-rasp.tpu.ru/)

A temporary add-on stays loaded until you restart the browser. [Mozilla instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

If the panel is missing, grant the add-on access to the timetable site and reload the tab.

The Tor Browser and Mullvad Browser teams recommend sticking to their built-in add-ons. [Tor Browser](https://support.torproject.org/tor-browser/features/plugins/) · [Mullvad Browser](https://mullvad.net/en/help/faq#can-i-install-other-extensions)

## Build from source

```sh
npm ci
npm run build:firefox
```

After building, `dist/` contains `tpu-schedule-filter-firefox-1.0.0.zip` and an unpacked `firefox/` directory.
