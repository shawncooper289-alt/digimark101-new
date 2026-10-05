import Image from 'next/image'
import { ArrowUpRight, Sparkles, Target, Layers, AudioLines } from 'lucide-react'
import { AvaVoiceWidget } from '@/components/ava/voice-widget'

const services = [
  { icon: Target, number: '01', title: 'Find your direction.', text: 'A clear digital strategy built around your brand, your audience, and your next big idea.' },
  { icon: Layers, number: '02', title: 'Make your mark.', text: 'Distinctive branding and digital experiences that turn a first impression into a lasting connection.' },
  { icon: Sparkles, number: '03', title: 'Think beyond ordinary.', text: 'Explore smarter ways to connect through creative content and AI-powered experiences.' },
]

export default function Home() {
  return (
    <main className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header wrap">
        <a href="#" aria-label="DigiMark101 home" className="brand-link"><Image src="/digimark101-logo.svg" alt="DigiMark101 — Ideas into impact" width={240} height={100} priority /></a>
        <nav aria-label="Main navigation"><a href="#services">What we do</a><a href="#about">Our approach</a><a className="nav-cta" href="#ava">Meet Ava <ArrowUpRight size={16} /></a></nav>
      </header>
      <section id="main-content" className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow"><span className="status-dot" /> CREATIVE THINKING. DIGITAL IMPACT.</span>
          <h1>Big ideas.<br />Bold moves.<br /><span>Your next chapter.</span></h1>
          <p>Bring your brand into focus. DigiMark101 blends creativity, digital strategy, and intelligent experiences to help your ideas stand out.</p>
          <div className="hero-actions"><a className="button-primary" href="#services">Explore what’s possible <ArrowUpRight size={19} /></a><a className="text-link" href="#ava">Meet your digital assistant <span>↗</span></a></div>
          <div className="hero-footnote">STRATEGY <span>✦</span> BRANDING <span>✦</span> DIGITAL EXPERIENCES</div>
        </div>
        <div className="logo-stage" aria-label="DigiMark101 brand spotlight">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="stage-top"><span>THE FUTURE IS YOURS TO CREATE</span><Sparkles size={18} /></div>
          <Image className="hero-logo" src="/digimark101-logo.svg" alt="DigiMark101 purple comet monogram — Ideas into impact" width={720} height={300} priority />
          <div className="stage-bottom"><span className="status-dot" /> Ideas into impact.<span className="stage-arrow">↗</span></div>
        </div>
      </section>
      <section id="services" className="services wrap">
        <div className="section-heading"><div><span className="eyebrow">WHAT WE DO</span><h2>Built to stand out.<br />Designed to move forward.</h2></div><p>From the first spark to the next step.<br />Make every touchpoint count.</p></div>
        <div className="service-grid">{services.map(({icon: Icon, number, title, text}) => <article className="service-card" key={number}><div className="card-top"><Icon size={26} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section id="about" className="about wrap"><span className="eyebrow">THE DIGIMARK101 APPROACH</span><h2>Human creativity.<br /><span>Digital possibility.</span></h2><p>Your brand deserves more than blending in. We believe in purposeful design, clear communication, and technology that makes connecting feel natural.</p></section>
      <section id="ava" className="ava-section wrap"><div className="ava-icon"><AudioLines size={34} /></div><div><span className="eyebrow">MEET AVA SKYE</span><h2>A conversation starts here.</h2><p>Explore the Ava voice demo using the purple assistant button in the bottom corner. Full AI and voice services are not connected yet.</p></div><span className="demo-pill">VOICE DEMO</span></section>
      <footer className="site-footer wrap"><span>DigiMark101 <span className="footer-accent">✦</span> Ideas into impact.</span><a href="#main-content">Back to top ↑</a></footer>
      <AvaVoiceWidget userId="demo-user" />
    </main>
  )
}
