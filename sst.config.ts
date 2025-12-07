/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "portfolio",
      removal: input?.stage === "production" ? "retain" : "remove",
      region: "us-east-1",
      home: "aws",
      providers: { cloudflare: "6.10.0" },
    };
  },
  async run() {
    const { web, email } = await import("./stacks");
    return {
      webUrl: web.url,
      sender: email.sender,
      environment: $app.stage,
    };
  },
});
