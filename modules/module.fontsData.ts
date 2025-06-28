// fonts src
const root = 'https://static.crunchyroll.com/vilos-v2/web/vilos/assets/libass-fonts/';

// file list
const fontFamilies = {
  'Adobe Arabic': ['AdobeArabic-Bold.otf'],
  'Andale Mono': ['andalemo.ttf'],
  'Arial': ['arial.ttf'],
  'Arial Black': ['ariblk.ttf'],
  'Arial Bold': ['arialbd.ttf'],
  'Arial Bold Italic': ['arialbi.ttf'],
  'Arial Italic': ['ariali.ttf'],
  'Arial Unicode MS': ['arialuni.ttf'],
  'Comic Sans MS': ['comic.ttf'],
  'Comic Sans MS Bold': ['comicbd.ttf'],
  'Courier New': ['cour.ttf'],
  'Courier New Bold': ['courbd.ttf'],
  'Courier New Bold Italic': ['courbi.ttf'],
  'Courier New Italic': ['couri.ttf'],
  'DejaVu LGC Sans Mono': ['DejaVuLGCSansMono.ttf'],
  'DejaVu LGC Sans Mono Bold': ['DejaVuLGCSansMono-Bold.ttf'],
  'DejaVu LGC Sans Mono Bold Oblique': ['DejaVuLGCSansMono-BoldOblique.ttf'],
  'DejaVu LGC Sans Mono Oblique': ['DejaVuLGCSansMono-Oblique.ttf'],
  'DejaVu Sans': ['DejaVuSans.ttf'],
  'DejaVu Sans Bold': ['DejaVuSans-Bold.ttf'],
  'DejaVu Sans Bold Oblique': ['DejaVuSans-BoldOblique.ttf'],
  'DejaVu Sans Condensed': ['DejaVuSansCondensed.ttf'],
  'DejaVu Sans Condensed Bold': ['DejaVuSansCondensed-Bold.ttf'],
  'DejaVu Sans Condensed Bold Oblique': ['DejaVuSansCondensed-BoldOblique.ttf'],
  'DejaVu Sans Condensed Oblique': ['DejaVuSansCondensed-Oblique.ttf'],
  'DejaVu Sans ExtraLight': ['DejaVuSans-ExtraLight.ttf'],
  'DejaVu Sans Mono': ['DejaVuSansMono.ttf'],
  'DejaVu Sans Mono Bold': ['DejaVuSansMono-Bold.ttf'],
  'DejaVu Sans Mono Bold Oblique': ['DejaVuSansMono-BoldOblique.ttf'],
  'DejaVu Sans Mono Oblique': ['DejaVuSansMono-Oblique.ttf'],
  'DejaVu Sans Oblique': ['DejaVuSans-Oblique.ttf'],
  'Gautami': ['gautami.ttf'],
  'Georgia': ['georgia.ttf'],
  'Georgia Bold': ['georgiab.ttf'],
  'Georgia Bold Italic': ['georgiaz.ttf'],
  'Georgia Italic': ['georgiai.ttf'],
  'Impact': ['impact.ttf'],
  'Meera Inimai': ['MeeraInimai-Regular.ttf'],
  'Noto Sans Thai': ['NotoSansThai.ttf'],
  'Rubik': ['Rubik-Regular.ttf'],
  'Rubik Black': ['Rubik-Black.ttf'],
  'Rubik Black Italic': ['Rubik-BlackItalic.ttf'],
  'Rubik Bold': ['Rubik-Bold.ttf'],
  'Rubik Bold Italic': ['Rubik-BoldItalic.ttf'],
  'Rubik Italic': ['Rubik-Italic.ttf'],
  'Rubik Light': ['Rubik-Light.ttf'],
  'Rubik Light Italic': ['Rubik-LightItalic.ttf'],
  'Rubik Medium': ['Rubik-Medium.ttf'],
  'Rubik Medium Italic': ['Rubik-MediumItalic.ttf'],
  'Tahoma': ['tahoma.ttf'],
  'Times New Roman': ['times.ttf'],
  'Times New Roman Bold': ['timesbd.ttf'],
  'Times New Roman Bold Italic': ['timesbi.ttf'],
  'Times New Roman Italic': ['timesi.ttf'],
  'Trebuchet MS': ['trebuc.ttf'],
  'Trebuchet MS Bold': ['trebucbd.ttf'],
  'Trebuchet MS Bold Italic': ['trebucbi.ttf'],
  'Trebuchet MS Italic': ['trebucit.ttf'],
  'Verdana': ['verdana.ttf'],
  'Verdana Bold': ['verdanab.ttf'],
  'Verdana Bold Italic': ['verdanaz.ttf'],
  'Verdana Italic': ['verdanai.ttf'],
  'Vrinda': ['vrinda.ttf'],
  'Vrinda Bold': ['vrindab.ttf'],
  'Webdings': ['webdings.ttf'],
};

// collect styles from ass string
function assFonts(ass: string){
  const strings = ass.replace(/\r/g,'').split('\n');
  const styles: string[] = [];
  for(const s of strings){
    if(s.match(/^Style: /)){
      const addStyle = s.split(',');
      styles.push(addStyle[1]);
    }
  }
  const fontMatches = ass.matchAll(/\\fn([^\\}]+)/g);
  for (const match of fontMatches) {
    styles.push(match[1]);
  }
  return [...new Set(styles)];
}

// font mime type
function fontMime(fontFile: string){
  if(fontFile.match(/\.otf$/)){
    return 'application/vnd.ms-opentype';
  }
  if(fontFile.match(/\.ttf$/)){
    return 'application/x-truetype-font';
  }
  return 'application/octet-stream';
}

export type AvailableFonts = keyof typeof fontFamilies;

// output
export { root, fontFamilies, assFonts, fontMime };
