// MIT License Copyright (c) 2023 Hassan El Mghari
import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge",
};

const stylePrompts = [
  `
  use a descriptive briefing structure with sections such as Executive Summary, Coverage, Technical Signals, Risks, and Follow-ups
  for example:
  keep it simple and readable, prioritize evidence and concise conclusions.
  `,
  `
  Use a compact operator-notes structure
  for example:
  - Snapshot
  - Coverage
  - Signals
  - Risks
  - Questions
  Keep it terse, structured, and evidence-backed.
    `,
  `
    use a clean markdown report with short sections, tables or bullets when useful
    avoid decorative filler and keep the focus on inventory analysis
    `
];

const promptTemplateGenerate = `
Craft a polished GitHub inventory report based on authenticated repository analysis and operator requirements.

**Inventory Analysis:** You should take into account the following analysis:
- {{user insights}}

The report should:

- Summarize the most important findings clearly
- Highlight major owner, repo, and language patterns
- Preserve evidence-backed conclusions from the supplied analysis
- Turn the analysis into a cleaner executive/operator briefing

**Style & Design:** The report should be readable and structured. 
You can use a style like:
"""
{{style}}
"""

**Format & Structure:** Use Markdown for the layout with visually appealing elements, such as:

- tables
- bullet lists
- short callout sections

Please adhere to the following guidelines:

- Do not use HTML tags, only Markdown format
- Do not fabricate undisclosed repositories, teams, or incidents
- Avoid decorative profile README language
- Keep it between 300 and 700 words

**Additional Requirements:** In case of extra needs or specifications, they will be provided in this format:
- {{requirements}}

**Output:** Please generate the final report in Markdown format.
`;

const handler = async (req: Request): Promise<Response> => {
  const { insight, requirements } = (await req.json()) as {
    insight?: string;
    requirements?: string;
  };

  if (!insight) {
    return new Response("No prompt in the request", { status: 400 });
  }

  let prompt = promptTemplateGenerate.
    replace("{{user insights}}", insight).
    replace("{{requirements}}", requirements || "");
  // choose a random style prompt
  const stylePrompt = stylePrompts[Math.floor(Math.random() * stylePrompts.length)];
  // add style prompt to the main prompt
  prompt = prompt.replace("{{style}}", stylePrompt);
  console.log(prompt);
  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo-16k",
    messages: [{ role: "user", content: prompt }],
    temperature: 1.2,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);
  // return stream response (SSE)
  return new Response(
    stream, {
    headers: new Headers({
      // since we don't use browser's EventSource interface, specifying content-type is optional.
      // the eventsource-parser library can handle the stream response as SSE, as long as the data format complies with SSE:
      // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#sending_events_from_the_server

      // 'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    })
  }
  );
};

export default handler;
