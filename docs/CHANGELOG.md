## Change Log

This changelog is out of date and wont be continued. Please see the releases comments, or if not present the commit comments.

### 4.7.0 (unreleased)
- Change subtitles parser from ttml to vtt
- Improve help command
- Update modules

#### Known issues:
- Proxy not supported

### 4.6.1 (2020/09/19)
- Update modules

#### Known issues:
- Proxy not supported

### 4.6.0 (2020/06/03)
- Bug fixes and improvements

#### Known issues:
- Proxy not supported

### 4.5.1 (2020/03/10)
- Better binary files handling
- Binary build for windows

#### Known issues:
- Proxy not supported

### 4.5.0 (2020/01/21)
- Resume downloading

#### Known issues:
- Proxy not supported

### 4.4.2 (2019/07/21)
- Better proxy handling for stream download

### 4.4.1 (2019/07/21)
- Fixed proxy for stream download

### 4.4.0 (2019/06/04)
- Added `--novids` option (Thanks to @subdiox)
- Update modules

### 4.3.2 (2019/05/09)
- Code improvements
- Fix `hls-download` error printing

### 4.3.1 (2019/05/09)
- Fix auto detection max quality (Regression in d7d280c)

### 4.3.0 (2019/05/09)
- Better server selection (Closes #42)

### 4.2.1 (2019/05/04)
- Filter duplicate urls for cloudfront.net (Closes #40)

### 4.2.0 (2019/05/02)
- Replace `request` module with `got`
- Changed proxy cli options
- Changed `login` option name to `auth`
- Changed `hls-download` parallel download configuration from 5 parts to 10
- Update modules

### 4.1.0 (2019/04/05)
- CLI options for login moved to CUI
- Removed showing set token at startup

### 4.0.5 (2019/02/09)
- Fix downloading shows with autoselect max quality

### 4.0.4 (2019/01/26)
- Fix search when shows not found
- Update modules

### 4.0.3 (2018/12/06)
- Select only non-encrypted (HLS) streams, encrypted streams is MPEG-DASH

### 4.0.2 (2018/11/25)
- Fix typos and update modules

### 4.0.1 (2018/11/23)
- Code refactoring and small fixes

### 4.0.0 RC 1 (2018/11/17)
- Select range of episodes using hyphen-sequence
- Skip muxing if executables not found
- Fixed typos and duplicate options

### 4.0.0 Beta 2 (2018/11/12)
- Select alternative server
- Updated readme

### 4.0.0 Beta 1 (2018/11/10)
- Rearrange folders structure
- Configuration changed to yaml format
- Muxing changed to MKV by default
- tsMuxeR+mp4box replaced with FFMPEG
- Updated commands help and readme
- Fixed typos and duplicate options
- `ttml2srt` moved to separate module
- Drop `m3u8-stream-list` module
- Code improvements

### 3.2.8 (2018/06/16)
- Fix video request when token not specified

### 3.2.7 (2018/06/15)
- Update modules

### 3.2.6 (2018/02/18)
- Fix commands help

### 3.2.5 (2018/02/12)
- Fixes and update modules

### 3.2.4 (2018/02/01)
- Update modules

### 3.2.3 (2018/01/31)
- Rearrange folders structure

### 3.2.2 (2018/01/16)
- Update modules

### 3.2.1 (2018/01/16)
- Update modules
- Small fixes

### 3.2.0 (2018/01/16)
- `hls-download` module moved to independent module
- Auth for socks proxy

### 3.1.0 (2017/12/30)
- Convert DXFP (TTML) subtitles to SRT format

### 3.0.1 (2017/12/05)
- Check subtitles availability
- Download subtitles in SRT format instead of VTT
- Extended hls download progress info

### 3.0.0 Beta 3 (2017/12/03)
- Restored MKV and MP4 muxing
- Convert VTT subtitles to SRT format

### 3.0.0 Beta 2 (2017/10/18)
- Fix video downloading

### 3.0.0 Beta 1 (2017/10/17)
- Major code changes and improvements
- Drop Streamlink and added own module for hls download

### 2.5.0 (2017/09/04)
- `nosubs` option
- Request video with app api

### 2.4.1 (2017/09/02)
- Fixed typo in package.json
- Fix #11: URL for getting video stream url was changed

### 2.4.0 (2017/07/04)
- IPv4 Socks5 proxy support

### 2.3.3 (2017/06/19)
- Removed forgotten debug code

### 2.3.2 (2017/06/19)
- Fix #5: Script fails to multiplex unique file names

### 2.3.1 (2017/04/29)
- Code improvements

### 2.3.0 (2017/04/27)
- Code improvements

### 2.2.5 (2017/04/17)
- Minor code improvements and fixes

### 2.1.4 (2017/04/10)
- Minor changes

### 2.1.3 (2017/04/10)
- Minor changes and fixes

### 2.1.2 (2017/04/10)
- Fix config path

### 2.1.1 (2017/04/10)
- Minor text changes
- Fix config
- Minor changes

### 2.1.0 (2017/04/10)
- First stable release

### 2.0.0 Beta (lost in time)
- First public release