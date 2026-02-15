import { Link } from 'react-router-dom';

export default function HeroBody() {
  return (
    <main className="flex-1 min-h-[calc(100vh-4rem-12rem)] sm:min-h-[calc(100vh-4rem-14rem)] relative overflow-hidden flex items-center justify-center">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-header via-header-dark to-black z-0" />

      {/* Left illustration - symmetric width, behind content */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[28%] min-w-[200px] max-w-[360px] opacity-80 hidden lg:block z-[1]"
        aria-hidden
      >
        <img
          src="/crowd-management-hero.png"
          alt=""
          className="w-full h-full object-cover object-right"
        />
      </div>

      {/* Right illustration - same width as left, behind content */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[28%] min-w-[200px] max-w-[360px] opacity-80 hidden lg:block z-[1]"
        aria-hidden
      >
        <img
          src="/crowd-management-hero.png"
          alt=""
          className="w-full h-full object-cover object-left"
        />
      </div>

      {/* Central content - always centered, above illustrations */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Smart City Crowd Monitor & Control
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-white/90 max-w-xl mx-auto">
            Track density, predict chaos, and keep public spaces safe.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 sm:mt-8 inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-header font-semibold text-base sm:text-lg hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg"
          >
            View Crowd Status
          </Link>
        </div>
      </div>
    </main>
  );
}
