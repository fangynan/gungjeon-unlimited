import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      {/* 1. THE URBAN FIRE HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-black px-4 sm:px-6 lg:px-8">
        {/* Visual framework/placeholder for roaring, high-contrast live charcoal flame backdrop */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
          {/* Flame Texture Placeholder - In production, replace with actual image/video */}
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/40 via-[#1a1a1a] to-black" />
        </div>

        <div className="relative z-20 flex flex-col items-center text-center max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] text-white">
            Eat All <br />
            <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              You Can!
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-widest text-neutral-300 uppercase">
            Good Food. More Choices. Unlimited.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full sm:w-auto">
            <Link
              href="/table-availability"
              className="group relative flex items-center justify-center px-10 py-5 bg-red-600 text-white font-black text-xl tracking-widest uppercase rounded-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-red-500 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-600/50"
            >
              Secure A Table
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </Link>
            
            <Link
              href="/menu"
              className="group flex items-center justify-center px-10 py-5 bg-transparent border-4 border-white text-white font-black text-xl tracking-widest uppercase rounded-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:bg-white hover:text-black active:scale-95 focus:outline-none focus:ring-4 focus:ring-white/50"
            >
              Explore The Tiers
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE "FEAST AT A GLANCE" VALUE SPLIT */}
      <section className="relative z-20 bg-[#1a1a1a] border-t-8 border-red-600 px-4 sm:px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-12">
            Choose Your <span className="text-red-600">Fire</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Base Tier - Asymmetrical wide block */}
            <Link
              href="/menu"
              className="lg:col-span-7 group block bg-black border-2 border-neutral-800 p-8 sm:p-12 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-red-600 active:scale-[0.98] rounded-none"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors duration-300">
                    Street Starter
                  </h3>
                  <p className="mt-2 text-red-500 font-bold uppercase tracking-wider">
                    Pork & Chicken Essentials
                  </p>
                </div>
                <div className="mt-12 font-black tracking-tighter text-yellow-400 text-7xl sm:text-8xl md:text-[10rem] leading-none drop-shadow-[0_0_20px_rgba(251,191,36,0.15)] group-hover:scale-105 group-hover:origin-bottom-left transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                  ₱299
                </div>
              </div>
            </Link>

            {/* Premium Tier - Asymmetrical tall block */}
            <Link
              href="/menu"
              className="lg:col-span-5 group block bg-black border-2 border-neutral-800 p-8 sm:p-12 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-yellow-400 active:scale-[0.98] rounded-none"
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors duration-300">
                    Royal Feast
                  </h3>
                  <p className="mt-2 text-yellow-500 font-bold uppercase tracking-wider">
                    Premium Beef & Seafood
                  </p>
                </div>
                <div className="mt-12 font-black tracking-tighter text-yellow-400 text-7xl sm:text-8xl md:text-[10rem] leading-none drop-shadow-[0_0_20px_rgba(251,191,36,0.15)] group-hover:scale-105 group-hover:origin-bottom-left transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                  ₱699
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. DENSE LOGISTICS & HOUSE RULES FOOT-BANNER */}
      <section className="bg-black py-16 px-4 sm:px-6 lg:px-8 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Rule 1 */}
            <div className="flex flex-col items-center justify-center p-8 border-4 border-red-600 bg-[#0a0a0a] rounded-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2">
              <span className="font-mono text-red-600 text-xl font-bold mb-4">
                [ RULE_01 ]
              </span>
              <h4 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest text-center">
                No Left-Over Policy
              </h4>
            </div>

            {/* Rule 2 */}
            <div className="flex flex-col items-center justify-center p-8 border-4 border-white bg-white text-black rounded-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2">
              <span className="font-mono text-neutral-500 text-xl font-bold mb-4">
                [ RULE_02 ]
              </span>
              <h4 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-center">
                ₱1/Gram Charge
              </h4>
            </div>

            {/* Rule 3 */}
            <div className="flex flex-col items-center justify-center p-8 border-4 border-red-600 bg-[#0a0a0a] rounded-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2">
              <span className="font-mono text-red-600 text-xl font-bold mb-4">
                [ RULE_03 ]
              </span>
              <h4 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest text-center">
                1 Unli Set Per Table
              </h4>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}