import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";
import Footer from "../components/Footer";
import Github from "../components/GitHub";
import Header from "../components/Header";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import MDview from "@/components/mdView";

const exampleReports = [`
# GitHub Inventory Brief

## Coverage
- Auth mode: GitHub App installation
- Owners covered: acme, acme-labs
- Repo mix: 31 private / 6 public / 4 internal

## Technical Signals
- TypeScript and Go dominate the active repo set
- Recently pushed repos cluster around deployment pipelines and internal APIs
- Archived projects are concentrated in a legacy mobile owner

## Key Risks / Gaps
- Admin permissions are concentrated in a small private repo cluster
- Archived forks suggest dependency drift in platform tooling
- Public surface area is much smaller than the private operational footprint

## Priority Follow-ups
1. Review stale private services with high issue counts
2. Confirm whether archived internal forks still back production systems
3. Compare installation coverage against expected org inventory
`];

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [generatedAnalysis, setGeneratedAnalysis] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const [inventorySummary, setInventorySummary] = useState("");
  const [rawData, setRawData] = useState("");

  const outputRef = useRef<null | HTMLDivElement>(null);

  const scrollToOutput = () => {
    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getInventorySummary = async (owner?: string): Promise<string> => {
    const query = owner ? `?owner=${encodeURIComponent(owner)}` : "";
    const response = await fetch(`/api/github/private-summary${query}`);
    const data = await response.json();

    if (!response.ok) {
      window.alert(`Error: ${data.error || response.statusText}`);
      throw new Error(data.error || response.statusText);
    }

    return JSON.stringify(data, null, 2);
  };

  const streamResponse = async (
    endpoint: string,
    payload: Record<string, string>,
    setGenerated: (value: React.SetStateAction<string>) => void
  ) => {
    setGenerated("");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      window.alert(`Error: ${text || response.statusText}`);
      throw new Error(text || response.statusText);
    }

    if (!response.body) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        try {
          const text = JSON.parse(event.data).text ?? "";
          setGenerated((previous) => previous + text);
        } catch (error) {
          console.error(error);
        }
      }
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      parser.feed(decoder.decode(value));
    }

    scrollToOutput();
  };

  const handleAnalyzeInventory = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const summary = await getInventorySummary(ownerFilter.trim() || undefined);
      setInventorySummary(summary);
      setRawData(summary);
      await streamResponse("/api/generate_user", { inventorySummary: summary }, setGeneratedAnalysis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!generatedAnalysis) {
      window.alert("Run the inventory analysis first.");
      return;
    }

    setLoading(true);
    try {
      await streamResponse(
        "/api/generate_profile",
        {
          insight: generatedAnalysis,
          requirements,
        },
        setGeneratedReport
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>github-sigint-priv</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <div className="flex flex-1 w-full flex-col items-center justify-center px-4 mt-12 sm:mt-20">
        <a
          className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm shadow-md transition-colors hover:bg-gray-100 mb-5"
          href="https://github.com/primeinc/github-sigint-priv"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github />
          <p>View repository</p>
        </a>
        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900 text-center">
          Authenticated GitHub inventory collection with AI summaries
        </h1>
        <p className="text-slate-500 mt-5 text-center max-w-2xl">
          Enumerate accessible repos server-side with a GitHub App or user token, aggregate the
          metrics, and turn the result into a concise SIGINT-style report.
        </p>
        <div className="max-w-xl w-full">
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/1-black.png" width={30} height={30} alt="Step 1 icon" />
            <p className="text-left font-medium">
              Collect repository inventory from the authenticated GitHub account or installation.
            </p>
          </div>
          <input
            type="text"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
            placeholder="Optional owner or org filter (e.g. acme)"
          />
          <MDview
            loading={loading}
            handleGenerateBio={handleAnalyzeInventory}
            generatedBios={generatedAnalysis}
            buttonText="Collect inventory and generate analysis"
            title="Inventory analysis"
          />

          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/2-black.png"
              width={30}
              height={30}
              alt="Step 2 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Add optional analyst instructions to tailor the final report.
            </p>
          </div>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
            placeholder="e.g. Focus on stale repos, internal-only services, and owner-level risk concentration."
          />
          <MDview
            loading={loading}
            handleGenerateBio={handleGenerateReport}
            generatedBios={generatedReport}
            buttonText="Generate tailored SIGINT report"
            title="Tailored report"
          />
          <div className="flex flex-row py-2">
            <p onClick={() => setGeneratedReport((prev) => (prev ? "" : exampleReports[0]))}>
              Click to show example report
            </p>
          </div>
          <div className="mt-10" ref={outputRef}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How the collector works</h2>
            <p>(click to inspect the server-side inventory summary)</p>
            <ol className="list-decimal list-inside space-y-2">
              <li className="text-slate-500" onClick={() => setRawData(inventorySummary)}>
                Uses authenticated GitHub API enumeration rather than public-profile scraping.
              </li>
              <li className="text-slate-500" onClick={() => setRawData(inventorySummary)}>
                Aggregates owner, repo, language, visibility, archive, and permission signals
                server-side.
              </li>
              <li className="text-slate-500">
                Feeds the normalized inventory summary into the AI prompt flow for analysis and
                reporting.
              </li>
            </ol>
            <pre className="whitespace-pre-wrap break-words text-sm text-slate-600 mt-4">
              {rawData}
            </pre>
          </div>
        </div>
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <Footer />
      </div>
    </div>
  );
};

export default Home;
