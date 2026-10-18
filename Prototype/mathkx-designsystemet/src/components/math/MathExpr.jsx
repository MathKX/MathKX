// Renders a simple expression string ("x + 3 − 3 = 7 − 3") as MathML.
// MathML gives screen readers a semantic structure; browsers render it natively.
const TOKEN = /\s*(\d+(?:[.,]\d+)?|[a-zA-Z]|[+\-−=×·?()□])\s*/g;

export function tokenize(expr) {
  const out = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(expr))) out.push(m[1]);
  return out;
}

export function MathExpr({ expr, display = false, className, label }) {
  const toks = tokenize(expr);
  return (
    <math display={display ? 'block' : 'inline'} className={className} aria-label={label}>
      <mrow>
        {toks.map((tk, i) => {
          if (/^\d/.test(tk)) return <mn key={i}>{tk}</mn>;
          if (/^[a-zA-Z]$/.test(tk)) return <mi key={i}>{tk}</mi>;
          const sym = tk === '-' ? '−' : tk;
          return <mo key={i}>{sym}</mo>;
        })}
      </mrow>
    </math>
  );
}
