import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status: number, origin: string) => new Response(
	JSON.stringify(body),
	{
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Vary": "Origin",
		},
	},
);

Deno.serve(async (request) => {
	const origin = request.headers.get("origin") ?? "";
	const allowedOrigins = (Deno.env.get("APP_ORIGINS") ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
	const corsOrigin = allowedOrigins.includes(origin) ? origin : "null";

	if (request.method === "OPTIONS") return json({}, 200, corsOrigin);
	if (!allowedOrigins.includes(origin)) return json({ error: "Origin is not allowed" }, 403, corsOrigin);
	if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);

	try {
		const body = await request.json();
		const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
		const password = typeof body.password === "string" ? body.password : "";
		if (!/^[a-z0-9._-]{3,32}$/.test(username) || !password) {
			return json({ error: "Username atau password salah" }, 401, corsOrigin);
		}

		const projectUrl = Deno.env.get("SUPABASE_URL");
		const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		if (!projectUrl || !publishableKey || !serviceRoleKey) {
			console.error("Missing required Supabase Edge Function secrets");
			return json({ error: "Layanan login belum dikonfigurasi" }, 500, corsOrigin);
		}

		const admin = createClient(projectUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});
		const publicClient = createClient(projectUrl, publishableKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		});

		const { data: profile, error: profileError } = await admin
			.from("profiles")
			.select("id")
			.eq("username_normalized", username)
			.maybeSingle();
		if (profileError) {
			console.error("Username lookup failed", profileError.code);
			return json({ error: "Layanan login belum dapat memproses permintaan" }, 503, corsOrigin);
		}
		if (!profile) return json({ error: "Username atau password salah" }, 401, corsOrigin);

		const { data: account, error: accountError } = await admin.auth.admin.getUserById(profile.id);
		if (accountError || !account.user?.email) return json({ error: "Username atau password salah" }, 401, corsOrigin);

		const { data: signedIn, error: signInError } = await publicClient.auth.signInWithPassword({
			email: account.user.email,
			password,
		});
		if (signInError || !signedIn.session) return json({ error: "Username atau password salah" }, 401, corsOrigin);

		return json({
			access_token: signedIn.session.access_token,
			refresh_token: signedIn.session.refresh_token,
		}, 200, corsOrigin);
	} catch (error) {
		console.error("Username login failed", error instanceof Error ? error.message : "Unknown error");
		return json({ error: "Permintaan login tidak dapat diproses" }, 400, corsOrigin);
	}
});