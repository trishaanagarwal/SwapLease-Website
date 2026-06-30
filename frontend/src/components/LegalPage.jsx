import { Link } from 'react-router-dom';
import { t } from '../theme';

// Renders a legal document from a structured array of sections.
// sections: [{ heading: string, body: [string | {list: string[]} ] }]
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div style={{ minHeight: '100vh', background: t.cream }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 22px 72px' }}>

        <Link to="/" style={{ color: t.coralDeep, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>← Back to SwapLease</Link>

        <h1 className="font-display" style={{ fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 800, color: t.ink, margin: '20px 0 8px', lineHeight: 1.1 }}>{title}</h1>
        <p style={{ color: t.inkFaint, fontSize: 14, margin: '0 0 28px', fontWeight: 600 }}>Last updated: {updated}</p>

        <div style={{ background: '#fff', borderRadius: t.radiusLg, border: `1px solid ${t.border}`, padding: '34px 38px', boxShadow: t.shadowSm }}>
          {intro && (
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: t.inkSoft, margin: '0 0 28px', fontWeight: 500 }}>{intro}</p>
          )}

          {sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 28 }}>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: t.ink, margin: '0 0 12px' }}>
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((block, j) =>
                typeof block === 'string' ? (
                  <p key={j} style={{ fontSize: 15, lineHeight: 1.72, color: t.inkSoft, margin: '0 0 12px' }}>{block}</p>
                ) : (
                  <ul key={j} style={{ margin: '0 0 12px', paddingLeft: 22 }}>
                    {block.list.map((li, k) => (
                      <li key={k} style={{ fontSize: 15, lineHeight: 1.7, color: t.inkSoft, marginBottom: 7 }}>{li}</li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ))}

          <div style={{ marginTop: 32, paddingTop: 22, borderTop: `1px solid ${t.border}`, fontSize: 13.5, color: t.inkFaint, lineHeight: 1.6 }}>
            Questions about this document? Contact us at <strong style={{ color: t.inkSoft }}>help@swaplease.homes</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
