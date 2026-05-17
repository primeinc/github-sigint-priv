import React from 'react';
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center h-16 sm:h-20 w-full sm:pt-2 pt-4 border-t mt-5 flex sm:flex-row flex-col justify-between items-center px-3 space-y-3 sm:mb-0 mb-3">
      <div>
        Powered by{" "}
        <a
          href="https://openai.com/blog/chatgpt"
          target="_blank"
          rel="noreferrer"
          className="font-bold hover:underline transition underline-offset-2"
        >
          OpenAI{" "}
        </a>
        and authenticated GitHub API inventory collection.
      </div>
      <div className="flex space-x-4 pb-4 sm:pb-0">
        <a
          href="https://github.com/primeinc/github-sigint-priv"
          target="_blank"
          rel="noreferrer"
          className="font-bold hover:underline transition underline-offset-2"
        >
          GitHub
        </a>
        <Link
          href="https://docs.github.com/en/rest/repos/repos#list-repositories-for-the-authenticated-user"
          className="group"
          aria-label="GitHub REST API documentation"
        >
          <span className="font-bold hover:underline transition underline-offset-2">
            REST API docs
          </span>
        </Link>
      </div>
    </footer>
  );
}
