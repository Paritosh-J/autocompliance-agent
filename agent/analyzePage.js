import fs from "fs";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.AWS_REGION || "us-west-2";
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || ""; // set in .env

if (!BEDROCK_MODEL_ID) {
  console.warn(
    "Warning: BEDROCK_MODEL_ID not set. Set it in .env before calling live Bedrock."
  );
}

const client = new BedrockRuntimeClient({
  region: REGION,
});

// load prompt templalte
const promptTemplate = fs.readFileSync(
  new URL("./prompts/analyzePagePrompt.md", import.meta.url),
  "utf8"
);

/**
 * analyzePage - call Bedrock LLM with the prompt and return parsed JSON
 * @param {Object} input - { url, title, extracted_text, metadata }
 * @returns {Object} parsed JSON per schema in prompt
 */
export async function analyzePage({ url, title, extractedText, metadata }) {
  const promptInput = `
        ${promptTemplate}

        INPUT:
        {
            "url":"${url}",
            "title":"${title}",
            "extracted_text":"${escapeForPrompt(extracted_text)}",
            "metadata":${JSON.stringify(metadata)}
        }
    `;

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    contentType: "application/json",
    body: JSON.stringify({
      input: promptInput,
      // interferenece parameters: temperature = 0 [deterministic output in tests]
      temperature: 0,
      max_tokens: 1500,
    }),
  });

  // send to Bedrock
  const res = await client.send(command);

  // parse string response from bedrock runtime
  const text = await streamToString(res.body);

  // parse JSON from response
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("LLM didn't return valid JSON. Raw output: ", text);
    throw err;
  }
}

function escapeForPrompt(s) {
  return s.replaceAll("\n", "\\n").replaceAll('"', '\\"');
}

async function streamToString(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

// local test
if (import.meta.url === `file://${process.argv[1]}`) {
  async () => {
    const out = await analyzePage({
      url: "https://demo.example/noncompliant1",
      title: "Demo Site",
      extracted_text:
        "We collect email addresses from contact forms. No privacy policy seen on the site. Contact: contact@acme.com",
      metadata: { hasPrivacy: false, hasCookiesBanner: false },
    });
    console.log(JSON.stringify(out, null, 2));
  };
}
