# multi-downloader-nx (3.1.0v)

If you find any bugs in this documentation or in the programm itself please report it [over on GitHub](https://github.com/anidl/multi-downloader-nx/issues).

## Legal Warning

This application is not endorsed by or affiliated with *Funimation* or *Crunchyroll*.
This application enables you to download videos for offline viewing which may be forbidden by law in your country.
The usage of this application may also cause a violation of the *Terms of Service* between you and the stream provider.
This tool is not responsible for your actions; please make an informed decision before using this application.

## CLI Options
### Legend
 - `${someText}` shows that you should replace this text with your own
    - e.g. `--username ${someText}` -> `--username Izuco`

### Authentication
#### `--auth`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--auth ` | `boolean` | `No`| `NaN` | `NaN` |

Most of the shows on both services are only accessible if you payed for the service.
In order for them to know who you are you are required to log in.
If you trigger this command, you will be prompted for the username and password for the selected service
#### `--username`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--username ${username}` | `string` | `No`| `NaN` | `undefined`| `username: ` |

Set the username to use for the authentication. If not provided, you will be prompted for the input
#### `--password`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--password ${password}` | `string` | `No`| `NaN` | `undefined`| `password: ` |

Set the password to use for the authentication. If not provided, you will be prompted for the input
#### `--silentAuth`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--silentAuth ` | `boolean` | `No`| `NaN` | `false`| `silentAuth: ` |

Authenticate every time the script runs. Use at your own risk.
### Fonts
#### `--dlFonts`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--dlFonts ` | `boolean` | `No`| `NaN` | `NaN` |

Crunchyroll uses a variaty of fonts for the subtitles.
Use this command to download all the fonts and add them to the muxed **mkv** file.
#### `--fontName`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Funimation | `--fontName ${fontName}` | `string` | `No`| `NaN` | `NaN` |

Set the font to use in subtiles
### Search
#### `--search`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--search ${search}` | `string` | `No`| `-f` | `NaN` |

Search of an anime by the given string
#### `--search-type`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--search-type ${type}` | `string` | `No`| `NaN` | [`''`, `top_results`, `series`, `movie_listing`, `episode`] | ``| `search-type: ` |

Search only for type of anime listings (e.g. episodes, series)
#### `--page`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--page ${page}` | `number` | `No`| `-p` | `NaN` |

The output is organized in pages. Use this command to output the items for the given page
#### `--search-locale`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--search-locale ${locale}` | `string` | `No`| `NaN` | [`''`, `en-US`, `es-LA`, `es-419`, `es-ES`, `pt-BR`, `fr-FR`, `de-DE`, `ar-ME`, `ar-SA`, `it-IT`, `ru-RU`, `tr-TR`, `hi-IN`, `zh-CN`, `ko-KR`] | ``| `search-locale: ` |

Set the search local that will be used for searching for items.
#### `--new`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--new ` | `boolean` | `No`| `NaN` | `NaN` |

Get last updated series list
### Downloading
#### `--movie-listing`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--movie-listing ${ID}` | `string` | `No`| `--flm` | `NaN` |

Get video list by Movie Listing ID
#### `--series`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--series ${ID}` | `string` | `No`| `--srz` | `NaN` |

This command is used only for crunchyroll.
 Requested is the ID of a show not a season.
#### `-s`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `-s ${ID}` | `string` | `No`| `NaN` | `NaN` |

Used to set the season ID to download from
#### `-e`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `-e ${selection}` | `string` | `No`| `--episode` | `NaN` |

Set the episode(s) to download from any given show.
For multiple selection: 1-4 OR 1,2,3,4 
For special episodes: S1-4 OR S1,S2,S3,S4 where S is the special letter
#### `-q`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `-q ${qualityLevel}` | `number` | `No`| `NaN` | `0`| `q: ` |

Set the quality level. Use 0 to use the maximum quality.
#### `--dlVideoOnce`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--dlVideoOnce ` | `boolean` | `No`| `NaN` | `false`| `dlVideoOnce: ` |

If selected, the best selected quality will be downloaded only for the first language,
then the worst video quality with the same audio quality will be downloaded for every other language.
By the later merge of the videos, no quality difference will be present.
This will speed up the download speed, if multiple languages are selected.
#### `-x`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Both | `-x ${server}` | `number` | `No`| `--server` | [`1`, `2`, `3`, `4`] | `1`| `x: ` |

Select the server to use
#### `--kstream`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--kstream ${stream}` | `number` | `No`| `-k` | [`1`, `2`, `3`, `4`, `5`, `6`, `7`] | `1`| `kstream: ` |

Select specific stream
#### `--hslang`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Crunchyroll | `--hslang ${hslang}` | `string` | `No`| `NaN` | [`none`, `en`, `es-419`, `es-ES`, `pt`, `pt-BR`, `fr`, `de`, `ar`, `it`, `ru`, `tr`, `hi`, `zh`, `ko`, `ja`] | `none`| `hslang: ` |

Download video with specific hardsubs
#### `--dlsubs`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Both | `--dlsubs ${sub1} ${sub2}` | `array` | `No`| `NaN` | [`all`, `none`, `en`, `es-419`, `es-ES`, `pt`, `pt-BR`, `fr`, `de`, `ar`, `it`, `ru`, `tr`, `hi`, `zh`, `ko`, `ja`] | `all`| `dlsubs: ` |

Download subtitles by language tag (space-separated)
Funi Only: zh
Crunchy Only: es-419, es-ES, fr, de, ar, ar, it, ru, tr, hi, zh, ko
#### `--novids`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--novids ` | `boolean` | `No`| `NaN` | `NaN` |

Skip downloading videos
#### `--noaudio`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--noaudio ` | `boolean` | `No`| `NaN` | `NaN` |

Skip downloading audio
#### `--nosubs`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--nosubs ` | `boolean` | `No`| `NaN` | `NaN` |

Skip downloading subtitles
#### `--dubLang`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Both | `--dubLang ${dub1} ${dub2}` | `array` | `No`| `NaN` | [`eng`, `spa-419`, `spa-ES`, `por`, `fra`, `deu`, `ara`, `ita`, `rus`, `tur`, `hin`, `cmn`, `zho`, `kor`, `jpn`] | `jpn`| `dubLang: ` |

Set the language to download: 
Funi Only: cmn
Crunchy Only: spa-419, spa-ES, fra, deu, ara, ara, ita, rus, tur, hin, zho, kor
#### `--all`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--all ` | `boolean` | `No`| `NaN` | `false`| `all: ` |

Used to download all episodes from the show
#### `--fontSize`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--fontSize ${fontSize}` | `number` | `No`| `NaN` | `55`| `fontSize: ` |

Used to set the fontsize of the subtitles
#### `--allDubs`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--allDubs ` | `boolean` | `No`| `NaN` | `NaN` |

If selected, all available dubs will get downloaded
#### `--timeout`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--timeout ${timeout}` | `number` | `No`| `NaN` | `15000`| `timeout: ` |

Set the timeout of all download reqests. Set in millisecods
#### `--simul`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Funimation | `--simul ` | `boolean` | `No`| `NaN` | `false`| `simul: ` |

Force downloading simulcast version instead of uncut version (if available).
#### `--but`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--but ` | `boolean` | `No`| `NaN` | `NaN` |

Download everything but the -e selection
#### `--downloadArchive`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--downloadArchive ` | `boolean` | `No`| `NaN` | `NaN` |

Used to download all archived shows
#### `--addArchive`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--addArchive ` | `boolean` | `No`| `NaN` | `NaN` |

Used to add the `-s` and `--srz` to downloadArchive
#### `--partsize`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--partsize ${amount}` | `number` | `No`| `NaN` | `10`| `partsize: ` |

Set the amount of parts to download at once
If you have a good connection try incresing this number to get a higher overall speed
#### `--fsRetryTime`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--fsRetryTime ${time in seconds}` | `number` | `No`| `NaN` | `5`| `fsRetryTime: ` |

Set the time the downloader waits before retrying if an error while writing the file occurs
#### `--force`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--force ${option}` | `string` | `No`| `NaN` | [`y`, `Y`, `n`, `N`, `c`, `C`] | `NaN` |

If a file already exists, the tool will ask you how to proceed. With this, you can answer in advance.
### Muxing
#### `--mp4`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--mp4 ` | `boolean` | `No`| `NaN` | `false`| `mp4: ` |

If selected, the output file will be an mp4 file (not recommended tho)
#### `--skipmux`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--skipmux ` | `boolean` | `No`| `NaN` | `NaN` |

Skip muxing video, audio and subtitles
#### `--nocleanup`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--nocleanup ` | `boolean` | `No`| `NaN` | `false`| `nocleanup: ` |

Don't delete subtitle, audio and video files after muxing
#### `--skipSubMux`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--skipSubMux ` | `boolean` | `No`| `NaN` | `false`| `skipSubMux: ` |

Skip muxing the subtitles
#### `--forceMuxer`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Both | `--forceMuxer ${muxer}` | `string` | `No`| `NaN` | [`ffmpeg`, `mkvmerge`] | `undefined`| `forceMuxer: ` |

Force the program to use said muxer or don't mux if the given muxer is not present
#### `--videoTitle`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--videoTitle ${title}` | `string` | `No`| `NaN` | `NaN` |

Set the video track name of the merged file
#### `--mkvmergeOptions`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--mkvmergeOptions ${args}` | `array` | `No`| `NaN` | `--no-date,--disable-track-statistics-tags,--engage no_variable_data`| `mkvmergeOptions: ` |

Set the options given to mkvmerge
#### `--ffmpegOptions`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--ffmpegOptions ${args}` | `array` | `No`| `NaN` | ``| `ffmpegOptions: ` |

Set the options given to ffmpeg
#### `--defaultAudio`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--defaultAudio ${args}` | `string` | `No`| `NaN` | `eng`| `defaultAudio: ` |

Set the default audio track by language code
Possible Values: eng, spa-419, spa-419, spa-ES, por, por, fra, deu, ara, ara, ita, rus, tur, hin, cmn, zho, kor, jpn
#### `--defaultSub`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--defaultSub ${args}` | `string` | `No`| `NaN` | `eng`| `defaultSub: ` |

Set the default subtitle track by language code
Possible Values: eng, spa-419, spa-419, spa-ES, por, por, fra, deu, ara, ara, ita, rus, tur, hin, cmn, zho, kor, jpn
### Filename Template
#### `--fileName`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--fileName ${fileName}` | `string` | `No`| `NaN` | `[${service}] ${showTitle} - S${season}E${episode} [${height}p]`| `fileName: ` |

Set the filename template. Use ${variable_name} to insert variables.
You can also create folders by inserting a path seperator in the filename
You may use 'title', 'episode', 'showTitle', 'season', 'width', 'height', 'service' as variables.
#### `--numbers`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--numbers ${number}` | `number` | `No`| `NaN` | `2`| `numbers: ` |

Set how long a number in the title should be at least.
Set in config: 3; Episode number: 5; Output: 005
Set in config: 2; Episode number: 1; Output: 01
Set in config: 1; Episode number: 20; Output: 20
#### `--override`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--override "${toOverride}='${value}'"` | `array` | `No`| `NaN` | ``| `override: ` |

Override a template variable
#### `--ccTag`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--ccTag ${tag}` | `string` | `No`| `NaN` | `cc`| `ccTag: ` |

Used to set the name for subtitles that contain tranlations for none verbal communication (e.g. signs)
### Debug
#### `--nosess`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--nosess ` | `boolean` | `No`| `NaN` | `false`| `nosess: ` |

Reset session cookie for testing purposes
#### `--debug`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--debug ` | `boolean` | `No`| `NaN` | `false`| `debug: ` |

Debug mode (tokens may be revealed in the console output)
### Utilities
#### `--service`
| **Service** | **Usage** | **Type** | **Required** | **Alias** | **Choices** | **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | --- | ---| 
| Both | `--service ${service}` | `string` | `Yes`| `NaN` | [`funi`, `crunchy`] | ``| `service: ` |

Set the service you want to use
#### `--update`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--update ` | `boolean` | `No`| `NaN` | `NaN` |

Force the tool to check for updates (code version only)
#### `--skipUpdate`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **Default** |**cli-default Entry**
| --- | --- | --- | --- | --- | --- | ---| 
| Both | `--skipUpdate ` | `boolean` | `No`| `NaN` | `false`| `skipUpdate: ` |

If true, the tool won't check for updates
### Help
#### `--help`
| **Service** | **Usage** | **Type** | **Required** | **Alias** |  **cli-default Entry**
| --- | --- | --- | --- | --- | ---| 
| Both | `--help ` | `boolean` | `No`| `-h` | `NaN` |

Show the help output
