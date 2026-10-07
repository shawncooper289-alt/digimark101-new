import Link from 'next/link'
export function Header(){return <header className="header"><Link href="/" className="brand">DigiMark<span>101</span></Link><nav aria-label="Main navigation">{[['/','Today'],['/ava','Ava'],['/work','Work'],['/studio','Skye Studio'],['/pricing','Pricing'],['/account','Account']].map(([url,label])=><Link key={url} href={url}>{label}</Link>)}</nav></header>}
