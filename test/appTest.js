import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { crawlLocalFromFile } from "../crawler/browseClient.js";
import { analyzePage } from "../agent/analyzePage.js";

const sampleFile = path.join(
  new URL(".", import.meta.url).pathname,
  "sample.html"
);

async function runAppTest() {
  console.log("Reading local sample page:", sampleFile);

  const { extractedText } = await crawlLocalFromFile(sampleFile);

  console.log("Extracted text (first 200 chars):", extractedText.slice(0, 200));

  // supply quick metadata
  const metadata = {
    hasPrivacy: false,
    hasCookiesBanner: false,
  };

  try {
    const result = await analyzePage({
      url: "https://demo.local/sample_page",
      title: "Demo Noncompliant Site",
      extracted_text: extractedText,
      metadata,
    });

    console.log("\n=== ANALYSIS RESULT ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error running analyzePage:", err);
  }
}

runAppTest();
