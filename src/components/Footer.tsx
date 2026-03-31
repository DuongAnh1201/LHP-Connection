export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-base-raised/45">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 text-center lg:py-10">
        <div className="flex flex-col items-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/75">LHP Network</p>
          <p className="mt-3 max-w-2xl font-serif text-[22px] leading-tight text-white">
            A directory built to make every alumni connection feel discoverable, credible, and close at hand.
          </p>
        </div>

        <div className="grid gap-1 text-center">
          <p className="text-[12px] leading-6 text-text-faint">Lê Hồng Phong • Petrus Ký • Est. 1927</p>
          <p className="text-[12px] leading-6 text-text-faint/90">Crafted by Jimmy Nguyen CA1 20-23</p>
          <p className="text-[12px] leading-6 text-text-faint/90">Global alumni directory and network atlas</p>
        </div>
      </div>
    </footer>
  )
}
