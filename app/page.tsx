const services = [
  ['Strategy', 'A practical growth plan built around your audience, offer, and revenue goals.'],
  ['Content & Creative', 'Scroll-stopping creative and campaign messaging that earns attention.'],
  ['Automation', 'Lead capture and follow-up systems that keep momentum after the click.'],
]

export default function Home() {
  return (
    <main>
      <nav className="nav wrap">
        <a className="brand" href="#top" aria-label="DigiMark101 home"><span className="brand-mark">DM</span><span>DigiMark<span className="purple">101</span></span></a>
        <div className="nav-links"><a href="#services">Services</a><a href="#approach">Approach</a><a className="button button-small" href="#contact">Start a project</a></div>
      </nav>
      <section id="top" className="hero wrap">
        <div className="eyebrow">DIGITAL MARKETING AGENCY</div>
        <h1>Build momentum.<br/><span>Make your mark.</span></h1>
        <p className="lede">DigiMark101 helps ambitious businesses turn their digital presence into a dependable growth engine.</p>
        <div className="actions"><a className="button" href="#contact">Plan your next move <b>→</b></a><a className="text-link" href="#services">Explore services</a></div>
        <div className="hero-art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="arrow">↗</div><div className="pixel p1"/><div className="pixel p2"/><div className="pixel p3"/></div>
      </section>
      <section id="services" className="section dark"><div className="wrap"><div className="section-label">WHAT WE DO</div><h2>Marketing that is made<br/>to move business forward.</h2><div className="cards">{services.map(([title, body], i) => <article className="card" key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p><a href="#contact">Learn more →</a></article>)}</div></div></section>
      <section id="approach" className="approach wrap"><div><div className="section-label purple">THE DIGIMARK101 WAY</div><h2>Clear strategy.<br/>Creative energy.<br/><em>Measurable growth.</em></h2></div><p>We combine human insight with intelligent systems to make every campaign focused, fast, and accountable.</p></section>
      <section id="contact" className="contact"><div className="wrap"><div className="section-label">READY WHEN YOU ARE</div><h2>Let’s build what’s next.</h2><p>Tell us where you want to go. We’ll help map the way there.</p><a className="button light" href="mailto:hello@digimark101.com">Start the conversation <b>→</b></a></div></section>
      <footer className="wrap"><span className="brand"><span className="brand-mark">DM</span>DigiMark<span className="purple">101</span></span><span>© {new Date().getFullYear()} DigiMark101. Digital Marketing Agency.</span></footer>
    </main>
  )
}
