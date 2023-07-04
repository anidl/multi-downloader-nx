import { Headers } from 'got/dist/source';

// api domains
const domain = {
  www:      'https://www.crunchyroll.com',
  api:      'https://api.crunchyroll.com',
  www_beta: 'https://beta.crunchyroll.com',
  api_beta: 'https://beta-api.crunchyroll.com',
  hd_www:   'https://www.hidive.com',
  hd_api:   'https://api.hidive.com'
};

export type APIType = {
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
  beta_authBasic: string
  beta_authBasicMob: string
  beta_profile: string
  beta_cmsToken: string
  search: string
  cms: string
  beta_browse: string
  beta_cms: string,
  beta_authHeader: Headers,
  beta_authHeaderMob: Headers,
  hd_apikey: string,
  hd_devName: string,
  hd_appId: string,
  hd_clientWeb: string,
  hd_clientExo: string,
  hd_api: string,
}

// api urls
const api: APIType = {
  // web
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
  // beta api
  beta_auth:         `${domain.api_beta}/auth/v1/token`,
  beta_authBasic:    'Basic bm9haWhkZXZtXzZpeWcwYThsMHE6',
  beta_authBasicMob: 'Basic YTZ5eGxvYW04c2VqaThsZDhldnc6aFQ3d2FjWHhNaURJcDhSNE9kekJybWVoQUtLTEVKUEE=',
  beta_profile:      `${domain.api_beta}/accounts/v1/me/profile`,
  beta_cmsToken:     `${domain.api_beta}/index/v2`,
  search:            `${domain.api_beta}/content/v2/discover/search`,
  cms:               `${domain.api_beta}/content/v2/cms`,
  beta_browse:       `${domain.api_beta}/content/v1/browse`,
  beta_cms:          `${domain.api_beta}/cms/v2`,
  beta_authHeader: {},
  beta_authHeaderMob: {},
  //hidive API
  hd_apikey:        '508efd7b42d546e19cc24f4d0b414e57e351ca73',
  hd_devName:       'Android',
  hd_appId:         '24i-Android',
  hd_clientWeb:     'okhttp/3.4.1',
  hd_clientExo:     'smartexoplayer/1.6.0.R (Linux;Android 6.0) ExoPlayerLib/2.6.0',
  hd_api:           `${domain.hd_api}/api/v1`,
};

// set header
api.beta_authHeader = { 
  Authorization: api.beta_authBasic,
};
api.beta_authHeaderMob = { 
  Authorization: api.beta_authBasicMob,
};

export {
  domain, api
};
