<<<<<<< HEAD
export * from "./web";
=======
import { NextjsArgs } from "../.sst/platform/src/components/aws";

const props: NextjsArgs = {};

if ($app.stage === "production") {
  props.domain = {
    name: "jesseokeya.com",
    dns: sst.cloudflare.dns(),
  };
}

const web = new sst.aws.Nextjs("Web", props);

export { web };
>>>>>>> main
