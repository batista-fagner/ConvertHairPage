import { Zap, BarChart3, MessageSquare, ChevronDown, Send } from "lucide-react";

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

const benefits = [
  {
    icon: BarChart3,
    text: "Funil com IA que qualifica, faz follow up e converte automaticamente",
  },
  {
    icon: Zap,
    text: "IA que se conecta com sua campanha no Meta e deixa o algoritmo mais inteligente",
  },
  {
    icon: MessageSquare,
    text: "Capture, qualifique e converta leads 24h/7 com automação inteligente",
  },
];

const HeroContent = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Funil de vendas com IA
        </span>
      </div>

      <h1 className="animate-fade-up-delay-1 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
        Veja ao vivo como pagar apenas por lead qualificado{" "}
        <span className="gradient-text">com o funil qualificador.</span>
      </h1>

      {/* <p className="animate-fade-up-delay-2 max-w-lg text-lg leading-relaxed text-muted-foreground">
        De visitante a cliente. Sem confusão, sem perder leads. Nossa IA estrutura todo o funil — desde atração até conversão — e você recebe clientes qualificados prontos para comprar.
      </p> */}
      <p className="animate-fade-up-delay-2 max-w-lg text-lg font-bold leading-relaxed text-muted-foreground">
        Cada lead que não responde rápido vai pro concorrente. A gente coloca IA no seu funil pra isso nunca mais acontecer.
      </p>

      {/* Botão mobile — aparece logo após o subtítulo, antes dos bullets */}
      <a
        href={WHATSAPP_GROUP_URL}
        onClick={trackClick}
        className="group animate-fade-up-delay-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 lg:hidden"
      >
        Quero apenas lead qualificado
        <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>

      <ul className="animate-fade-up-delay-2 flex flex-col gap-4">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-center gap-3 text-secondary-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground">
              <b.icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{b.text}</span>
          </li>
        ))}
      </ul>

      <div className="animate-fade-up-delay-3 flex items-center gap-3 pt-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">83% das empresas</span>{" "}
          que usam funil com IA cresceram — contra 66% das que não usam
        </p>
      </div>

      {/* Seta indicando o formulário abaixo — só no mobile */}
      <div className="flex flex-col items-center gap-1 pt-4 lg:hidden">
        <p className="text-xs text-muted-foreground">Analise seu perfil gratuitamente</p>
        <ChevronDown className="h-8 w-8 text-yellow-400 animate-bounce" />
      </div>

    </div>
  );
};

export default HeroContent;
