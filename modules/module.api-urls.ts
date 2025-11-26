// api domains
const domain = {
	cr_www: 'https://www.crunchyroll.com',
	cr_api: 'https://beta-api.crunchyroll.com',
	cr_playback: 'https://cr-play-service.prd.crunchyrollsvc.com',
	cr_license: 'https://cr-license-proxy.prd.crunchyrollsvc.com',
	hd_www: 'https://www.hidive.com',
	hd_api: 'https://api.hidive.com',
	hd_new: 'https://dce-frontoffice.imggaming.com'
};

export type APIType = {
	// Crunchyroll Vilos bundle.js
	bundlejs: string;
	// Crunchyroll API
	basic_auth_token: string;
	auth: string;
	me: string;
	profile: string;
	search: string;
	content_cms: string;
	content_music: string;
	browse: string;
	browse_all_series: string;
	streaming_sessions: string;
	drm_widevine: string;
	drm_playready: string;
	// Crunchyroll Bucket
	cms_bucket: string;
	cms_auth: string;
	// Crunchyroll Headers
	crunchyDefUserAgent: string;
	crunchyDefHeader: Record<string, any>;
	crunchyAuthHeader: Record<string, string>;
	crunchyAuthRefreshHeader: Record<string, string>;
	// Hidive
	hd_apikey: string;
	hd_devName: string;
	hd_appId: string;
	hd_clientWeb: string;
	hd_clientExo: string;
	hd_api: string;
	hd_new_api: string;
	hd_new_apiKey: string;
	hd_new_version: string;
};

const api: APIType = {
	//
	//
	// Crunchyroll
	// Vilos bundle.js (where we can extract the basic token thats needed for the initial auth)
	bundlejs: 'https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js',
	//
	// Crunchyroll API
	basic_auth_token: 'bmR0aTZicXlqcm9wNXZnZjF0dnU6elpIcS00SEJJVDlDb2FMcnBPREJjRVRCTUNHai1QNlg=',
	auth: `${domain.cr_api}/auth/v1/token`,
	me: `${domain.cr_api}/accounts/v1/me`,
	profile: `${domain.cr_api}/accounts/v1/me/profile`,
	search: `${domain.cr_api}/content/v2/discover/search`,
	content_cms: `${domain.cr_api}/content/v2/cms`,
	content_music: `${domain.cr_api}/content/v2/music`,
	browse: `${domain.cr_api}/content/v1/browse`,
	browse_all_series: `${domain.cr_api}/content/v2/discover/browse`,
	streaming_sessions: `${domain.cr_playback}/v1/sessions/streaming`,
	drm_widevine: `https://cr-license-proxy.prd.crunchyrollsvc.com/v1/license/widevine`,
	drm_playready: `https://cr-license-proxy.prd.crunchyrollsvc.com/v1/license/playReady`,
	//
	// Crunchyroll Bucket
	cms_bucket: `${domain.cr_api}/cms/v2`,
	cms_auth: `${domain.cr_api}/index/v2`,
	//
	// Crunchyroll Headers
	crunchyDefUserAgent: 'Crunchyroll/ANDROIDTV/3.50.0_22282 (Android 12; en-US; SHIELD Android TV Build/SR1A.211012.001)',
	crunchyDefHeader: {},
	crunchyAuthHeader: {},
	crunchyAuthRefreshHeader: {},
	//
	//
	// Hidive
	// Hidive API
	hd_apikey: '508efd7b42d546e19cc24f4d0b414e57e351ca73',
	hd_devName: 'Android',
	hd_appId: '24i-Android',
	hd_clientWeb: 'okhttp/3.4.1',
	hd_clientExo: 'smartexoplayer/1.6.0.R (Linux;Android 6.0) ExoPlayerLib/2.6.0',
	hd_api: `${domain.hd_api}/api/v1`,
	// Hidive New API
	hd_new_api: `${domain.hd_new}/api`,
	hd_new_apiKey: '857a1e5d-e35e-4fdf-805b-a87b6f8364bf',
	hd_new_version: '6.0.1.bbf09a2'
};

api.crunchyDefHeader = {
	'User-Agent': api.crunchyDefUserAgent,
	'Accept-Encoding': 'gzip',
	Connection: 'Keep-Alive',
	Host: 'www.crunchyroll.com'
};

// set header
api.crunchyAuthHeader = {
	Accept: 'application/json',
	'Accept-Charset': 'UTF-8',
	'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
	'Request-Type': 'SignIn',
	...api.crunchyDefHeader
};

// set header
api.crunchyAuthRefreshHeader = {
	Accept: 'application/json',
	'Accept-Charset': 'UTF-8',
	'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
	...api.crunchyDefHeader
};

export { domain, api };
