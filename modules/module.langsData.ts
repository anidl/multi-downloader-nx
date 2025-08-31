// available langs

export type LanguageItem = {
  cr_locale?: string,
  hd_locale?: string,
  adn_locale?: string,
  new_hd_locale?: string,
  ao_locale?: string,
  locale: string,
  code: string,
  name: string,
  language?: string
}

const languages: LanguageItem[] = [
  { cr_locale: 'en-US', new_hd_locale: 'en-US', hd_locale: 'English', locale: 'en', code: 'eng', name: 'English' },
  { cr_locale: 'en-IN', locale: 'en-IN', code: 'eng', name: 'English (India)', },
  { cr_locale: 'es-LA', new_hd_locale: 'es-MX', hd_locale: 'Spanish LatAm', locale: 'es-419', code: 'spa', name: 'Spanish', language: 'Latin American Spanish' },
  { cr_locale: 'es-419',ao_locale: 'es',hd_locale: 'Spanish', locale: 'es-419', code: 'spa-419', name: 'Spanish', language: 'Latin American Spanish' },
  { cr_locale: 'es-ES', new_hd_locale: 'es-ES', hd_locale: 'Spanish Europe', locale: 'es-ES', code: 'spa-ES', name: 'Castilian', language: 'European Spanish' },
  { cr_locale: 'pt-BR', ao_locale: 'pt',new_hd_locale: 'pt-BR', hd_locale: 'Portuguese', locale: 'pt-BR', code: 'por', name: 'Portuguese', language: 'Brazilian Portuguese' },
  { cr_locale: 'pt-PT', locale: 'pt-PT', code: 'por', name: 'Portuguese (Portugal)', language: 'Portugues (Portugal)' },
  { cr_locale: 'fr-FR', adn_locale: 'fr', hd_locale: 'French', locale: 'fr', code: 'fra', name: 'French' },
  { cr_locale: 'de-DE', adn_locale: 'de', hd_locale: 'German', locale: 'de', code: 'deu', name: 'German' },
  { cr_locale: 'ar-ME', locale: 'ar', code: 'ara-ME', name: 'Arabic' },
  { cr_locale: 'ar-SA', hd_locale: 'Arabic', locale: 'ar', code: 'ara', name: 'Arabic (Saudi Arabia)' },
  { cr_locale: 'it-IT', hd_locale: 'Italian', locale: 'it', code: 'ita', name: 'Italian' },
  { cr_locale: 'ru-RU', hd_locale: 'Russian', locale: 'ru', code: 'rus', name: 'Russian' },
  { cr_locale: 'tr-TR', hd_locale: 'Turkish', locale: 'tr', code: 'tur', name: 'Turkish' },
  { cr_locale: 'hi-IN', locale: 'hi', code: 'hin', name: 'Hindi' },
  { locale: 'zh', code: 'cmn', name: 'Chinese (Mandarin, PRC)' },
  { cr_locale: 'zh-CN', locale: 'zh-CN', code: 'zho', name: 'Chinese (Mainland China)' },
  { cr_locale: 'zh-TW', locale: 'zh-TW', code: 'chi', name: 'Chinese (Taiwan)' },
  { cr_locale: 'zh-HK', locale: 'zh-HK', code: 'zh-HK', name: 'Chinese (Hong-Kong)', language: '中文 (粵語)' },
  { cr_locale: 'ko-KR', hd_locale: 'Korean', locale: 'ko', code: 'kor', name: 'Korean' },
  { cr_locale: 'ca-ES', locale: 'ca-ES', code: 'cat', name: 'Catalan' },
  { cr_locale: 'pl-PL', locale: 'pl-PL', code: 'pol', name: 'Polish' },
  { cr_locale: 'th-TH', locale: 'th-TH', code: 'tha', name: 'Thai', language: 'ไทย' },
  { cr_locale: 'ta-IN', locale: 'ta-IN', code: 'tam', name: 'Tamil (India)', language: 'தமிழ்' },
  { cr_locale: 'ms-MY', locale: 'ms-MY', code: 'may', name: 'Malay (Malaysia)', language: 'Bahasa Melayu' },
  { cr_locale: 'vi-VN', locale: 'vi-VN', code: 'vie', name: 'Vietnamese', language: 'Tiếng Việt' },
  { cr_locale: 'id-ID', locale: 'id-ID', code: 'ind', name: 'Indonesian', language: 'Bahasa Indonesia' },
  { cr_locale: 'te-IN', locale: 'te-IN', code: 'tel', name: 'Telugu (India)', language: 'తెలుగు' },
  { cr_locale: 'ja-JP', adn_locale: 'ja', ao_locale: 'ja', hd_locale: 'Japanese', locale: 'ja', code: 'jpn', name: 'Japanese' },
  { locale: 'un', code: 'und', name: 'Undetermined', language: 'Undetermined', new_hd_locale: 'und', cr_locale: 'und', adn_locale: 'und', ao_locale: 'und' },
];

// add en language names
(() =>{
  for(const languageIndex in languages){
    if(!languages[languageIndex].language){
      languages[languageIndex].language = languages[languageIndex].name;
    }
  }
})();

