export default function HeroBody() {
  return (
    <main className="flex-1 bg-body min-h-[calc(100vh-4rem-12rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-accent-primary leading-tight">
              AI-Powered Smart Crowd Management
            </h1>
            <p className="mt-6 text-lg text-accent-muted max-w-xl">
              Real-time monitoring, chaos prediction, and enhanced security.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden border border-white/80">
              <div className="aspect-square bg-gradient-to-br from-header/10 to-accent-primary/10 flex items-center justify-center p-8">
                {/* Crowd / arrow metaphor: simple SVG of figures forming an arrow */}
                <svg viewBox="0 0 200 200" className="w-full h-full text-accent-primary/60">
                  <g fill="currentColor">
                    {[...Array(24)].map((_, i) => {
                      const row = Math.floor(i / 6);
                      const col = i % 6;
                      const x = 40 + col * 28 + (row % 2) * 14;
                      const y = 160 - row * 32;
                      return (
                        <circle key={i} cx={x} cy={y} r="6" opacity={0.4 + (i % 3) * 0.2} />
                      );
                    })}
                  </g>
                  <path
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.6"
                    d="M 100 40 L 100 120 L 60 100 M 100 120 L 140 100"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
