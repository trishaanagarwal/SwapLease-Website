// A legal document from a structured array of sections.
// sections: [{ heading: string, body: [string | {list: string[]} ] }]
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="wrap page">
      <div className="grid">
        <header className="span-4 legal__head">
          <h1 style={{ fontSize: 'var(--t-h2)' }}>{title}</h1>
          <p className="muted t-small">Last updated {updated}</p>
          <nav aria-label="Sections" className="legal__toc">
            {sections.map((s, i) => <a key={i} href={`#s${i + 1}`}>{s.heading}</a>)}
          </nav>
        </header>
        <article className="span-7 start-6 prose">
          {intro && <p className="t-lead">{intro}</p>}
          {sections.map((s, i) => (
            <section key={i} id={`s${i + 1}`}>
              <h2>{s.heading}</h2>
              {s.body.map((block, j) => typeof block === 'string'
                ? <p key={j}>{block}</p>
                : <ul key={j}>{block.list.map((li, k) => <li key={k}>{li}</li>)}</ul>)}
            </section>
          ))}
          <p className="muted t-small" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s-5)' }}>
            Questions about this document? Email <a className="link" href="mailto:help@swaplease.homes">help@swaplease.homes</a>
          </p>
        </article>
      </div>
    </div>
  );
}
