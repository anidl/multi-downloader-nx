# Anime Downloader NX by AniDL

[![Discord Shield](https://discord.com/api/guilds/884479461997805568/widget.png?style=banner2)](https://discord.gg/qEpbWen5vq)

This downloader can download anime from different sites. Currently supported are *Funimation*, *Crunchyroll*, and *Hidive*.

## Legal Warning

This application is not endorsed by or affiliated with *Funimation*, *Crunchyroll*, or *Hidive*. This application enables you to download videos for offline viewing which may be forbidden by law in your country. The usage of this application may also cause a violation of the *Terms of Service* between you and the stream provider. This tool is not responsible for your actions; please make an informed decision before using this application.

## Prerequisites

* NodeJS >= 14.6.0 (https://nodejs.org/)
* NPM >= 6.9.0 (https://www.npmjs.org/)
* PNPM >= 7.0.0 (https://pnpm.io/)
* ffmpeg >= 4.0.0 (https://www.videohelp.com/software/ffmpeg)
* MKVToolNix >= 60.0.0 (https://www.videohelp.com/software/MKVToolNix)

### Paths Configuration

By default this application uses the following paths to programs (main executables):

* `ffmpeg.exe` (From PATH)
* `mkvmerge.exe` (From PATH)

To change these paths you need to edit `bin-path.yml` in `./config/` directory.

### Node Modules

After installing NodeJS with NPM go to directory with `package.json` file and type: `npm i`. Afterwards run `npm run tsc`. You can now find a lib folder containing the js code execute.

* [check dependencies](https://david-dm.org/anidl/funimation-downloader-nx)

## CLI Options

See [the documentation](https://github.com/anidl/multi-downloader-nx/blob/master/docs/DOCUMENTATION.md)

## Build instructions

Please note that nodejs, npm, and pnpm must be installed in your system. For instructions on how to install pnpm, check (https://pnpm.io/installation)

First clone this repo `git clone https://github.com/anidl/multi-downloader-nx.git`.

`cd` into the cloned directory and run `pnpm i`.
Afterwards run `pnpm run tsc false [true if you want gui, false otherwise]`.

If you want the `js` files you are done. Just `cd` into the `lib` folder, and run `node index.js --help` to get started with the CLI, or run `node gui.js` to run the GUI

If you want to package the application, run pnpm run build-`{platform}`-`{type}` where `{platform}` is the operating system (currently the choices are windows, ubuntu, macos, and arm) and `{type}` is cli or gui.
