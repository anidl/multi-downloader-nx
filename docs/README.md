# Anime Downloader NX by AniDL

This downloader can download anime from diffrent sites. Currently supported are *Funimation* and *Crunchyroll*.

## Legal Warning

This application is not endorsed by or affiliated with *Funimation* or *Crunchyroll*. This application enables you to download videos for offline viewing which may be forbidden by law in your country. The usage of this application may also cause a violation of the *Terms of Service* between you and the stream provider. This tool is not responsible for your actions; please make an informed decision before using this application.

## Prerequisites

* NodeJS >= 12.4.0 (https://nodejs.org/)
* NPM >= 6.9.0 (https://www.npmjs.org/)
* ffmpeg >= 4.0.0 (https://www.videohelp.com/software/ffmpeg)
* MKVToolNix >= 20.0.0 (https://www.videohelp.com/software/MKVToolNix)

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

Please note that nodejs and npm must be installed in your system.
First clone this repo `git clone https://github.com/anidl/multi-downloader-nx.git`.
`cd` into the cloned directory and run `npm i`.
Afterwards run `npm run tsc false [true if you want gui, false otherwise]`.
If you want the `js` files you are done. Just `cd` into the `lib` folder.
If you want to package the application, please also `cd` into the `lib` folder and run `npx electron-builder build --publish=never [Your Options]` for the gui build. You may find the options [here](https://www.electron.build/cli).
Since the cli tool requires some more configuration, please see the `modules/build.ts` file and run the commands under `buildBinary`.
