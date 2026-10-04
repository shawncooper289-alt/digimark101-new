import Link from 'next/link'
import { Workspace } from './workspace'
export function Studio() {
  return <main style={{background:'linear-gradient(145deg,#f7eee9,#e9e6fa)',color:'#322647',minHeight:'100vh'}}>
    <nav className="nav"><Link className="logo" href="/">Ava<span>Skye</span><small>YOUR CREATIVE STUDIO</small></Link><a href="https://www.digimark101.com">DigiMark101 ↗</a></nav>
    <section className="section"><div className="eyebrow">A LITTLE SPACE FOR YOUR NEXT BIG IDEA</div><h1>Dream it.<br/><em>Think it through with Ava.</em></h1><p>Explore income ideas, weigh the effort and risks, and shape a practical first experiment. No guaranteed earnings. No automatic spending or publishing.</p><a className="primary" href="#workspace">Let’s brainstorm ↗</a></section>
    <Workspace />
    <section className="section"><h2>From possibility to a business.</h2><p>Keep personal conversations private. When your idea is ready, prepare a project brief for your DigiMark101 workspace.</p><a className="secondary" href="https://www.digimark101.com">Visit DigiMark101 ↗</a></section>
  </main>
}
