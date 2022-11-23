import { createTRPCProxyClient, httpBatchLink, httpLink } from "@trpc/client";
import type { AppRouter } from "../../../payvc-demo/src/server/routers/_app";
import superjson from "superjson";

export const PAY_VC_URL = process.env.PAY_VC_URL || "http://localhost:3000";

export const trpcClient = createTRPCProxyClient<AppRouter>({
	links: [
		httpLink({
			url: `${PAY_VC_URL}/api/trpc`,
		}),
	],
	transformer: superjson,
});

export async function checkPayVC() {
	const req = await fetch(`${PAY_VC_URL}/api/trpc/healthcheck`);
	const json = await req.json();
	console.log(json);
}
