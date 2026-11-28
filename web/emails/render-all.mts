/**
 * Renders react-email templates into EmailService/Templates/*.html
 * with {{Token}} placeholders for C# substitution.
 *
 *   npm run emails:build
 *   npm run emails:dev   # preview at http://localhost:3002
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@react-email/render";
import { createElement, type ComponentType } from "react";
import LoanBorrowed from "./LoanBorrowed.tsx";
import LoanDueReminder from "./LoanDueReminder.tsx";
import LoanReturned from "./LoanReturned.tsx";
import WaitlistReady from "./WaitlistReady.tsx";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../src/EmailService/Templates");

function asComponent(mod: unknown, name: string): ComponentType {
  if (typeof mod === "function") {
    return mod as ComponentType;
  }
  if (
    mod &&
    typeof mod === "object" &&
    "default" in mod &&
    typeof (mod as { default: unknown }).default === "function"
  ) {
    return (mod as { default: ComponentType }).default;
  }
  throw new Error(`Invalid email component: ${name}`);
}

const templates: { file: string; Component: ComponentType }[] = [
  { file: "loan-borrowed.html", Component: asComponent(LoanBorrowed, "LoanBorrowed") },
  { file: "loan-returned.html", Component: asComponent(LoanReturned, "LoanReturned") },
  {
    file: "loan-due-reminder.html",
    Component: asComponent(LoanDueReminder, "LoanDueReminder"),
  },
  {
    file: "waitlist-promotion.html",
    Component: asComponent(WaitlistReady, "WaitlistReady"),
  },
];

await mkdir(outDir, { recursive: true });

for (const { file, Component } of templates) {
  const html = await render(createElement(Component));
  const target = path.join(outDir, file);
  await writeFile(target, html, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), target)} (${html.length} B)`);
}

console.log("Email templates ready for EmailService.");
