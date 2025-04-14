// api domains
const domain = {
  www:      'https://www.crunchyroll.com',
  api:      'https://api.crunchyroll.com',
  www_beta: 'https://beta.crunchyroll.com',
  api_beta: 'https://beta-api.crunchyroll.com',
  hd_www:   'https://www.hidive.com',
  hd_api:   'https://api.hidive.com',
  hd_new:   'https://dce-frontoffice.imggaming.com'
};

export type APIType = {
  bundlejs: string,
  newani: string,
  search1: string,
  search2: string,
  rss_cid: string,
  rss_gid: string
  media_page: string
  series_page: string
  auth: string
  // mobile api
  search3: string
  session: string
  collections: string
  // beta api
  beta_auth: string
  defaultUserAgent: string,
  beta_profile: string
  beta_cmsToken: string
  search: string
  cms: string
  beta_browse: string
  beta_cms: string,
  drm: string;
  /**
   * Header
   */
  crunchyAuthHeader: Record<string, string>,
  hd_apikey: string,
  hd_devName: string,
  hd_appId: string,
  hd_clientWeb: string,
  hd_clientExo: string,
  hd_api: string,
  hd_new_api: string,
  hd_new_apiKey: string,
  hd_new_version: string,
}

// api urls
const api: APIType = {
  // web
  bundlejs:          'https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js',
  newani:            `${domain.www}/rss/anime`,
  search1:           `${domain.www}/ajax/?req=RpcApiSearch_GetSearchCandidates`,
  search2:           `${domain.www}/search_page`,
  rss_cid:           `${domain.www}/syndication/feed?type=episodes&id=`, // &lang=enUS
  rss_gid:           `${domain.www}/syndication/feed?type=episodes&group_id=`, // &lang=enUS
  media_page:        `${domain.www}/media-`,
  series_page:       `${domain.www}/series-`,
  auth:              `${domain.www}/login`,
  // mobile api
  search3:           `${domain.api}/autocomplete.0.json`,
  session:           `${domain.api}/start_session.0.json`,
  collections:       `${domain.api}/list_collections.0.json`,
  // new api
  beta_auth:         `${domain.api_beta}/auth/v1/token`,
  // This User-Agent bypasses Cloudflare security by the newer Endpoint
  defaultUserAgent:  'Crunchyroll/4.75.0 (bundle_identifier:com.crunchyroll.iphone; build_number:4100608.433889621) iOS/18.3.2 Gravity/4.75.0',
  beta_profile:      `${domain.api_beta}/accounts/v1/me/profile`,
  beta_cmsToken:     `${domain.api_beta}/index/v2`,
  search:            `${domain.api_beta}/content/v2/discover/search`,
  cms:               `${domain.api_beta}/content/v2/cms`,
  beta_browse:       `${domain.api_beta}/content/v1/browse`,
  beta_cms:          `${domain.api_beta}/cms/v2`,
  // beta api
  drm:               `${domain.api_beta}/drm/v1/auth`,
  crunchyAuthHeader: {},
  //hidive API
  hd_apikey:        '508efd7b42d546e19cc24f4d0b414e57e351ca73',
  hd_devName:       'Android',
  hd_appId:         '24i-Android',
  hd_clientWeb:     'okhttp/3.4.1',
  hd_clientExo:     'smartexoplayer/1.6.0.R (Linux;Android 6.0) ExoPlayerLib/2.6.0',
  hd_api:           `${domain.hd_api}/api/v1`,
  //Hidive New API
  hd_new_api:        `${domain.hd_new}/api`,
  hd_new_apiKey:     '857a1e5d-e35e-4fdf-805b-a87b6f8364bf',
  hd_new_version:    '6.0.1.bbf09a2'
};

// set header
api.crunchyAuthHeader = {
  'User-Agent': api.defaultUserAgent,
  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
};

export {
  domain, api
};
