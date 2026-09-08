import React from "react";

export default function Code({ children }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[90%] font-mono">
      {children}
    </code>
  );
}
