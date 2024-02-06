# Anime Downloader NX by AniDL

[![Discord Shield](https://discord.com/api/guilds/884479461997805568/widget.png?style=banner2)](https://discord.gg/qEpbWen5vq)

This downloader can download anime from different sites. Currently supported are *Funimation*, *Crunchyroll*, and *Hidive*.

## Legal Warning

This application is not endorsed by or affiliated with *Funimation*, *Crunchyroll*, or *Hidive*. This application enables you to download videos for offline viewing which may be forbidden by law in your country. The usage of this application may also cause a violation of the *Terms of Service* between you and the stream provider. This tool is not responsible for your actions; please make an informed decision before using this application.

## Dependencies

* ffmpeg >= 4.0.0 (https://www.videohelp.com/software/ffmpeg)
* MKVToolNix >= 60.0.0 (https://www.videohelp.com/software/MKVToolNix)

### Paths Configuration

By default this application uses the following paths to programs (main executables):

* `ffmpeg.exe` (From PATH)
* `ffprobe.exe` (From PATH)
* `mkvmerge.exe` (From PATH)
* `mp4decrypt.exe` (From PATH)

To change these paths you need to edit `bin-path.yml` in `./config/` directory.

## CLI Information

See [the documentation](https://github.com/anidl/multi-downloader-nx/blob/master/docs/DOCUMENTATION.md) for a complete list of what options are available. You can define defaults for the commands by editing the `cli-defaults.yml` file in the `./config/` directory.

### Example usage

#### Logging in

Most services require you to be logged in, in order to download from, an example of how you would login is:

```shell
AniDL --service {ServiceName} --auth
```

#### Searching

In order to find the IDs to download, you can search from each service by using the `--search` flag like this:

```shell
AniDL --service {ServiceName} --search {SearchTerm}
```

#### Downloading

Once you have the ID which you can obtain from using the search or other means, you are ready to download, which you can do like this:

```shell
AniDL --service {ServiceName} -s {SeasonID} -e {EpisodeNumber}
```

## Building and running from source

### Build Dependencies

Dependencies that are only required for running from code. These are not required if you are using the prebuilt binaries.

* NodeJS >= 14.6.0 (https://nodejs.org/)
* NPM >= 6.9.0 (https://www.npmjs.org/)
* PNPM >= 7.0.0 (https://pnpm.io/)

### Build Instructions

Please note that NodeJS, NPM, and PNPM must be installed on your system. For instructions on how to install pnpm, check (https://pnpm.io/installation)

First clone this repo `git clone https://github.com/anidl/multi-downloader-nx.git`.

`cd` into the cloned directory and run `pnpm i`.
Afterwards run `pnpm run tsc false [true if you want gui, false otherwise]`.

If you want the `js` files you are done. Just `cd` into the `lib` folder, and run `node index.js --help` to get started with the CLI, or run `node gui.js` to run the GUI

If you want to package the application, run pnpm run build-`{platform}`-`{type}` where `{platform}` is the operating system (currently the choices are windows, linux, macos, alpine, android, and arm) and `{type}` is cli or gui.

## DRM Decryption

### Decryption Requirements

* mp4decrypt >= Any (http://www.bento4.com/) - Only required for decrypting

### Instructions

In order to decrypt DRM content, you will need to have a dumped CDM, after that you will need to place the CDM files (`device_client_id_blob` and `device_private_key`) into the `./widevine/` directory. For legal reasons we do not include the CDM with the software, and you will have to source one yourself.
