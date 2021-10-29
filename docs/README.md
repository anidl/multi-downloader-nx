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
* `./bin/ffmpeg/ffmpeg.exe`
* `./bin/mkvtoolnix/mkvmerge.exe`

To change these paths you need to edit `bin-path.yml` in `./config/` directory.

### Node Modules

After installing NodeJS with NPM go to directory with `package.json` file and type: `npm i`.
* [check dependencies](https://david-dm.org/anidl/funimation-downloader-nx)

## CLI Options

### Authentication

* `--auth` enter auth mode

### Get Show ID

* `-f`, `--search <s>` sets the show title for search

### Download Video

* `-s <i> -e <s>` sets the show id and episode ids (comma-separated, hyphen-sequence)
* `-q <i>` sets the video layer quality [1...10] (optional, 0 is max)
* `--all` download all videos at once
* `--alt` alternative episode listing (if available)
* `--subLang` select one or more subtile language
* `--allSubs` If set to true, all available subs will get downloaded
* `--dub` select one or more dub languages
* `--allDubs` If set to true, all available dubs will get downloaded
* `--simul` force select simulcast version instead of uncut version
* `-x`, `--server` select server
* `--novids` skip download videos
* `--nosubs` skip download subtitles for Dub (if available)
* `--noaudio` skip downloading audio

### Proxy

The proxy is currently unmainted. Use at your on risk.

* `--proxy <s>` http(s)/socks proxy WHATWG url (ex. https://myproxyhost:1080)
* `--proxy-auth <s>` Colon-separated username and password for proxy
* `--ssp` don't use proxy for stream downloading

### Muxing

`[note] this application mux into mkv by default`
* `--mp4` mux into mp4
* `--mks` add subtitles to mkv or mp4 (if available)

### Filenaming (optional)

* `--fileName`  Set the filename template. Use ${variable_name} to insert variables.
                You may use 'title', 'episode', 'showTitle', 'season', 'width', 'height' as variables.

### Utility

* `--nocleanup` don't delete the input files after the muxing
* `-h`, `--help` show all options

## Filename Template

[Funimation] ${showTitle} - ${episode} [${height}p]"]

## CLI Examples

* `node funi --search "My Hero"` search "My Hero" in title
* `node funi -s 124389 -e 1,2,3` download episodes 1-3 from show with id 124389
* `node funi -s 124389 -e 1-3,2-7,s1-2` download episodes 1-7 and "S"-episodes 1-2 from show with id 124389
* `node funi -s 19373 -e 28-47 -q 7 --allSubs --dub jaJP ptBR` download episodes 28 to 47 with Portuguese (Brazil) and Japanese audio in 720p(HD) resolution with all subtitles available
* `node funi -s 19373 -e 15-30 -q 10 --subLang ptBR enUS --dub jaJP` download episodes 15 to 30 with Japanese audio in 1080p resolution (Full HD) with Portuguese (Brazil) and English subtitles
