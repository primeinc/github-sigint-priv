import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ExampleBioComponent = () => {

    const exampleBios = [`
    # GitHub Inventory Brief

    ## Coverage
    - Auth mode: GitHub App installation
    - Owners covered: acme, acme-labs
    - Repo mix: 31 private / 6 public / 4 internal

    ## Technical Signals
    - TypeScript and Go dominate active repos
    - Most recent pushes cluster around deployment tooling and internal APIs
    - Archived repos are concentrated in a legacy mobile stack

    ## Risks / Gaps
    - Several internal services have admin-only access concentration
    - Archived forks suggest dependency drift in platform tooling
    - Limited public surface compared with private operational footprint

    ## Priority Follow-ups
    1. Review stale private services with high issue counts
    2. Confirm whether archived internal forks still back production systems
    3. Compare installation coverage against expected org inventory
    `];


    const [exampleBio, setExampleBio] = useState("");

    return (
        <div className="space-y-8 flex flex-col items-center max-w-xl mx-auto">
            <div className="flex flex-row">
                <p
                    onClick={() => setExampleBio((prev) => prev ? "" : exampleBios[0])}
                >
                    Click to show generated example
                </p>
            </div>

            {exampleBio && <div className="bg-white rounded-xl shadow-mdhover:bg-gray-100 transition cursor-copy border">
                <div className="markdown-body p-4">
                    <ReactMarkdown children={exampleBio} />
                </div>
            </div>}
        </div>
    );
}

export default ExampleBioComponent;
