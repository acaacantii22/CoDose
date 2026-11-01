window.CODOSE_SUPABASE_CONFIG = Object.freeze({
	projectUrl: 'https://ioutuheuahsvnjzngzdp.supabase.co',
	publishableKey: 'sb_publishable_co_YPQEZl1V7xiRv3X6ebQ_WeKljk3F'
});

if (window.supabase) {
	window.supabaseClient = window.supabase.createClient(
		window.CODOSE_SUPABASE_CONFIG.projectUrl,
		window.CODOSE_SUPABASE_CONFIG.publishableKey
	);
}