// construct dub language codes
const dubLanguageCodes = (() => {
  const dubLanguageCodesArray: string[] = [];
  for(const language of languages){
    dubLanguageCodesArray.push(language.code);
  }
  return [...new Set(dubLanguageCodesArray)];
})();

// construct subtitle languages filter
const subtitleLanguagesFilter = (() => {
  const subtitleLanguagesExtraParameters = ['all', 'none'];
  return [...subtitleLanguagesExtraParameters, ...new Set(languages.map(l => { return l.locale; }))];
})();

const searchLocales = (() => {
  return ['', ...new Set(languages.map(l => { return l.cr_locale; }).slice(0, -1)), ...new Set(languages.map(l => { return l.adn_locale; }).slice(0, -1))];
})();

export const aoSearchLocales = (() => {
  return ['', ...new Set(languages.map(l => { return l.ao_locale; }).slice(0, -1))];
})();

// convert
const fixLanguageTag = (tag: string) => {
  tag = typeof tag == 'string' ? tag : 'und'; 
  const tagLangLC = tag.match(/^(\w{2})-?(\w{2})$/);
  if(tagLangLC){
    const tagLang = `${tagLangLC[1]}-${tagLangLC[2].toUpperCase()}`;
    if(findLang(tagLang).cr_locale != 'und'){
      return findLang(tagLang).cr_locale;
    }
    else{
      return tagLang;
    }
  }
  else{
    return tag;
  }
};

// find lang by cr_locale
const findLang = (cr_locale: string) => {
  const lang = languages.find(l => { return l.cr_locale == cr_locale; });
  return lang ? lang : languages.find(l => l.code === 'und') || { cr_locale: 'und', locale: 'un', code: 'und', name: 'Undetermined', language: 'Undetermined' };
};

const fixAndFindCrLC = (cr_locale: string) => {
  const str = fixLanguageTag(cr_locale);
  return findLang(str || '');
};

// rss subs lang parser
const parseRssSubtitlesString = (subs: string) => {
  const splitMap = subs.replace(/\s/g, '').split(',').map((s) => {
    return fixAndFindCrLC(s).locale;
  });
  const sort = sortTags(splitMap);
  return sort.join(', ');
};


// parse subtitles Array
const parseSubtitlesArray = (tags: string[]) => {
  const sort = sortSubtitles(tags.map((t) => {
    return { locale: fixAndFindCrLC(t).locale };
  }));
  return sort.map((t) => { return t.locale; }).join(', ');
};

// sort subtitles
const sortSubtitles = <T extends {
  [key: string]: unknown
} = Record<string, string>> (data: T[], sortkey?: keyof T) : T[] => {
  const idx: Record<string, number> = {};
  const key = sortkey || 'locale' as keyof T;
  const tags = [...new Set(Object.values(languages).map(e => e.locale))];
  for(const l of tags){
    idx[l] = Object.keys(idx).length + 1;
  }
  data.sort((a, b) => {
    const ia = idx[a[key] as string] ? idx[a[key] as string] : 50;
    const ib = idx[b[key] as string] ? idx[b[key] as string] : 50;
    return ia - ib;
  });
  return data;
};

const sortTags = (data: string[]) => {
  const retData = data.map(e => { return { locale: e }; });
  const sort = sortSubtitles(retData);
  return sort.map(e => e.locale as string);
};

const subsFile = (fnOutput:string, subsIndex: string, langItem: LanguageItem, isCC: boolean, ccTag: string, isSigns?: boolean, format?: string) => {
  subsIndex = (parseInt(subsIndex) + 1).toString().padStart(2, '0');
  return `${fnOutput}.${subsIndex}.${langItem.code}.${langItem.language}${isCC ? `.${ccTag}` : ''}${isSigns ? '.signs' : ''}.${format ? format : 'ass'}`;
};

// construct dub langs const
const dubLanguages = (() => {
  const dubDb: Record<string, string> = {};
  for(const lang of languages){
    if(!Object.keys(dubDb).includes(lang.name)){
      dubDb[lang.name] = lang.code;
    }
  }
  return dubDb;
})();

// dub regex
const dubRegExpStr =
    `\\((${Object.keys(dubLanguages).join('|')})(?: (Dub|VO))?\\)$`;
const dubRegExp = new RegExp(dubRegExpStr);

// code to lang name
const langCode2name = (code: string) => {
  const codeIdx = dubLanguageCodes.indexOf(code);
  return Object.keys(dubLanguages)[codeIdx];
};

// locale to lang name
const locale2language = (locale: string) => {
  const filteredLocale = languages.filter(l => {
    return l.locale == locale;
  });
  return filteredLocale[0];
};

// output
export {
  languages,
  dubLanguageCodes,
  dubLanguages,
  langCode2name,
  locale2language,
  dubRegExp,
  subtitleLanguagesFilter,
  searchLocales,
  fixLanguageTag,
  findLang,
  fixAndFindCrLC,
  parseRssSubtitlesString,
  parseSubtitlesArray,
  sortSubtitles,
  sortTags,
  subsFile,
};
