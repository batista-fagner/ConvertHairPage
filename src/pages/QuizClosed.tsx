import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFonts } from "./CleanQuiz";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

// Página de agradecimento (/q/:slug/agradecimento): destino de quem escolhe uma
// opção com action 'end' no quiz (ex.: "Quero comprar cabelo"). Texto e link do
// botão vêm de quiz.closePage (builder do CRM); sem link, o botão some.

interface ClosePage {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  message?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

const GOLD = "#B8924A";
const BRONZE = "#6E5022";
const BUTTON_BG = "linear-gradient(100deg, #6B4C1E 0%, #A07D3C 50%, #6B4C1E 100%)";

const DEFAULTS = {
  badge: "Obrigado por participar",
  title: "Obrigado pelo seu interesse!",
  titleHighlight: "seu interesse",
  message:
    "Esse diagnóstico é feito para quem já vende cabelo ou atende no salão e quer lotar o WhatsApp de clientes. Por enquanto ele não é o ideal para o seu momento, mas queremos continuar perto de você.\n\nAcompanhe a ConvertHair no Instagram: toda semana mostramos o que está funcionando no mercado de cabelo.",
  buttonLabel: "Seguir a ConvertHair no Instagram",
};

function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
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

export default function QuizClosed() {
  useFonts();
  const { slug } = useParams();
  const [page, setPage] = useState<ClosePage | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/quiz/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPage(data?.closePage || {}))
      .catch(() => setPage({}));
  }, [slug]);

  const pick = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
  const title = pick(page?.title, DEFAULTS.title);
  const highlight = page?.title?.trim() ? page.titleHighlight : DEFAULTS.titleHighlight;

  useEffect(() => {
    if (page) document.title = title;
  }, [page, title]);

  return (
    <div className="min-h-screen w-full bg-white flex justify-center" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
      {page && (
        <div className="w-full max-w-[480px] px-6 pt-16 pb-12 flex flex-col gap-6">
          <span
            className="self-start rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "#FBF6EA", color: BRONZE, border: "1px solid #EADFC6" }}
          >
            {pick(page.badge, DEFAULTS.badge)}
          </span>

          <h1
            className="text-[30px] leading-[1.15] font-bold text-neutral-900"
            style={{ fontFamily: "Sora, system-ui, sans-serif", textWrap: "balance" } as React.CSSProperties}
          >
            <Highlighted text={title} highlight={highlight} />
          </h1>

          <p className="text-[15px] leading-relaxed text-neutral-600 whitespace-pre-line">
            {pick(page.message, DEFAULTS.message)}
          </p>

          {page.buttonUrl?.trim() && (
            <a
              href={page.buttonUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="mt-2 w-full rounded-xl py-4 text-center text-[16px] font-semibold text-white shadow-sm transition hover:brightness-110"
              style={{ background: BUTTON_BG, fontFamily: "Sora, system-ui, sans-serif" }}
            >
              {pick(page.buttonLabel, DEFAULTS.buttonLabel)}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
