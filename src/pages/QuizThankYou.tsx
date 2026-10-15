import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useFonts } from "./CleanQuiz";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

// Página pós-quiz com mini VSL (/q/:slug/obrigado) — configurada no builder do
// CRM em quiz.thankYouPage. O quiz só manda a pessoa pra cá quando a página
// está ligada; abrir o link direto funciona sempre (serve de prévia).

interface ThankYouPage {
  enabled?: boolean;
  badge?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  footerText?: string;
  autoRedirectOnEnd?: boolean;
}

interface QuizData {
  slug: string;
  whatsappUrl?: string | null;
  thankYouPage?: ThankYouPage | null;
}

const GOLD = "#E2B862";

// Converte link "de assistir" do YouTube/Vimeo no endereço de embed; Panda e
// outros players já colados como embed passam direto.
export function toEmbedUrl(raw: string): string {
  const url = raw.trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

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

export default function QuizThankYou() {
  useFonts();
  const { slug } = useParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/quiz/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setQuiz(data))
      .catch(() => setQuiz(null));
  }, [slug]);

  const page = quiz?.thankYouPage || {};
  const destination = page.buttonUrl?.trim() || quiz?.whatsappUrl || "";

  useEffect(() => {
    if (page.title) document.title = page.title;
  }, [page.title]);

  function go() {
    if (destination) window.location.href = destination;
  }

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #1B2740 0%, #111A2C 55%, #0C1322 100%)",
        fontFamily: "Roboto, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-[780px] px-5 pt-12 pb-14 flex flex-col items-center text-center gap-5">
        {quiz && (
          <>
            {page.badge !== "" && (
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-semibold tracking-[0.08em] uppercase"
                style={{ borderColor: "rgba(226,184,98,0.45)", background: "rgba(226,184,98,0.08)", color: GOLD }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                {page.badge || "Cadastro confirmado"}
              </span>
            )}

            <h1
              className="text-[28px] sm:text-[36px] leading-[1.15] font-bold"
              style={{ fontFamily: "Sora, system-ui, sans-serif", textWrap: "balance" } as React.CSSProperties}
            >
              <Highlighted
                text={page.title || "Assista ao vídeo antes de agendar a sua conversa"}
                highlight={page.titleHighlight ?? "antes de agendar"}
              />
            </h1>

            {(page.subtitle ?? "Em 2 minutos você entende exatamente o que acontece a partir de agora.") && (
              <p className="text-[15px] sm:text-base text-slate-300 max-w-[560px]">
                {page.subtitle ?? "Em 2 minutos você entende exatamente o que acontece a partir de agora."}
              </p>
            )}

            <div
              className="mt-3 w-full overflow-hidden rounded-2xl bg-black"
              style={{ aspectRatio: "16 / 9", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              {page.videoUrl ? (
                <video
                  src={page.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  onEnded={() => {
                    if (page.autoRedirectOnEnd) go();
                  }}
                />
              ) : page.videoEmbedUrl ? (
                <iframe
                  src={toEmbedUrl(page.videoEmbedUrl)}
                  title="Vídeo"
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
                  Vídeo em breve
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={go}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-9 py-4 text-[16px] font-semibold text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              style={{
                background: "linear-gradient(90deg, #22C55E 0%, #0F8A6B 100%)",
                boxShadow: "0 12px 40px -10px rgba(34,197,94,0.55)",
                fontFamily: "Sora, system-ui, sans-serif",
              }}
            >
              {page.buttonLabel || "Agendar minha conversa agora"} <span aria-hidden>→</span>
            </button>

            {(page.footerText ?? (page.autoRedirectOnEnd && page.videoUrl
              ? "Quando o vídeo terminar, você segue automaticamente.\nSe preferir, use o botão acima."
              : "")) && (
              <p className="text-[13px] text-slate-400 whitespace-pre-line">
                {page.footerText ??
                  "Quando o vídeo terminar, você segue automaticamente.\nSe preferir, use o botão acima."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
