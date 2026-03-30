// Cloudflare Worker – serves static assets from the same repo
// (Only needed if using Workers. If using Cloudflare Pages, delete this file.)

export default {
  async fetch(request, env, ctx) {
    return env.ASSETS.fetch(request);
  }
};
