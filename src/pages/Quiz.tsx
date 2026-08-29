import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
const DEFAULT_WA_URL = import.meta.env.VITE_WA_URL || "https://chat.whatsapp.com/";

interface QuizOption {
  id: string;
  label: string;
  isMqlAnswer?: boolean;
}

interface QuizQuestion {
  id: string;
  order: number;
  question: string;
  isMqlQuestion?: boolean;
  mqlEventName?: string;
  options: QuizOption[];
}

interface QuizPresentation {
  badgeTitle?: string;
  badgeSubtitle?: string;
  badgeDateLine?: string;
  photoUrl?: string;
  title?: string;
  titleHighlight?: string;
  subtitleBox?: string;
  bodyText?: string;
  buttonLabel?: string;
  autoRedirectSeconds?: number | null;
}

interface QuizFinalStep {
  title?: string;
  titleHighlight?: string;
  progressLabel?: string;
  bodyText?: string;
  buttonLabel?: string;
  // segundos que a barra leva animando até 100% — o auto-redirect pro
  // whatsappUrl dispara exatamente quando a animação termina.
  autoRedirectSeconds?: number | null;
}

const DEFAULT_FINAL_AUTO_REDIRECT_SECONDS = 4;
// Ponto de partida da barra na tela final — a pessoa já andou o quiz inteiro
// (a barra do topo mostra isso), aqui é só o trecho "quase lá" que anima até 100%.
const FINAL_BAR_START_PERCENT = 60;

interface QuizData {
  id: string;
  name: string;
  slug: string;
  whatsappUrl?: string | null;
  presentation: QuizPresentation;
  questions: QuizQuestion[];
  finalStep: QuizFinalStep;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function captureTracking() {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  const utmTerm = params.get("utm_term");

  if (fbclid) localStorage.setItem("fbclid", fbclid);
  if (utmSource) localStorage.setItem("utm_source", utmSource);
  if (utmMedium) localStorage.setItem("utm_medium", utmMedium);
  if (utmCampaign) localStorage.setItem("utm_campaign", utmCampaign);
  if (utmContent) localStorage.setItem("utm_content", utmContent);
  if (utmTerm) localStorage.setItem("utm_term", utmTerm);
  if (!localStorage.getItem("click_id")) {
    localStorage.setItem("click_id", crypto.randomUUID());
  }

  return {
    utmSource: utmSource || localStorage.getItem("utm_source") || undefined,
    utmMedium: utmMedium || localStorage.getItem("utm_medium") || undefined,
    utmCampaign: utmCampaign || localStorage.getItem("utm_campaign") || undefined,
    utmContent: utmContent || localStorage.getItem("utm_content") || undefined,
    utmTerm: utmTerm || localStorage.getItem("utm_term") || undefined,
    fbclid: fbclid || localStorage.getItem("fbclid") || undefined,
    fbc: getCookie("_fbc") || undefined,
    fbp: getCookie("_fbp") || undefined,
    clickId: localStorage.getItem("click_id") || undefined,
  };
}

// Container fixo em largura de smartphone (~430px), centralizado — igual no
// desktop e no mobile, com o fundo full-bleed atrás (pedido explícito: o quiz
// nunca "estica" no desktop).
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-black text-white relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ percent, durationMs = 500 }: { percent: number; durationMs?: number }) {
  return (
    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-white rounded-full transition-[width] ease-linear"
        style={{ width: `${percent}%`, transitionDuration: `${durationMs}ms` }}
      />
    </div>
  );
}

