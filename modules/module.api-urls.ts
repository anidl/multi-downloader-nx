// api domains
const domain = {
  cr_www:                 'https://www.crunchyroll.com',
  cr_api:                 'https://api.crunchyroll.com',
  hd_www:                 'https://www.hidive.com',
  hd_api:                 'https://api.hidive.com',
  hd_new:                 'https://dce-frontoffice.imggaming.com'
};

export type APIType = {
  // Crunchyroll Vilos bundle.js
  bundlejs:               string;
  // Crunchyroll API
  auth:                   string;
  profile:                string;
  search:                 string;
  content_cms:            string;
  browse:                 string;
  browse_all_series:      string;
  streaming_sessions:     string;
  drm_widevine:           string;
  drm_playready:          string;
  // Crunchyroll Bucket
  cms_bucket:             string;
  cms_auth:               string;
  // Crunchyroll Headers
  crunchyDefUserAgent:    string;
  crunchyDefHeader:       Record<string, string>;
  crunchyAuthHeader:      Record<string, string>;
  // Hidive
  hd_apikey:              string;
  hd_devName:             string;
  hd_appId:               string;
  hd_clientWeb:           string;
  hd_clientExo:           string;
  hd_api:                 string;
  hd_new_api:             string;
  hd_new_apiKey:          string;
  hd_new_version:         string;
};

const api: APIType = {
  //
  //
  // Crunchyroll
  // Vilos bundle.js (where we can extract the basic token thats needed for the initial auth)
  bundlejs:               'https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js',
  //
  // Crunchyroll API
  auth:                   `${domain.cr_www}/auth/v1/token`,
  profile:                `${domain.cr_www}/accounts/v1/me/profile`,
  search:                 `${domain.cr_www}/content/v2/discover/search`,
  content_cms:            `${domain.cr_www}/content/v2/cms`,
  browse:                 `${domain.cr_www}/content/v1/browse`,
  browse_all_series:      `${domain.cr_www}/content/v2/discover/browse`,
  streaming_sessions:     `${domain.cr_www}/playback/v1/sessions/streaming`,
  drm_widevine:           `${domain.cr_www}/license/v1/license/widevine`,
  drm_playready:          `${domain.cr_www}/license/v1/license/playReady`,
  //
  // Crunchyroll Bucket
  cms_bucket:             `${domain.cr_www}/cms/v2`,
  cms_auth:               `${domain.cr_www}/index/v2`,
  //
  // Crunchyroll Headers
  crunchyDefUserAgent:    'Crunchyroll/4.83.0 (bundle_identifier:com.crunchyroll.iphone; build_number:4254815.324030705) iOS/19.0.0 Gravity/4.83.0',
  crunchyDefHeader:       {},
  crunchyAuthHeader:      {},
  //
  //
  // Hidive
  // Hidive API
  hd_apikey:              '508efd7b42d546e19cc24f4d0b414e57e351ca73',
  hd_devName:             'Android',
  hd_appId:               '24i-Android',
  hd_clientWeb:           'okhttp/3.4.1',
  hd_clientExo:           'smartexoplayer/1.6.0.R (Linux;Android 6.0) ExoPlayerLib/2.6.0',
  hd_api:                 `${domain.hd_api}/api/v1`,
  // Hidive New API
  hd_new_api:             `${domain.hd_new}/api`,
  hd_new_apiKey:          '857a1e5d-e35e-4fdf-805b-a87b6f8364bf',
  hd_new_version:         '6.0.1.bbf09a2'
};

api.crunchyDefHeader = {
  'User-Agent':           api.crunchyDefUserAgent,
  Accept:                 '*/*',
  'Accept-Encoding':      'gzip;q=1.0, compress;q=0.5',
  'Accept-Language':      'de-IT;q=1.0, it-IT;q=0.9, en-GB;q=0.8',
  Connection:             'keep-alive',
  Host:                   'www.crunchyroll.com'
};

// set header
api.crunchyAuthHeader = {
  'Content-Type':         'application/x-www-form-urlencoded; charset=utf-8',
  ...api.crunchyDefHeader
};

export { domain, api };
