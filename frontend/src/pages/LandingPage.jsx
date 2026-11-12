/*
  type: software (site-kind software): a web app for student lease transfers in Melbourne
  deal: hero product (photo stand-in), nav nav-mega, close close-type, footer footer-dark, rhythm dark-band,
        buttons pill, mark arc, palette mint-pink-accounts, type outfit, radius soft, lit ground sage,
        effect none, moment line-carries-colour (#requests, the dark band)
  screens: hero 1 · app-frame 1 · steps 1 · requests 1 · faq 1 · footer.closing 1

  The page is built on the taste-skill kit in public/assets. Its CSS and scripts load only while this page
  is mounted, so the signed-in app keeps its own styles.
*/
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CSS = [
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400..700&family=DM+Mono:wght@400;500&display=swap',
  '/assets/system.css',
  '/assets/ui/cards.css',
  '/assets/motion/motion.css',
  '/assets/backgrounds/backgrounds.css',
  '/assets/layout/layout.css',
  '/assets/icons/icon.css',
  '/landing.css',
  '/assets/ui/base.css',
  ...['window', 'chat', 'checklist', 'search', 'notify', 'doc'].map(n => `/assets/ui/${n}/fragment.css`),
];
const SCRIPTS = ['/assets/system.js', '/assets/motion/motion.js', '/assets/layout/layout.js'];
const HTML_ATTRS = { 'data-type': 'software', 'data-radius': 'soft', 'data-ground': 'sage', 'data-buttons': 'pill', 'data-motion': '' };
const METAS = { 'site-kind': 'software', 'page-type': 'software' };
const KIT_CLASSES = ['m-enter', 'm-enter-done', 'mo-js', 'mo-safe'];

function useKit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const added = [];
    Object.entries(HTML_ATTRS).forEach(([k, v]) => html.setAttribute(k, v));
    html.classList.add('m-enter', 'mo-js');
    const t1 = setTimeout(() => html.classList.add('m-enter-done'), 700);
    const t2 = setTimeout(() => html.classList.add('mo-safe'), 2500);
    Object.entries(METAS).forEach(([name, content]) => {
      const m = Object.assign(document.createElement('meta'), { name, content });
      document.head.appendChild(m); added.push(m);
    });
    const loads = CSS.map(href => new Promise(res => {
      const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href, onload: res, onerror: res });
      document.head.appendChild(l); added.push(l);
    }));
    const bg = Object.assign(document.createElement('script'), { src: '/assets/backgrounds/backgrounds.js' });
    document.head.appendChild(bg); added.push(bg);
    Promise.all(loads).then(() => setReady(true));

    return () => {
      clearTimeout(t1); clearTimeout(t2);
      added.forEach(el => el.remove());
      [...Object.keys(HTML_ATTRS), 'data-tone', 'data-ready', 'data-broken', 'data-bar'].forEach(k => html.removeAttribute(k));
      html.classList.remove(...KIT_CLASSES);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (window.__kitModules) { window.__kitModules.forEach(m => m.default?.init?.()); return; }
    // a plain module script, so Vite does not rewrite the imports of these public files
    const s = Object.assign(document.createElement('script'), { type: 'module' });
    s.textContent = SCRIPTS.map((src, i) => `import * as m${i} from '${src}';`).join('') +
      `window.__kitModules = [${SCRIPTS.map((_, i) => `m${i}`).join(',')}];`;
    document.body.appendChild(s);
  }, [ready]);

  return ready;
}

const Arrow = () => (
  <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path className="m-arrow__stem" d="M1 6h8" /><path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
);
const Check = () => <svg viewBox="0 0 16 16"><path d="m4.5 8.2 2.3 2.3 4.7-5" /></svg>;
const DocIcon = () => <svg className="ui-icon" viewBox="0 0 16 16"><path d="M4 2.5h5l3 3v8H4z" /><path d="M9 2.5v3h3" /></svg>;
const Mark = () => <span className="mark" data-mark="arc" aria-hidden="true" />;

