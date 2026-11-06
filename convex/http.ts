import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Stripe sends payment events here. In Stripe, point the webhook to
// https://<your-deployment>.convex.site/stripe/webhook
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });
    const payload = await request.text();
    const result = await ctx.runAction(internal.payments.handleStripeWebhook, { payload, signature });
    return new Response(null, { status: result.ok ? 200 : 400 });
  }),
});

export default http;
