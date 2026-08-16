import { logger } from "../../fastify";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type StructuredJsonRequest = {
  schemaName: string;
  schema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
};

type OpenAiResponseItem = {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type OpenAiResponsesPayload = {
  id?: string;
  output_text?: string;
  error?: {
    message?: string;
  };
  output?: OpenAiResponseItem[];
};

//extracts the actuall text or output that we require from the output object or json
const extractOutputText = (payload: OpenAiResponsesPayload) => {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  let text = "";
  for (const item of payload.output || []) {
    if (item.type !== "message") {
      continue;
    }

    for (const contentItem of item.content || []) {
      if (contentItem.type === "output_text" && contentItem.text) {
        text += contentItem.text;
      }
    }
  }

  text = text.trim();

  if (!text) {
    throw new Error("OpenAI did not return any output text");
  }

  return text;
};

export const generateStructuredJson = async ({
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
  maxOutputTokens = 2500,
}: StructuredJsonRequest) => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      store: false,
      reasoning: {
        effort: "low",
      },
      max_output_tokens: maxOutputTokens,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          schema,
          strict: true,
        },
      },
    }),
  });

  const payload = (await response.json()) as OpenAiResponsesPayload;

  if (!response.ok) {
    const message =
      payload.error?.message || `OpenAI request failed with ${response.status}`;
    logger.error(
      {
        status: response.status,
        schemaName,
        message,
      },
      "OpenAI structured response request failed",
    );
    throw new Error(message);
  }

  const outputText = extractOutputText(payload);

  return {
    parsedJson: JSON.parse(outputText) as unknown,
  };
};
