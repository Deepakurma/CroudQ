import { join } from "path";

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import Handlebars from "handlebars";

const getRequiredEnv = (
  key:
    | "AWS_REGION"
    | "AWS_ACCESS_KEY_ID"
    | "AWS_SECRET_ACCESS_KEY"
    | "AWS_SES_FROM_EMAIL",
) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const sesClient = new SESClient({
  region: getRequiredEnv("AWS_REGION"),
  credentials: {
    accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
  },
});

const getEmailTemplate = async (
  templateName: string,
  data: Record<string, string>,
) => {
  const templatePath = join(
    process.cwd(),
    "src",
    "templates",
    `${templateName}.hbs`,
  );
  const templateContent = await Bun.file(templatePath).text();
  const template = Handlebars.compile(templateContent);
  return template(data);
};

export const sendEmail = async (
  recipientEmail: string,
  subject: string,
  templateName: string,
  templateData: Record<string, string>,
) => {
  const htmlContent = await getEmailTemplate(templateName, templateData);

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [recipientEmail],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: htmlContent,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: getRequiredEnv("AWS_SES_FROM_EMAIL"),
  });

  await sesClient.send(command);
};