const LEASES = [
  ['CA', 1, 'Carlton', '2-bed apartment · $385/wk', 'Available', '2h'],
  ['FI', 3, 'Fitzroy', 'Room in a 3-bed terrace · $290/wk', 'Available', '5h'],
  ['BR', 4, 'Brunswick', 'Studio near Sydney Rd · $340/wk', 'Available', '9h'],
  ['PA', 2, 'Parkville', 'Room in a student apartment · $315/wk', 'Enquiry', '1d'],
  ['CL', 5, 'Clayton', 'Room near Monash · $240/wk', 'Taken', '1d'],
  ['SO', 3, 'Southbank', '1-bed apartment · $450/wk', 'Available', '2d'],
  ['RI', 1, 'Richmond', 'Room in a share house · $275/wk', 'Taken', '2d'],
  ['SK', 4, 'St Kilda', 'Studio off Fitzroy St · $360/wk', 'Available', '3d'],
  ['FO', 2, 'Footscray', 'Room in a 4-bed house · $230/wk', 'Taken', '4d'],
  ['HA', 5, 'Hawthorn', 'Room near Swinburne · $300/wk', 'Available', '5d'],
];
const stClass = s => s === 'Taken' ? 'ui-win__st is-done' : 'ui-win__st';

const FAQ = [
  ['Does SwapLease cost anything?', 'No. Listing a lease, posting a request and messaging other students are all free.'],
  ['Does my landlord have to agree?', 'Yes. A lease transfer needs the landlord or agent to approve it in writing before anyone moves in.'],
  ['Is SwapLease a real estate agent?', 'No. We don’t sign leases, hold bonds or collect rent. You deal with the other student and the landlord.'],
  ['Who can join?', 'Anyone who verifies their email address. It’s built for students at Melbourne’s universities.'],
  ['How do I avoid scams?', 'Inspect the place in person or on a live video call, and pay nothing before a transfer is signed.'],
  ['Can I list a place for a friend?', 'Yes. Add their name when you list it, with a link where students can reach them.'],
];

const SUBURB_LINKS = [['Carlton', 'Near Melbourne Uni'], ['Parkville', 'Next to the main campus'], ['Brunswick', 'On the 19 tram'], ['Clayton', 'Near Monash Clayton']];

