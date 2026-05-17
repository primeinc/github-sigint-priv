// MIT License Copyright (c) 2023 Hassan El Mghari
import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge",
};


const promptTemplateAnalyzeUser = `
You are analyzing an authenticated GitHub inventory snapshot.

- Inventory summary: {{inventorySummary}}

Produce a concise SIGINT-style markdown briefing that focuses on what the accessible repository inventory says about the organization or account set.

The briefing should:

1. Summarize access coverage, including auth mode, owners covered, and public/private/internal repo distribution.
2. Highlight the most important technical concentrations, especially language distribution, recently active repos, archived projects, forks, and owner-level differences.
3. Call out operational observations such as stale areas, likely platform teams, product surfaces, or maintenance hotspots that are directly supported by the inventory.
4. Avoid inventing data that is not present. Explicitly stay within the accessible inventory and do not speculate about hidden repositories.

Format requirements:
- Use markdown headings and bullets.
- Keep it between 250 and 450 words.
- Include a short "Key Risks / Gaps" section when the data suggests one.
- Include a short "Priority Follow-ups" section for an operator or reviewer.
`;

const handler = async (req: Request): Promise<Response> => {
  const { inventorySummary } = (await req.json()) as {
    inventorySummary?: string;
  };

  if (!inventorySummary) {
    return new Response("No prompt in the request", { status: 400 });
  }
  const prompt = promptTemplateAnalyzeUser.replace("{{inventorySummary}}", inventorySummary);
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