function Badge({ title, subtitle, dateLine }: { title?: string; subtitle?: string; dateLine?: string }) {
  if (!title && !dateLine) return null;
  const [left, right] = (dateLine || "").split("•").map((s) => s.trim());
  return (
    <div className="flex items-stretch justify-between rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-xs">
      <div>
        {title && <p className="font-bold">{title}</p>}
        {subtitle && <p className="text-neutral-400">{subtitle}</p>}
      </div>
      {dateLine && (
        <div className="flex items-center gap-2 text-right">
          <span className="w-px self-stretch bg-blue-500/60" />
          <p className="text-neutral-200 leading-tight">
            {left}
            {right && (
              <>
                <br />
                {right}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

type Step = { kind: "presentation" } | { kind: "question"; index: number } | { kind: "final" };

export default function Quiz() {
  const { slug } = useParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "presentation" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalBarPercent, setFinalBarPercent] = useState(FINAL_BAR_START_PERCENT);
  const finishedRef = useRef(false);

  const tracking = useMemo(() => captureTracking(), []);
  const whatsappUrl = quiz?.whatsappUrl || DEFAULT_WA_URL;

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/quiz/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: QuizData) => setQuiz(data))
      .catch(() => setError(true));
  }, [slug]);

  // Auto-redirect direto pro grupo se a pessoa não interagir na apresentação.
  useEffect(() => {
    if (step.kind !== "presentation") return;
    const seconds = quiz?.presentation.autoRedirectSeconds;
    if (!seconds) return;
    setCountdown(seconds);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          window.location.href = whatsappUrl;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [step, quiz, whatsappUrl]);

  // Tela final: a barra anima até 100% e o auto-redirect pro whatsappUrl
  // dispara exatamente quando a animação termina (mesmo tempo configurado).
  // O botão continua funcionando a qualquer momento, adiantando o redirect.
  useEffect(() => {
    if (step.kind !== "final") return;
    const seconds = quiz?.finalStep.autoRedirectSeconds ?? DEFAULT_FINAL_AUTO_REDIRECT_SECONDS;
    setFinalBarPercent(FINAL_BAR_START_PERCENT);
    const raf = requestAnimationFrame(() => setFinalBarPercent(100));
    const timer = setTimeout(() => handleFinish(), seconds * 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, quiz]);

  function goToQuestion(index: number) {
    if (!quiz) return;
    if (index >= quiz.questions.length) {
      setStep({ kind: "final" });
    } else {
      setStep({ kind: "question", index });
    }
  }

  function selectAnswer(question: QuizQuestion, optionId: string, index: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setTimeout(() => goToQuestion(index + 1), 250);
  }

  async function handleFinish() {
    if (!quiz || finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    const payload = {
      answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
      ...tracking,
    };
    try {
      const res = await fetch(`${API_URL}/quiz/${quiz.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const data = await res.json().catch(() => null);
      window.location.href = data?.redirectUrl || whatsappUrl;
    } catch {
      window.location.href = whatsappUrl;
    }
  }

  if (error) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-neutral-400 text-sm">Esse quiz não está mais disponível.</p>
        </div>
      </PhoneFrame>
    );
  }

  if (!quiz) {
    return (
      <PhoneFrame>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      </PhoneFrame>
    );
  }

  const totalSteps = quiz.questions.length + 2; // presentação + perguntas + final
  const stepIndex = step.kind === "presentation" ? 0 : step.kind === "final" ? totalSteps - 1 : step.index + 1;
  const progressPercent = Math.min(100, Math.round(((stepIndex + 1) / totalSteps) * 100));

  return (
    <PhoneFrame>
      <div className="px-4 pt-4">
        <ProgressBar percent={progressPercent} />
      </div>

      {step.kind === "presentation" && (
        <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
          <Badge
            title={quiz.presentation.badgeTitle}
            subtitle={quiz.presentation.badgeSubtitle}
            dateLine={quiz.presentation.badgeDateLine}
          />

          {quiz.presentation.photoUrl && (
            <img
              src={quiz.presentation.photoUrl}
              alt=""
              className="w-full rounded-2xl object-cover max-h-[340px]"
            />
          )}

          <h1 className="text-3xl font-extrabold leading-tight">
            {quiz.presentation.title}{" "}
            {quiz.presentation.titleHighlight && (
              <span className="text-blue-500">{quiz.presentation.titleHighlight}</span>
            )}
          </h1>

          {quiz.presentation.subtitleBox && (
            <div className="rounded-lg border border-blue-900/60 bg-blue-950/40 px-4 py-3 text-sm font-bold uppercase tracking-tight">
              {quiz.presentation.subtitleBox}
            </div>
          )}

          {quiz.presentation.bodyText && (
            <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
              {quiz.presentation.bodyText}
            </p>
          )}

          <button
            onClick={() => goToQuestion(0)}
            className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 transition py-4 text-sm font-bold uppercase tracking-wide"
          >
            {quiz.presentation.buttonLabel || "Continuar"}
          </button>

          {countdown !== null && countdown > 0 && (
            <p className="text-center text-xs text-neutral-500">
              Redirecionando pro grupo em {countdown}s se você não continuar
            </p>
          )}
        </div>
      )}

      {step.kind === "question" && (
        <div className="px-4 pt-8 pb-8 flex flex-col gap-4">
          <h2 className="text-xl font-extrabold leading-snug">
            {quiz.questions[step.index].question}
          </h2>
          <div className="flex flex-col gap-3">
            {quiz.questions[step.index].options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => selectAnswer(quiz.questions[step.index], opt.id, step.index)}
                className="flex items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-900 hover:border-neutral-500 transition px-4 py-4 text-left text-sm"
              >
                <span className="w-5 h-5 rounded-full border-2 border-neutral-500 shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.kind === "final" && (
        <div className="px-4 pt-8 pb-8 flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold leading-tight">
            {quiz.finalStep.title}{" "}
            {quiz.finalStep.titleHighlight && (
              <span className="text-blue-500">{quiz.finalStep.titleHighlight}</span>
            )}
          </h2>

          {quiz.finalStep.progressLabel && (
            <div>
              <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                <span>{quiz.finalStep.progressLabel}</span>
                <span>{finalBarPercent}%</span>
              </div>
              <ProgressBar
                percent={finalBarPercent}
                durationMs={(quiz.finalStep.autoRedirectSeconds ?? DEFAULT_FINAL_AUTO_REDIRECT_SECONDS) * 1000}
              />
            </div>
          )}

          {quiz.finalStep.bodyText && (
            <p className="text-sm text-neutral-300 leading-relaxed">{quiz.finalStep.bodyText}</p>
          )}

          <button
            onClick={handleFinish}
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition py-4 text-sm font-bold uppercase tracking-wide"
          >
            {submitting ? "Enviando..." : quiz.finalStep.buttonLabel || "Entrar no grupo"}
          </button>
        </div>
      )}
    </PhoneFrame>
  );
}
