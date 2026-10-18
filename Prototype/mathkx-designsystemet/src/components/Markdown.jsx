// Prototype renderer for the PROPOSED lesson format (docs/architecture/proposals/
// lesson-markdown-and-delivery.md). Not a stable contract.
//
// Supported: front matter (title, objective) · ## / ### headings with {#id} ·
// paragraphs · - and 1. lists · | tables · ![alt](assets/file) images ·
// **bold** *italic* · $inline$ and $$display$$ maths (src/domain/notation.js) ·
// :::example{title="" id=""} … ::: · :::visual{type="" …} ::: · :::practice{skill="" variant=""} :::
// Unknown directives and unsupported notation render a visible notice; nothing is dropped.
import { Fragment } from 'react';
import { Heading, Paragraph, Card, Alert } from '@digdir/designsystemet-react';
import { MathExpr } from './math/MathExpr.jsx';

export function parseLesson(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta = {};
  let body = src;
  if (m) {
    body = m[2];
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const blocks = parseBlocks(body.split('\n'));
  const sections = blocks.filter((b) => b.type === 'h2').map((b) => ({ id: b.id, title: b.text }));
  return { meta, blocks, sections };
}

const idOf = (text) => {
  const mm = text.match(/\s*\{#([\w-]+)\}\s*$/);
  return mm ? { text: text.slice(0, mm.index).trim(), id: mm[1] } : { text: text.trim(), id: text.trim().toLowerCase().replace(/[^\w]+/g, '-') };
};
const attrs = (s) => Object.fromEntries([...(s ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

function parseBlocks(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let mm;
    if ((mm = line.match(/^(#{2,3})\s+(.*)$/))) {
      const { text, id } = idOf(mm[2]);
      out.push({ type: mm[1].length === 2 ? 'h2' : 'h3', text, id }); i++; continue;
    }
    if ((mm = line.match(/^:::(\w[\w-]*)(?:\{(.*)\})?\s*$/))) {
      const inner = []; i++;
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++]);
      i++;
      out.push({ type: 'directive', name: mm[1], attrs: attrs(mm[2]), children: parseBlocks(inner) }); continue;
    }
    if ((mm = line.match(/^!\[(.*)\]\((.+)\)\s*$/))) { out.push({ type: 'img', alt: mm[1], src: mm[2] }); i++; continue; }
    if ((mm = line.match(/^\$\$(.+)\$\$\s*$/))) { out.push({ type: 'math', expr: mm[1] }); i++; continue; }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      out.push({ type: 'table', head: rows[0], rows: rows.slice(1) }); continue;
    }
    if (/^(-|\d+\.)\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^(-|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^(-|\d+\.)\s+/, ''));
      out.push({ type: ordered ? 'ol' : 'ul', items }); continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|:::|!\[|\$\$|\||-\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
    out.push({ type: 'p', text: para.join(' ') });
  }
  return out;
}

export function Inline({ text }) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
  let last = 0; let m; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('$')) parts.push(<MathExpr key={k++} expr={tok.slice(1, -1)} />);
    else parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

/** components: { visual: {type: Component}, practice: Component }, assets: {path: url} */
export function Blocks({ blocks, components, assets = {}, unknown }) {
  return blocks.map((b, i) => {
    switch (b.type) {
      case 'h2': return <Heading key={i} level={2} data-size="sm" id={b.id} tabIndex={-1} className="pt-6 scroll-mt-24">{b.text}</Heading>;
      case 'h3': return <Heading key={i} level={3} data-size="xs" id={b.id}>{b.text}</Heading>;
      case 'p': return <Paragraph key={i} data-size="lg"><Inline text={b.text} /></Paragraph>;
      case 'ul': return <ul key={i} className="list-disc pl-6 flex flex-col gap-2 text-lg">{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
      case 'ol': return <ol key={i} className="pl-6 list-decimal flex flex-col gap-2 text-lg">{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
      case 'math': return <div key={i} className="overflow-x-auto" tabIndex={0} role="group" aria-label={b.expr}><MathExpr display expr={b.expr} /></div>;
      case 'img': return (
        <figure key={i} className="m-0 flex flex-col gap-2">
          <div className="rounded-xl p-3 w-fit" style={{ background: '#ffffff', border: '1px solid var(--ds-color-neutral-border-subtle)' }}>
            {assets[b.src] ? <img src={assets[b.src]} alt={b.alt} className="block max-w-full h-auto" /> : <span className="mkx-notation-error">{b.src}</span>}
          </div>
          <figcaption className="text-sm" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{b.alt}</figcaption>
        </figure>
      );
      case 'table': return (
        <div key={i} className="overflow-x-auto" tabIndex={0} role="group" aria-label={b.head.join(', ')}>
          <table className="mkx-table text-lg">
            <thead><tr>{b.head.map((h, j) => <th key={j} scope="col"><Inline text={h} /></th>)}</tr></thead>
            <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, l) => <td key={l}><Inline text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      case 'directive': {
        if (b.name === 'example') return (
          <Card key={i} variant="tinted" data-color="accent" id={b.attrs.id} className="scroll-mt-24">
            <Heading level={3} data-size="xs">{b.attrs.title}</Heading>
            <div className="flex flex-col gap-3"><Blocks blocks={b.children} components={components} assets={assets} unknown={unknown} /></div>
          </Card>
        );
        if (b.name === 'visual' && components.visual?.[b.attrs.type]) { const C = components.visual[b.attrs.type]; return <div key={i}><C {...b.attrs} /></div>; }
        if (b.name === 'practice' && components.practice) { const C = components.practice; return <div key={i}><C {...b.attrs} /></div>; }
        return <Alert key={i} data-color="danger"><Paragraph data-size="sm">{unknown} <code>:::{b.name}{b.attrs.type ? ` type="${b.attrs.type}"` : ''}</code></Paragraph></Alert>;
      }
      default: return null;
    }
  });
}
