import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFonts } from "./CleanQuiz";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

// Oferta low ticket (/q/:slug/oferta) — pra onde o quiz manda quem marca uma
// opção "desviar pra oferta" (ex.: sem orçamento de R$35/dia). RASCUNHO: o
// layout final vai ser trocado pelo desenho do sócio; o conteúdo vem de
// quiz.lowTicketPage (builder do CRM). Botão de compra → checkout da Greenn.

interface LowTicketPage {
  enabled?: boolean;
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  bullets?: string[];
  priceFrom?: string;
  priceTo?: string;
  priceNote?: string;
  buttonLabel?: string;
  checkoutUrl?: string;
  guarantee?: string;
}

const GOLD = "#B8924A";
const BRONZE = "#6E5022";
const BUTTON_BG = "linear-gradient(100deg, #6B4C1E 0%, #A07D3C 50%, #6B4C1E 100%)";

const DEFAULTS: Required<Omit<LowTicketPage, "enabled" | "checkoutUrl">> = {
  badge: "Uma opção pra você começar agora",
  title: "Comece a gerar mensagens qualificadas no WhatsApp gastando só R$10 por dia",
  titleHighlight: "gastando só R$10 por dia",
  subtitle:
    "Ainda não é o momento de investir R$35 por dia? Sem problema. Preparamos uma aula curta pra você fazer sozinha, direto do celular.",
  bullets: [
    "Aula de 4 minutos, direto ao ponto",
    "Passo a passo pra anunciar pelo celular",
    "Pensado pra quem vende cabelo e atende salão",
    "Comece com R$10 por dia de anúncio",
  ],
  priceFrom: "R$ 97",
  priceTo: "R$ 27",
  priceNote: "pagamento único, acesso imediato",
  buttonLabel: "Quero a aula por R$ 27",
  guarantee: "Garantia de 7 dias: se não gostar, devolvemos 100% do valor.",
};

function Highlighted({ text, highlight }: { text?: string; highlight?: string }) {
  if (!text) return null;
  const idx = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: GOLD }}>{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export default function QuizLowTicket() {
  useFonts();
  const { slug } = useParams();
  const [page, setPage] = useState<LowTicketPage | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/quiz/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPage(data?.lowTicketPage || {}))
      .catch(() => setPage({}));
  }, [slug]);

  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(page || {}).filter(([, v]) => v !== "" && v != null)) } as LowTicketPage &
    typeof DEFAULTS;
  const bullets = (p.bullets || []).filter((b) => b.trim());

  useEffect(() => {
    if (page) document.title = p.title;
  }, [page, p.title]);

  return (
    <div className="min-h-screen w-full bg-white" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
      {page && (
        <div className="mx-auto w-full max-w-[520px] px-6 pt-10 pb-12 flex flex-col gap-6">
          <span
            className="self-start rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "#FBF6EA", color: BRONZE, border: "1px solid #EADFC6" }}
          >
            {p.badge}
          </span>

          <h1
            className="text-[28px] leading-[1.2] font-bold text-neutral-900"
            style={{ fontFamily: "Sora, system-ui, sans-serif", textWrap: "balance" } as React.CSSProperties}
          >
            <Highlighted text={p.title} highlight={p.titleHighlight} />
          </h1>

          {p.subtitle && <p className="text-[15px] leading-relaxed text-neutral-600">{p.subtitle}</p>}

          {bullets.length > 0 && (
            <ul className="flex flex-col gap-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-neutral-800">
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[11px] text-white"
                    style={{ background: BRONZE }}
                  >
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-2xl border p-5 flex flex-col items-center gap-1 text-center" style={{ borderColor: "#EADFC6", background: "#FFFBF0" }}>
            {p.priceFrom && <p className="text-sm text-neutral-500 line-through">de {p.priceFrom}</p>}
            <p className="text-[40px] leading-none font-bold text-neutral-900" style={{ fontFamily: "Sora, system-ui, sans-serif" }}>
              {p.priceTo}
            </p>
            {p.priceNote && <p className="text-xs text-neutral-500 mt-1">{p.priceNote}</p>}
          </div>

          <a
            href={page.checkoutUrl || "#"}
            onClick={(e) => {
              if (!page.checkoutUrl) e.preventDefault();
            }}
            className={`w-full rounded-xl py-4 text-center text-[16px] font-semibold text-white shadow-sm transition hover:brightness-110 ${
              page.checkoutUrl ? "" : "opacity-60 cursor-not-allowed"
            }`}
            style={{ background: BUTTON_BG, fontFamily: "Sora, system-ui, sans-serif" }}
          >
            {p.buttonLabel}
          </a>
          {!page.checkoutUrl && (
            <p className="-mt-3 text-center text-xs text-red-500">Link de checkout ainda não configurado no CRM.</p>
          )}

          {p.guarantee && <p className="text-center text-xs text-neutral-500">{p.guarantee}</p>}
        </div>
      )}
    </div>
  );
}
