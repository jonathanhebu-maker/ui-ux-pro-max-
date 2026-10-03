const links = [
  { href: '#hero', label: 'ראשי' },
  { href: '#hub', label: 'מערכות AI' },
  { href: '#dashboard', label: 'סוכן קולי' },
]

export default function Navbar() {
  return (
    <header
      className="fixed top-0 inset-x-0 flex items-center justify-between"
      style={{
        zIndex: 10,
        padding: '24px 56px',
        background: 'rgba(2,4,10,.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}
    >
      {/* RTL start = right side */}
      <a
        href="#hero"
        className="font-extrabold text-white"
        style={{ fontSize: 24, letterSpacing: '.04em' }}
        aria-label="VENA TECH — דף הבית"
      >
        VENA TECH
      </a>

      <nav aria-label="ניווט ראשי" className="flex items-center gap-7 md:gap-10">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm md:text-[15px] font-semibold"
            style={{ color: 'var(--muted)' }}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <a href="#cta" className="nav-cta hidden sm:inline-flex">
        קבעו שיחת אסטרטגיה
      </a>

      <style>{`
        @media (max-width: 768px) {
          header { padding: 14px 18px !important; }
          header a[aria-label] { font-size: 19px !important; }
          header nav { gap: 16px !important; }
        }
      `}</style>
    </header>
  )
}
