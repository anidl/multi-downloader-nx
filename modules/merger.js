const iso639 = require('iso-639');
const argv = require('../funi').argv

/**
 * @param {string} videoFile 
 * @param {object} audioFile 
 * @param {Array<object>} subtitles 
 * @returns {string}
 */
const buildCommandFFmpeg = (videoFile, audioSettings, subtitles, output) => {
    let args = []
    args.push(`-i "${videoFile}"`)

    if (audioSettings.uri)
        args.push(`-i "${audioSettings.uri}"`)
    for (let index in subtitles) {
        let sub = subtitles[index]
        args.push(`-i "${sub.file}"`)
    }

    args.push('-map 0')
    if (audioSettings.uri)
        args.push( `-map 1`)

    args.push(...subtitles.map((_, index) => `-map ${index + (audioSettings.uri ? 2 : 1)}`))
    args.push(
        '-metadata:s:v:0 title="[Funimation]"',
        `-metadata:s:a:0 language=${getLanguageCode(audioSettings.language, argv.sub ? 'jpn' : 'eng')}`,
        `-c:v copy`,
        `-c:a copy`,
        `-c:s mov_text`,
        `-c:s ass`
    )
    args.push(...subtitles.map((sub, index) => `-metadata:s:${index + 2} language=${getLanguageCode(sub.language)}`))
    args.push(`"${output}"`)
    return args.join(" ")
}

const getLanguageCode = (from, _default = 'eng') => {
    for (let lang in iso639.iso_639_2) {
        let langObj = iso639.iso_639_2[lang];
        if (langObj.hasOwnProperty('639-1') && langObj['639-1'] === from) {
            return langObj['639-2'];
        }
    }
    return _default
}

module.exports = {
    buildCommandFFmpeg,
    getLanguageCode
}