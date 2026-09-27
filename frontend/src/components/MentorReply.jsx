function Inline({ text }) {
  const parts = String(text || "").split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 3) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part.replace(/\*/g, "")}</span>;
  });
}

export default function MentorBody({ text }) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const nodes = [];
  let para = [];
  let list = [];
  let key = 0;

  const flushPara = () => {
    const next = para.join(" ").trim();
    para = [];
    if (!next) return;
    if (/^\*[^*].*\*$/.test(next) && !next.startsWith("**")) {
      nodes.push(
        <span key={key} className="mn-cite">
          {next.slice(1, -1)}
        </span>
      );
      key += 1;
      return;
    }
    nodes.push(
      <p key={key}>
        <Inline text={next} />
      </p>
    );
    key += 1;
  };

  const flushList = () => {
    if (!list.length) return;
    nodes.push(
      <ul key={key}>
        {list.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
    key += 1;
    list = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
      return;
    }
    if (/^[-•]\s+/.test(line) || /^\*\s+[^*]/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-•]\s+/, "").replace(/^\*\s+/, ""));
      return;
    }
    flushList();
    para.push(line);
  });
  flushList();
  flushPara();
  return nodes;
}