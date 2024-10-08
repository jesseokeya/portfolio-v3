import { EmailArgs } from "../.sst/platform/src/components/aws";

const props: EmailArgs = {
  sender: "jesseokeya@gmail.com",
};

if ($app.stage === "production") {
  //   props.dns = sst.cloudflare.dns();
  //   props.sender = "jesseokeya.com";
}

const email = new sst.aws.Email("Email", props);

export { email };
