// fonts src
const root = 'https://static.crunchyroll.com/vilos-v2/web/vilos/assets/libass-fonts/';

// file list
const fontFamilies = {
  'Adobe Arabic': [ 'AdobeArabic-Bold.otf', ],
  'Andale Mono': [ 'andalemo.ttf', ],
  'Arial': [ 'arial.ttf', 'arialbd.ttf', 'arialbi.ttf', 'ariali.ttf', ],
  'Arial Unicode MS': [ 'arialuni.ttf', ],
  'Arial Black': [ 'ariblk.ttf', ],
  'Comic Sans MS': [ 'comic.ttf', 'comicbd.ttf', ],
  'Courier New': [ 'cour.ttf', 'courbd.ttf', 'courbi.ttf', 'couri.ttf', ],
  'DejaVu LGC Sans Mono': [ 'DejaVuLGCSansMono-Bold.ttf', 'DejaVuLGCSansMono-BoldOblique.ttf', 'DejaVuLGCSansMono-Oblique.ttf', 'DejaVuLGCSansMono.ttf', ],
  'DejaVu Sans': [ 'DejaVuSans-Bold.ttf', 'DejaVuSans-BoldOblique.ttf', 'DejaVuSans-ExtraLight.ttf', 'DejaVuSans-Oblique.ttf', 'DejaVuSans.ttf', ],
  'DejaVu Sans Condensed': [ 'DejaVuSansCondensed-Bold.ttf', 'DejaVuSansCondensed-BoldOblique.ttf', 'DejaVuSansCondensed-Oblique.ttf', 'DejaVuSansCondensed.ttf', ],
  'DejaVu Sans Mono': [ 'DejaVuSansMono-Bold.ttf', 'DejaVuSansMono-BoldOblique.ttf', 'DejaVuSansMono-Oblique.ttf', 'DejaVuSansMono.ttf', ],
  'Georgia': [ 'georgia.ttf', 'georgiab.ttf', 'georgiai.ttf', 'georgiaz.ttf', ],
  'Impact': [ 'impact.ttf', ],
  'Rubik Black': [ 'Rubik-Black.ttf', 'Rubik-BlackItalic.ttf', ],
  'Rubik': [ 'Rubik-Bold.ttf', 'Rubik-BoldItalic.ttf', 'Rubik-Italic.ttf', 'Rubik-Light.ttf', 'Rubik-LightItalic.ttf', 'Rubik-Medium.ttf', 'Rubik-MediumItalic.ttf', 'Rubik-Regular.ttf', ],
  'Tahoma': [ 'tahoma.ttf', ],
  'Times New Roman': [ 'times.ttf', 'timesbd.ttf', 'timesbi.ttf', 'timesi.ttf', ],
  'Trebuchet MS': [ 'trebuc.ttf', 'trebucbd.ttf', 'trebucbi.ttf', 'trebucit.ttf', ],
  'Verdana': [ 'verdana.ttf', 'verdanab.ttf', 'verdanai.ttf', 'verdanaz.ttf', ],
  'Webdings': [ 'webdings.ttf', ],
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
