import { useEffect } from "react";
import LeadForm from "@/components/LeadForm";
import HeroContent from "@/components/HeroContent";

const Index = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fbclid = params.get('fbclid')
    if (fbclid) localStorage.setItem('fbclid', fbclid)
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')
    const utmContent = params.get('utm_content')
    const utmTerm = params.get('utm_term')
    if (utmSource) localStorage.setItem('utm_source', utmSource)
    if (utmMedium) localStorage.setItem('utm_medium', utmMedium)
    if (utmCampaign) localStorage.setItem('utm_campaign', utmCampaign)
    if (utmContent) localStorage.setItem('utm_content', utmContent)
    if (utmTerm) localStorage.setItem('utm_term', utmTerm)
    if (!localStorage.getItem('click_id')) {
      localStorage.setItem('click_id', crypto.randomUUID())
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ticker ao vivo */}
      <div className="relative z-50 w-full overflow-hidden bg-yellow-400 py-2">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-8 text-sm font-bold tracking-wide text-gray-900">
              🔴 AO VIVO — TERÇA-FEIRA AO MEIO-DIA
            </span>
          ))}
        </div>
      </div>
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative z-10 flex min-h-screen items-start lg:items-center">
        <div className="container mx-auto px-4 py-12 lg:py-0">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <HeroContent />
            <LeadForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
