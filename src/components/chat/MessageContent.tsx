import { Fragment, type ReactNode } from "react";

/**
 * Formato ligero y seguro (sin HTML): párrafos, listas con «- » o «1. »
 * y negritas con **texto**. Suficiente para las respuestas del mentor.
 */

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

const UL = /^\s*[-•]\s+/;
const OL = /^\s*\d+[.)]\s+/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    if (lines.every((l) => UL.test(l))) {
      blocks.push({ kind: "ul", items: lines.map((l) => l.replace(UL, "")) });
    } else if (lines.every((l) => OL.test(l))) {
      blocks.push({ kind: "ol", items: lines.map((l) => l.replace(OL, "")) });
    } else {
      blocks.push({ kind: "p", lines });
    }
  }
  return blocks;
}

export default function MessageContent({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {parseBlocks(text).map((block, i) => {
        if (block.kind === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-violet-400/70">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-violet-300/80">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