export default function LandingPage() {
  const ready = useKit();
  if (!ready) return null;

  return (
    <>
      <header className="nav">
        <div className="wrap nav__bar">
          <a className="skip-link" href="#top">Skip to content</a>
          <Link className="nav__logo" to="/"><Mark />SwapLease</Link>
          <nav className="nav__links" aria-label="Main">
            <div className="nav__item">
              <Link className="nav__link" to="/listings">Leases <svg className="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              <div className="nav__menu">
                <div className="wrap grid">
                  <div className="menu-col span-3">
                    <p className="t-label">By suburb</p>
                    {SUBURB_LINKS.map(([s, line]) => (
                      <Link key={s} to={`/listings?search=${s}`}>{s}<span>{line}</span></Link>
                    ))}
                  </div>
                  <div className="menu-col span-3">
                    <p className="t-label">Browse</p>
                    <Link to="/listings">All leases<span>Every place on offer</span></Link>
                    <Link to="/roommates">Requests<span>Students looking for a room</span></Link>
                    <Link to="/saved">Saved<span>Places you bookmarked</span></Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="nav__item"><Link className="nav__link" to="/roommates">Requests</Link></div>
            <div className="nav__item"><a className="nav__link" href="#steps">Steps</a></div>
            <div className="nav__item"><a className="nav__link" href="#faq">Questions</a></div>
          </nav>
          <div className="nav__actions">
            <Link className="nav__link" to="/login">Sign in</Link>
            <Link className="btn btn--primary" to="/create-listing">List your lease</Link>
          </div>
          <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      <main id="top">
        {/* HERO: product stage holding a photograph (stand-in: Drummond Street, Carlton; replace with SwapLease's own shot) */}
        <section className="hero hero--product" data-enter aria-labelledby="hero-h">
          <div className="wrap"><div className="hero-text hero__in">
            <div className="hero__head">
              <div>
                <h1 id="hero-h">Student lease transfers in Melbourne</h1>
                <p className="hero__lead">Moving out before your lease ends? List your place for $0 and hand it to another student. Looking for a room? Message the student who lives there.</p>
              </div>
              <div className="btn-row">
                <Link className="btn btn--primary" to="/create-listing">List your lease<Arrow /></Link>
                <Link className="btn btn--secondary" to="/listings">Browse leases</Link>
              </div>
            </div>
            <div className="hero__stage">
              <picture>
                <source media="(max-width: 639px)" srcSet="/assets/img/terraces-phone-640.jpg 640w, /assets/img/terraces-phone-960.jpg 960w" sizes="100vw" />
                <img src="/assets/img/terraces-1800.jpg" srcSet="/assets/img/terraces-800.jpg 800w, /assets/img/terraces-1280.jpg 1280w, /assets/img/terraces-1800.jpg 1800w" sizes="100vw"
                  alt="A row of Victorian terrace houses with iron-lace balconies on a street in Carlton" style={{ '--ly-pos': '50% 45%' }}
                  fetchPriority="high" data-source="stand-in" data-subject="terrace houses in Carlton, Melbourne" />
              </picture>
            </div>
          </div></div>
        </section>

        {/* APP-FRAME: the product big, the lease list beside an open conversation */}
        <section className="section" id="leases" aria-labelledby="leases-h">
          <div className="wrap">
            <div className="grid">
              <h2 className="span-5" id="leases-h">Leases from students, by suburb</h2>
              <p className="span-6 start-7">Every listing shows the weekly rent, the dates and the nearest uni. Open one and message the student holding the lease. <Link className="link" to="/listings">Browse leases</Link></p>
            </div>
            <div className="ui app fill" role="img" aria-label="The SwapLease app: a list of leases by suburb beside a conversation about a 2-bed apartment in Carlton" data-ui-pause-host>
              <div className="app__pane app__pane--list">
                <div className="ui ui-panel ui-win" data-ui="window" data-open="Available" data-work="Enquiry" data-done="Taken">
                  <div className="ui-win__bar">
                    <span className="ui-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span className="ui-win__crumb">SwapLease <i>/</i> <b>Leases</b></span>
                    <span className="ui-spacer"></span>
                    <span className="ui-win__search" aria-hidden="true"><svg className="ui-icon" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg><span className="ui-win__ph">Search</span><span className="ui-kbd">/</span></span>
                  </div>
                  <div className="ui-win__body">
                    <nav className="ui-win__side" aria-hidden="true">
                      <span className="ui-win__nav is-on"><svg className="ui-icon" viewBox="0 0 16 16"><path d="M2.5 7.5 8 3l5.5 4.5v6h-11z" /></svg>Leases</span>
                      <span className="ui-win__nav"><svg className="ui-icon" viewBox="0 0 16 16"><circle cx="8" cy="6" r="2.5" /><path d="M3.5 13.5c.6-2.3 2.4-3.5 4.5-3.5s3.9 1.2 4.5 3.5" /></svg>Requests</span>
                      <span className="ui-win__nav"><svg className="ui-icon" viewBox="0 0 16 16"><path d="M4.5 2.5h7v11L8 11l-3.5 2.5z" /></svg>Saved</span>
                      <span className="ui-win__nav"><svg className="ui-icon" viewBox="0 0 16 16"><path d="M2.5 4.5h11v8h-11z" /><path d="m2.5 5 5.5 4 5.5-4" /></svg>Messages</span>
                      <span className="ui-win__label">Suburbs</span>
                      <span className="ui-win__nav"><span className="ui-win__hash">#</span>Carlton</span>
                      <span className="ui-win__nav"><span className="ui-win__hash">#</span>Brunswick</span>
                    </nav>
                    <div className="ui-win__main">
                      <div className="ui-win__cols" aria-hidden="true"><span>Suburb</span><span>Place</span><span>Status</span><span>Listed</span></div>
                      <ul className="ui-win__rows">
                        {LEASES.map(([ini, tone, who, sub, st, age]) => (
                          <li key={who} className="ui-win__row" data-row><span className="ui-avatar" data-tone={tone}>{ini}</span><span className="ui-win__who">{who}</span><span className="ui-win__sub">{sub}</span><span className={stClass(st)} data-st>{st}</span><span className="ui-win__age">{age}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="app__pane app__pane--open" data-ui-loop>
                <div className="ui ui-panel ui-chat" data-ui="chat">
                  <div className="ui-head">
                    <span className="ui-agent" aria-hidden="true"></span>
                    <div className="ui-title">2-bed apartment, Carlton</div>
                    <span className="ui-chat__online">Online</span>
                    <span className="ui-spacer"></span>
                  </div>
                  <div className="ui-chat__body">
                    <div className="ui-chat__day">Today, 9:41</div>
                    <div className="ui-msg ui-msg--me" data-chat-q>
                      <span className="ui-msg__text">Hi! Is the room still free from 1 August? I’m starting at Melbourne Uni.</span>
                    </div>
                    <div className="ui-msg ui-msg--bot" data-chat-a>
                      <span className="ui-agent ui-msg__av" aria-hidden="true"></span>
                      <span className="ui-msg__col">
                        <span className="ui-chat__answer">Yes, from 1 August until the lease ends in January. Rent is <b>$385 a week</b>, bills split two ways.</span>
                        <span className="ui-chat__srcs">
                          <span className="ui-chat__src"><DocIcon />Listing, Carlton</span>
                          <span className="ui-chat__src"><DocIcon />Lease ends 31 January</span>
                        </span>
                      </span>
                    </div>
                    <div className="ui-msg ui-msg--me"><span className="ui-msg__text">Could I see it on Saturday at 11?</span></div>
                  </div>
                  <div className="ui-chat__input">
                    <span className="ui-chat__ph">Write a message</span>
                    <span className="ui-chat__send" aria-hidden="true"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEPS: three real steps, each with its result */}
        <section className="section" id="steps" aria-labelledby="steps-h" style={{ '--hm': 2 }}>
          <div className="wrap">
            <div className="section-head"><h2 id="steps-h">From listing to new keys in 3 steps</h2></div>
            <div className="grid">
              <article className="card card--row card--open span-4">
                <span className="step-num">1</span>
                <h3>List your lease</h3>
                <p>Add photos, the weekly rent, your dates and the nearest uni.</p>
                <div className="panel">
                  <div className="stage stage--fade-b"><div className="at-rise fit" style={{ '--fit-max': '340px', '--ax': 'max(24px, 50% - 170px)', '--ay': '40px', '--ay-sm': '24px' }} data-ui-loop>
                    <div className="ui ui-panel ui-checks" data-ui="checklist">
                      <div className="ui-checks__head"><div className="ui-title">Your listing</div><span className="ui-spacer"></span><div className="ui-meta" data-checks-count>3 of 5</div></div>
                      <div className="ui-checks__bar"><i data-checks-bar style={{ '--k': 0.6 }}></i></div>
                      <ul className="ui-checks__list">
                        {[['Add four photos', 1], ['Set the weekly rent', 1], ['Pick your dates', 1], ['Choose the nearest uni', 0], ['Publish the listing', 0]].map(([l, done]) => (
                          <li key={l} className={done ? 'ui-check is-done' : 'ui-check'}><span className="ui-check__box"><Check /></span><span className="ui-check__label">{l}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div></div>
                </div>
              </article>
              <article className="card card--row card--open span-4">
                <span className="step-num">2</span>
                <h3>Search leases by suburb</h3>
                <p>Filter by rent, property type and dates until a place fits your semester.</p>
                <div className="panel">
                  <div className="stage stage--fade-b"><div className="at-rise fit to-edge" style={{ '--fit-max': '380px', '--ax': 'max(24px, 50% - 190px)', '--ay': '40px', '--ay-sm': '24px' }}>
                    <div className="ui ui-panel ui-search" data-ui="search">
                      <div className="ui-search__field">
                        <svg className="ui-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
                        <span className="ui-search__q"><span data-search-q>carlton 2 bed</span><i className="ui-search__caret"></i></span>
                        <kbd className="ui-search__kbd">/</kbd>
                      </div>
                      <div className="ui-search__group">Leases</div>
                      <ul className="ui-search__list" data-search-list>
                        <li className="ui-search__row is-sel"><span className="ui-search__ico"><DocIcon /></span><span className="ui-search__t"><b>2-bed</b> apartment, <b>Carlton</b></span><span className="ui-search__m">$385/wk</span></li>
                        <li className="ui-search__row"><span className="ui-search__ico"><DocIcon /></span><span className="ui-search__t"><b>2-bed</b> terrace, <b>Carlton</b> North</span><span className="ui-search__m">$520/wk</span></li>
                        <li className="ui-search__row"><span className="ui-search__ico"><DocIcon /></span><span className="ui-search__t">Room off Lygon St, <b>Carlton</b></span><span className="ui-search__m">$295/wk</span></li>
                      </ul>
                      <div className="ui-search__foot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to move</span><span><kbd>Enter</kbd> to open</span></div>
                    </div>
                  </div></div>
                </div>
              </article>
              <article className="card card--row card--open span-4">
                <span className="step-num">3</span>
                <h3>Message the lease holder</h3>
                <p>Chat in the app, inspect the place, then ask the landlord to approve the transfer.</p>
                <div className="panel">
                  <div className="stage stage--fade-b"><div className="at-rise fit" style={{ '--fit-max': '380px', '--ax': 'max(24px, 50% - 190px)', '--ay': 'calc(100% - 180px)', '--ay-sm': 'calc(100% - 180px)' }}>
                    <div className="ui ui-notify" data-ui="notify">
                      <ul className="ui-notify__list" data-notify-list>
                        <li className="ui-note"><span className="ui-avatar ui-note__av" data-tone="1">CA</span><span className="ui-note__text"><span className="ui-note__title">New message<time>now</time></span><span className="ui-note__body">About your 2-bed apartment in Carlton</span></span><span className="ui-btn ui-btn--sm ui-note__btn">Open</span></li>
                        <li className="ui-note"><span className="ui-avatar ui-note__av" data-tone="3">IN</span><span className="ui-note__text"><span className="ui-note__title">Inspection set<time>1h</time></span><span className="ui-note__body">Saturday at 11:00</span></span></li>
                        <li className="ui-note"><span className="ui-note__ico"><svg className="ui-icon" viewBox="0 0 16 16"><path d="m3.5 8.4 2.8 2.8 6.2-6.4" /></svg></span><span className="ui-note__text"><span className="ui-note__title">Transfer approved<time>2d</time></span><span className="ui-note__body">The lease is in the new tenant’s name</span></span></li>
                      </ul>
                    </div>
                  </div></div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* REQUESTS: the dark band, with the dealt moment */}
        <section className="section ground-inverse" id="requests" aria-labelledby="requests-h" data-moment="line-carries-colour" data-moment-opts='{"from": "base"}'>
          <div className="wrap">
            <div className="grid">
              <div className="span-5 stack-4">
                <h2 id="requests-h">Requests from students who need a room</h2>
                <p className="t-lead">Post the suburb, your budget and your move-in date. Students leaving a place see it and message you first.</p>
                <ul className="stack-2">
                  <li>Rooms, share houses and whole leases</li>
                  <li>Add photos so people know who’s asking</li>
                  <li>Edit or take it down any time</li>
                </ul>
                <p><Link className="link" to="/roommates">Browse requests</Link></p>
              </div>
              <div className="frame frame--split span-6 start-7">
                <div className="stage stage--fade-br"><div className="at-corner to-edge" style={{ '--ax': '56px', '--ay': '56px' }}>
                  <div className="ui ui-doc" data-ui="doc">
                    <article className="ui-doc__page">
                      <div className="ui-doc__label">Request, posted today</div>
                      <div className="ui-doc__title">Room in Brunswick or Coburg</div>
                      <div className="ui-doc__text">Moving from Perth for semester one. Looking for a furnished room from <mark className="ui-doc__mark is-on">1 March</mark>, close to the 19 tram.</div>
                      <div className="ui-doc__text">Budget up to <mark className="ui-doc__mark" data-kind="Budget" data-msg="Up to $300 a week, bills included." data-where="Request details">$300 a week</mark> with bills. Happy to share with one or two others.</div>
                      <div className="ui-doc__text">Studying at RMIT, quiet, cooks a lot.</div>
                    </article>
                    <aside className="ui-doc__note ui-panel is-on" aria-live="polite">
                      <div className="ui-doc__kind"><span className="ui-doc__dot"></span><span data-doc-kind>Move-in</span></div>
                      <div className="ui-doc__msg" data-doc-msg>From 1 March, for at least six months.</div>
                      <div className="ui-doc__where" data-doc-where>Request details</div>
                    </aside>
                  </div>
                </div></div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="grid grid--top">
              <div className="span-5 stack-4">
                <h2 id="faq-h">Questions</h2>
                <p className="muted">About fees, landlords and staying safe.</p>
                <p><a className="link" href="mailto:help@swaplease.homes">Email us</a></p>
              </div>
              <div className="faq span-6 start-7">
                {FAQ.map(([q, a]) => (
                  <div key={q} className="faq__item"><h3>{q}</h3><p>{a}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer closing footer--dark ground-inverse" id="contact" aria-labelledby="close-h">
        <div className="wrap">
          <div className="closing__cta close--type">
            <div className="section-head">
              <h2 id="close-h">Skip the fee. Find the key.</h2>
              <p>Listing is free and takes a few minutes.</p>
            </div>
            <Link className="btn btn--primary btn--xl btn--wide" to="/create-listing">List your lease<Arrow /></Link>
          </div>
          <div className="closing__links">
            <div className="grid">
              <div className="span-4 stack-4">
                <Link className="nav__logo" to="/"><Mark />SwapLease</Link>
                <p className="footer__lede">Melbourne students passing leases to each other.</p>
              </div>
              <div className="span-2 footer__col"><h3>Suburbs</h3><ul>
                {['Carlton', 'Fitzroy', 'Brunswick', 'Parkville'].map(s => <li key={s}><Link to={`/listings?search=${s}`}>{s}</Link></li>)}
              </ul></div>
              <div className="span-2 footer__col"><h3>Leases</h3><ul>
                <li><Link to="/listings">Browse leases</Link></li>
                <li><Link to="/roommates">Requests</Link></li>
                <li><Link to="/create-listing">List a lease</Link></li>
              </ul></div>
              <div className="span-2 footer__col"><h3>Account</h3><ul>
                <li><Link to="/signup">Sign up</Link></li>
                <li><Link to="/login">Sign in</Link></li>
                <li><Link to="/saved">Saved</Link></li>
              </ul></div>
              <div className="span-2 footer__col"><h3>Help</h3><ul>
                <li><a href="#faq">Questions</a></li>
                <li><a href="mailto:help@swaplease.homes">Email us</a></li>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
              </ul></div>
            </div>
            <div className="footer__legal">
              <span>&copy; 2026 SwapLease</span>
              <div className="socials"></div>
              <a className="credits" href="https://commons.wikimedia.org/wiki/File:Drummond_Street_Terrace_Houses.jpg">Photograph via Wikimedia Commons (rexness, CC BY-SA 2.0)</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
