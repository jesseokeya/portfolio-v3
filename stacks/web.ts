import { NextjsArgs } from "../.sst/platform/src/components/aws";

const props: NextjsArgs = {
  path: "apps/web",
  environment: {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",
    CLOUDFLARE_DEFAULT_ACCOUNT_ID:
      process.env.CLOUDFLARE_DEFAULT_ACCOUNT_ID || "",
    NODE_ENV: $app.stage === "production" ? "production" : "development",
  },
};

if ($app.stage === "production") {
  props.domain = {
    name: "jesseokeya.com",
    dns: sst.cloudflare.dns(),
  };
}

const web = new sst.aws.Nextjs("Web", props);

export { web };
