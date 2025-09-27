// crawler/browser_client.js
import fs from "fs";
import path from "path";
import cheerio from "cheerio";

/**
 * crawlWithAgentCore(url)
 * -----------------------
 * TEMPLATE: Replace TODO sections with your AgentCore / Nova Act code.
 *
 * Purpose: start a Browser primitive session, navigate to the URL, take screenshot, extract visible text,
 * return { screenshotBuffer, extractedText }.
 *
 * NOTE: AgentCore SDK APIs vary; consult the AgentCore sample repo for exact method names and auth steps.
 */
export async function crawlWithAgentCore(url) {
  // TODO: Replace the pseudocode below with your AgentCore / Nova Act code.

  const client = new AgentCoreClient({ region: "us-west-2" });
  const session = await client.createBrowserSession({
    /* role, settings */
  });

  await session.navigate(url);

  const screenshotBuffer = await session.takeScreenshot({ fullPage: true });
  const extractedText = await session.evaluate(() => document.body.innerText);

  await session.close();

  return { screenshotBuffer, extractedText };
}

/**
 * crawlLocalFromFile(filePath)
 * ----------------------------
 * Working fallback for local testing/demos that don't require AgentCore.
 * Reads an HTML file and returns extracted visible text and null screenshot.
 *
 * @param {string} filePath
 * @returns { Promise<{ screenshotBuffer: null, extractedText: string }> }
 */
export async function crawlLocalFromFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);

  // remove script/style to avoid noise
  $("script, style, noscript").remove();
  const visibleText = $("body").text().replace(/\s+/g, " ").trim();

  return { screenshotBuffer: null, extractedText: visibleText };
}
