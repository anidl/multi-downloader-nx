const iso639 = require('iso-639');

/**
 * @param {Array<object>} videoAndAudio 
 * @param {Array<object>} onlyVid 
 * @param {Array<object>} onlyAudio
 * @param {Array<object>} subtitles 
 * @param {string} output
 * @returns {string}
 */
const buildCommandFFmpeg = (videoAndAudio, onlyVid, onlyAudio, subtitles, output) => {
    let args = [];
    let metaData = [];

    let index = 0;
    let hasVideo = false;
    for (let vid of videoAndAudio) {
        args.push(`-i "${vid.path}"`);
        if (!hasVideo) {
            metaData.push(`-map ${index}`);
            metaData.push(`-metadata:s:a:${index} language=${getLanguageCode(vid.lang, vid.lang)}`);
            metaData.push(`-metadata:s:v:${index} title="[Funimation]"`);
            hasVideo = true;
        } else {
            metaData.push(`-map ${index}:a`);
            metaData.push(`-metadata:s:a:${index} language=${getLanguageCode(vid.lang, vid.lang)}`);
        }
        index++;
    }

    for (let vid of onlyVid) {
        if (!hasVideo) {
            args.push(`-i "${vid.path}"`);
            metaData.push(`-map ${index}`);
            metaData.push(`-metadata:s:a:${index} language=${getLanguageCode(vid.lang, vid.lang)}`);
            metaData.push(`-metadata:s:v:${index} title="[Funimation]"`);
            hasVideo = true;
            index++;
        }
    }

    for (let aud of onlyAudio) {
        args.push(`-i "${aud.path}"`);
        metaData.push(`-map ${index}`);
        metaData.push(`-metadata:s:a:${index} language=${getLanguageCode(aud.lang, aud.lang)}`);
        index++;
    }

    for (let index in subtitles) {
        let sub = subtitles[index];
        args.push(`-i "${sub.file}"`);
    }

    args.push(...metaData);
    args.push(...subtitles.map((_, subIndex) => `-map ${subIndex + index}`));
    args.push(
        '-c:v copy',
        '-c:a copy'
    );
    args.push(output.split('.').pop().toLowerCase() === 'mp4' ? '-c:s mov_text' : '-c:s ass');
    args.push(...subtitles.map((sub, index) => `-metadata:s:${index + 2} language=${getLanguageCode(sub.language)}`));
    args.push(`"${output}"`);
    return args.join(' ');
};

/**
 * @param {string} videoFile 
 * @param {object} audioFile 
 * @param {Array<object>} subtitles 
 * @returns {string}
 */
const buildCommandMkvMerge = (videoAndAudio, onlyVid, onlyAudio, subtitles, output) => {
    let args = [];

    let hasVideo = false;

    args.push(`-o "${output}"`);
    args.push(
        '--global-tags "./tag.xml"',
    );

    for (let vid of onlyVid) {
        if (!hasVideo) {
            args.push(
                '--video-tracks 0',
                '--no-audio'
            );
            args.push('--track-name 0:[Funimation]');
            hasVideo = true;
            args.push(`"${vid.path}"`);
        }
    }

    for (let vid of videoAndAudio) {
        if (!hasVideo) {
            args.push(
                '--video-tracks 0',
                '--audio-tracks 1'
            );
            args.push('--track-name 0:[Funimation]');
            let trackName = subDict[vid.lang];
            args.push('--track-name',`1:"${trackName}"`);
            args.push(`--language 1:${getLanguageCode(vid.lang, vid.lang)}`);
            hasVideo = true;
        } else {
            args.push(
                '--no-video',
                '--audio-tracks 1'
            );
            let trackName = subDict[vid.lang];
            args.push('--track-name',`1:"${trackName}"`);
            args.push(`--language 1:${getLanguageCode(vid.lang, vid.lang)}`);
        }
        args.push(`"${vid.path}"`);
    }

    for (let aud of onlyAudio) {
        let trackName = subDict[aud.lang];
        args.push('--track-name',`0:"${trackName}"`);
        args.push(`--language 0:${getLanguageCode(aud.lang, aud.lang)}`);
        args.push(
            '--no-video',
            '--audio-tracks 0'
        );
        args.push(`"${aud.path}"`);
    }

    if(subtitles.length > 0){
        for (let subObj of subtitles) {
    let trackName = subDict[subObj.language];
    args.push('--track-name',`0:"${trackName}"`);
    args.push('--language',`0:${getLanguageCode(subObj.language)}`);
    args.push(`"${subObj.file}"`);
}
    } else {
        args.push(
            '--no-subtitles',
            '--no-attachments'
        );
    }

    return args.join(' ');
};
const subDict = {
    'en': 'English (United State)',
    'es': 'Español (Latinoamericano)',
    'pt': 'Português (Brasil)',
    'ja': '日本語'
};
const getLanguageCode = (from, _default = 'eng') => {
    for (let lang in iso639.iso_639_2) {
        let langObj = iso639.iso_639_2[lang];
        if (Object.prototype.hasOwnProperty.call(langObj, '639-1') && langObj['639-1'] === from) {
            return langObj['639-2'];
        }
    }
    return _default;
};

module.exports = {
    buildCommandFFmpeg,
    getLanguageCode,
    buildCommandMkvMerge
};