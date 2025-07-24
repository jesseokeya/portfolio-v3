import { EmailArgs } from "../.sst/platform/src/components/aws";

const props: EmailArgs = {
  sender: "jesseokeya@gmail.com",
};

if ($app.stage === "production") {
  props.dns = sst.cloudflare.dns();

  // TODO: Change to noreply@jesseokeya.com once domain is verified in SES
  props.sender = "jesseokeya@gmail.com";
}

const email = new sst.aws.Email("Email", props);

export { email };
