import { Send } from "lucide-react";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/LXtdY9KkxyRErbx5MyRtx2?mode=gi_t";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function trackClick() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const payload = {
    utmSource: localStorage.getItem("utm_source") || undefined,
    utmMedium: localStorage.getItem("utm_medium") || undefined,
    utmCampaign: localStorage.getItem("utm_campaign") || undefined,
    utmContent: localStorage.getItem("utm_content") || undefined,
    utmTerm: localStorage.getItem("utm_term") || undefined,
    fbclid: localStorage.getItem("fbclid") || undefined,
    fbc: getCookie("_fbc") || undefined,
    fbp: getCookie("_fbp") || undefined,
    clickId: localStorage.getItem("click_id") || undefined,
  };
  fetch(`${apiUrl}/track/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

const LeadForm = () => {
  return (
    <div className="animate-fade-up-delay-2 flex justify-center lg:justify-end">
      <div className="glass-card glow-primary w-full max-w-md rounded-2xl p-8 sm:p-10">
        <h2
          className="mb-2 text-xl font-bold tracking-tight sm:text-2xl"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Atraia apenas leads qualificados no seu WhatsApp
        </h2>
        <p className="mb-8 text-sm text-muted-foreground">
          Clique no botão e entre no grupo onde a live vai acontecer ao vivo.
        </p>

        <a
          href={WHATSAPP_GROUP_URL}
          onClick={trackClick}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
        >
          Quero apenas lead qualificado
          <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          🔒 Gratuito. Sua vaga garantida em segundos.
        </p>
      </div>
    </div>
  );
};

export default LeadForm;
