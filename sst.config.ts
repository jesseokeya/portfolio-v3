/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "portfolio",
      removal: input?.stage === "production" ? "retain" : "remove",
      region: "us-east-1",
      home: "aws",
      providers: { cloudflare: "5.40.1" },
    };
  },
  async run() {
    const { web } = await import("./stacks");
    return {
      webUrl: web.url,
      environment: $app.stage,
    };
  },
});
