process.env.isGUI = 'true';

void (async () => {
	await import('./modules/log');
	await import('./gui/server/index');
})();
