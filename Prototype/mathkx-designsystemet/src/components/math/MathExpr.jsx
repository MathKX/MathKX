// Renders the prototype notation grammar (src/domain/notation.js) as MathML.
// Unsupported notation is shown verbatim with a visible notice, never dropped.
import { parseNotation } from '../../domain/notation.js';
import { useStore } from '../../store.jsx';

function node(n, k) {
  switch (n.t) {
    case 'row': return <mrow key={k}>{n.c.map((c, i) => node(c, i))}</mrow>;
    case 'mn': return <mn key={k}>{n.v}</mn>;
    case 'mi': return <mi key={k} mathvariant={n.v.length > 1 || n.v === 'Δ' ? 'normal' : undefined}>{n.v}</mi>;
    case 'mo': return <mo key={k}>{n.v}</mo>;
    case 'sup': return <msup key={k}>{node(n.b)}{node(n.e)}</msup>;
    case 'sub': return <msub key={k}>{node(n.b)}{node(n.e)}</msub>;
    case 'frac': return <mfrac key={k}>{node(n.n)}{node(n.d)}</mfrac>;
    case 'prime': return <mrow key={k}>{node(n.b)}<mo lspace="0" rspace="0">′</mo></mrow>;
    default: return null;
  }
}

export function MathExpr({ expr, display = false, className }) {
  const { t } = useStore();
  const r = parseNotation(expr);
  if (!r.ok) {
    if (typeof console !== 'undefined') console.warn(`[MathKX] Unsupported notation in "${expr}": ${r.error}`);
    return (
      <span className="mkx-notation-error" role="note" data-notation-error={r.error}>
        <code>{expr}</code> <span className="text-sm">({t('notation.unsupported')})</span>
      </span>
    );
  }
  return <math display={display ? 'block' : 'inline'} className={className}>{node(r.tree)}</math>;
}
