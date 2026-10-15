import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

// Template "Clean" do quiz (quiz.template === 'clean'): fundo branco, dourado
// discreto, cabeçalho fixo com passos numerados e etapas de contato com campos
// configuráveis no builder do CRM. Ao terminar, manda o submit e redireciona
// direto pro whatsappUrl (não tem tela final). O layout clássico (Quiz.tsx)
// continua intacto pros quizzes antigos.

type FieldKey = "name" | "phone" | "email" | "instagram" | "company" | "custom";

export interface CleanField {
  id: string;
  key: FieldKey;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export interface CleanQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type?: "choice" | "phone" | "contact";
  // redirectUrl: opção de "desvio" — ao escolher, a pessoa sai do quiz pra esse
  // link (sem pedir contato, sem submit, sem evento MQL/QuizCompleto).
  options: { id: string; label: string; redirectUrl?: string }[];
  fields?: CleanField[];
}

export interface CleanQuizData {
  slug: string;
  whatsappUrl?: string | null;
  presentation: { title?: string; titleHighlight?: string; subtitleBox?: string; footerNote?: string };
  questions: CleanQuestion[];
  finalStep: { buttonLabel?: string };
  thankYouPage?: { enabled?: boolean } | null;
  lowTicketPage?: { enabled?: boolean } | null;
}

interface Tracking {
  clickId?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  [key: string]: string | undefined;
}

const GOLD = "#B8924A";
const BRONZE = "#6E5022";
const BUTTON_BG = "linear-gradient(100deg, #6B4C1E 0%, #A07D3C 50%, #6B4C1E 100%)";
const BAR_BG = "linear-gradient(90deg, #8A6A2F 0%, #C9A45C 100%)";
const DEFAULT_FOOTER = "Seus dados estão seguros e serão usados apenas para contato.";

const DEFAULT_PLACEHOLDER: Record<FieldKey, string> = {
  name: "Seu nome completo",
  phone: "(DD) 9 XXXX-XXXX",
  email: "voce@email.com",
  instagram: "seuperfil",
  company: "Nome do seu negócio",
  custom: "",
};

// Uma etapa de telefone do layout antigo vira uma etapa de contato com 1 campo,
// pra não precisar de dois caminhos de renderização aqui.
function fieldsOf(q: CleanQuestion): CleanField[] {
  if (q.type === "phone") return [{ id: q.id, key: "phone", required: true }];
  return q.fields || [];
}

function isInputStep(q: CleanQuestion) {
  return q.type === "contact" || q.type === "phone";
}

function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validate(field: CleanField, value: string): string | null {
  const v = value.trim();
  if (!v) return field.required ? "Campo obrigatório" : null;
  if (field.key === "phone" && v.replace(/\D/g, "").length < 10) return "Telefone incompleto";
  if (field.key === "email" && !/^\S+@\S+\.\S+$/.test(v)) return "E-mail inválido";
  return null;
}

export function useFonts() {
  useEffect(() => {
    const id = "clean-quiz-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Roboto:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
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

function Stepper({ total, current }: { total: number; current: number }) {
  const percent = Math.round(((current + 1) / total) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percent}%`, background: BAR_BG }} />
      </div>
      <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`flex items-center ${i < total - 1 ? "flex-1" : ""}`}>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition"
              style={
                i < current
                  ? { background: BRONZE, color: "#fff" }
                  : i === current
                  ? { background: "#FBF6EA", color: BRONZE, border: `2px solid ${BRONZE}`, boxShadow: "0 0 0 4px #F3EAD6" }
                  : { background: "#fff", color: "#9CA3AF", border: "1.5px solid #D1D5DB" }
              }
            >
              {i < current ? "✓" : i + 1}
            </span>
            {i < total - 1 && <span className="flex-1 h-px mx-2" style={{ background: i < current ? BRONZE : "#E5E7EB" }} />}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Passo {current + 1} de {total}
      </p>
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onChange,
  autoFocus,
}: {
  field: CleanField;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const placeholder = field.placeholder || DEFAULT_PLACEHOLDER[field.key];
  const prefix = field.key === "phone" ? "🇧🇷 +55" : field.key === "instagram" ? "@" : null;
  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <label htmlFor={`f-${field.id}`} className="text-sm font-medium text-neutral-900">
          {field.label}
        </label>
      )}
      <div
        className={`flex items-center rounded-xl border transition focus-within:bg-[#FBF6EA] ${
          error ? "border-red-400 bg-red-50" : "border-transparent bg-neutral-200/70 focus-within:border-[#D8B25E]"
        }`}
      >
        {prefix && <span className="pl-4 text-neutral-500 text-[15px] select-none whitespace-nowrap shrink-0">{prefix}</span>}
        <input
          id={`f-${field.id}`}
          autoFocus={autoFocus}
          type={field.key === "email" ? "email" : field.key === "phone" ? "tel" : "text"}
          inputMode={field.key === "phone" ? "numeric" : field.key === "email" ? "email" : "text"}
          autoComplete={
            field.key === "name" ? "name" : field.key === "phone" ? "tel-national" : field.key === "email" ? "email" : "off"
          }
          autoCapitalize={field.key === "instagram" || field.key === "email" ? "none" : "words"}
          value={value}
          onChange={(e) => onChange(field.key === "phone" ? maskPhone(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none py-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 ${
            prefix ? "pl-2 pr-4" : "px-4"
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function CleanQuiz({
  quiz,
  isPreview,
  tracking,
  onRestart,
}: {
  quiz: CleanQuizData;
  isPreview: boolean;
  tracking: Tracking;
  onRestart?: () => void;
}) {
  useFonts();
  useEffect(() => {
    if (quiz.presentation.title) document.title = quiz.presentation.title;
  }, [quiz.presentation.title]);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const finishedRef = useRef(false);

  const questions = quiz.questions;
  const total = Math.max(1, questions.length);
  const q = questions[Math.min(index, questions.length - 1)];
  const isLast = index >= questions.length - 1;
  const redirectUrl = quiz.whatsappUrl || "";

  function sendProgress(questionIndex: number, questionId?: string, optionId?: string) {
    if (isPreview) return;
    fetch(`${API_URL}/quiz/${quiz.slug}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clickId: tracking.clickId,
        questionIndex,
        questionId,
        optionId,
        fbclid: tracking.fbclid,
        fbc: tracking.fbc,
        fbp: tracking.fbp,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  function restart() {
    finishedRef.current = false;
    setIndex(0);
    setChoices({});
    setValues({});
    setErrors({});
    setSubmitting(false);
    onRestart?.();
  }

  function buildAnswers(finalValues: typeof values, finalChoices: typeof choices) {
    return questions
      .map((qq) => {
        if (isInputStep(qq)) {
          const v = finalValues[qq.id] || {};
          if (qq.type === "phone") return { questionId: qq.id, value: v[qq.id] || "" };
          return { questionId: qq.id, values: v };
        }
        return finalChoices[qq.id] ? { questionId: qq.id, optionId: finalChoices[qq.id] } : null;
      })
      .filter(Boolean);
  }

  // Lead parcial: assim que a pessoa passa da etapa com telefone, o CRM já
  // cria o lead com o que ela respondeu até ali — mesmo que desista depois.
  function sendPartialLead(finalValues: typeof values) {
    if (isPreview) return;
    fetch(`${API_URL}/quiz/${quiz.slug}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: buildAnswers(finalValues, choices), ...tracking }),
      keepalive: true,
    }).catch(() => {});
  }

  async function finish(finalValues = values, finalChoices = choices) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    if (isPreview) {
      setTimeout(restart, 800);
      return;
    }
    const answers = buildAnswers(finalValues, finalChoices);
    // Página do vídeo ligada no builder → passa por ela antes do destino final.
    const thankYouUrl = quiz.thankYouPage?.enabled ? `/q/${quiz.slug}/obrigado` : null;
    try {
      const res = await fetch(`${API_URL}/quiz/${quiz.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, ...tracking }),
        keepalive: true,
      });
      const data = await res.json().catch(() => null);
      window.location.href = thankYouUrl || data?.redirectUrl || redirectUrl;
    } catch {
      window.location.href = thankYouUrl || redirectUrl;
    }
  }

  function next(nextValues = values, nextChoices = choices) {
    if (isLast) finish(nextValues, nextChoices);
    else setIndex((i) => i + 1);
  }

  function pick(optionId: string) {
    const picked = q.options.find((o) => o.id === optionId);
    if (picked?.redirectUrl?.trim()) {
      setChoices({ ...choices, [q.id]: optionId });
      sendProgress(index, q.id, optionId);
      if (isPreview) {
        setTimeout(restart, 800);
        return;
      }
      finishedRef.current = true;
      setSubmitting(true);
      setTimeout(() => { window.location.href = picked.redirectUrl!.trim(); }, 280);
      return;
    }
    const nextChoices = { ...choices, [q.id]: optionId };
    setChoices(nextChoices);
    sendProgress(index, q.id, optionId);
    setTimeout(() => next(values, nextChoices), 280);
  }

  function submitStep() {
    const fields = fieldsOf(q);
    const stepValues = values[q.id] || {};
    const stepErrors: Record<string, string | null> = {};
    for (const f of fields) stepErrors[f.id] = validate(f, stepValues[f.id] || "");
    setErrors(stepErrors);
    if (Object.values(stepErrors).some(Boolean)) return;
    sendProgress(index, q.id);
    if (fields.some((f) => f.key === "phone")) sendPartialLead(values);
    next();
  }

  function setValue(fieldId: string, v: string) {
    setValues((prev) => ({ ...prev, [q.id]: { ...(prev[q.id] || {}), [fieldId]: v } }));
    if (errors[fieldId]) setErrors((prev) => ({ ...prev, [fieldId]: null }));
  }

  if (!q) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 text-center text-neutral-500 text-sm">
        Adicione perguntas a este quiz no CRM.
      </div>
    );
  }

  const fields = fieldsOf(q);
  const singleField = isInputStep(q) && fields.length === 1;
  const lastLabel = quiz.finalStep.buttonLabel || "Enviar";

  return (
    <div className="min-h-screen w-full bg-white flex justify-center" style={{ fontFamily: "Roboto, system-ui, sans-serif" }}>
      <div className="w-full max-w-[480px] px-6 pt-8 pb-10 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1
            className="text-[26px] leading-[1.2] font-bold text-neutral-900"
            style={{ fontFamily: "Sora, system-ui, sans-serif", textWrap: "balance" } as React.CSSProperties}
          >
            <Highlighted text={quiz.presentation.title} highlight={quiz.presentation.titleHighlight} />
          </h1>
          {quiz.presentation.subtitleBox && (
            <p className="text-sm font-medium text-neutral-600">{quiz.presentation.subtitleBox}</p>
          )}
        </header>

        <Stepper total={total} current={index} />

        <section key={q.id} className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg leading-snug font-semibold text-neutral-900" style={{ fontFamily: "Sora, system-ui, sans-serif" }}>
              {q.question}
            </h2>
            {q.subtitle && <p className="text-sm text-neutral-500">{q.subtitle}</p>}
          </div>

          {!isInputStep(q) && (
            <div className="flex flex-col gap-3">
              {q.options.map((opt) => {
                const selected = choices[q.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => pick(opt.id)}
                    disabled={submitting}
                    className="flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-[15px] text-neutral-900 transition hover:border-[#D8B25E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B25E]"
                    style={selected ? { borderColor: "#D8B25E", background: "#FFFBF0" } : { borderColor: "#E5E7EB", background: "#fff" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                      style={{ border: `2px solid ${selected ? BRONZE : "#D1D5DB"}` }}
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRONZE }} />}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="self-start text-sm text-neutral-500 hover:text-neutral-800 transition"
                >
                  ‹ Voltar
                </button>
              )}
            </div>
          )}

          {isInputStep(q) && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submitStep();
              }}
              className="flex flex-col gap-4"
            >
              {fields.map((f, i) => (
                <FieldInput
                  key={f.id}
                  field={singleField ? { ...f, label: undefined } : f}
                  value={(values[q.id] || {})[f.id] || ""}
                  error={errors[f.id] || null}
                  onChange={(v) => setValue(f.id, v)}
                  autoFocus={i === 0 && !isPreview}
                />
              ))}
              <div className="flex gap-3 pt-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i - 1)}
                    className="rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[15px] font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl py-3.5 text-[16px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70"
                  style={{ background: BUTTON_BG, fontFamily: "Sora, system-ui, sans-serif" }}
                >
                  {submitting ? "Enviando..." : isLast ? lastLabel : "Continuar"}
                </button>
              </div>
            </form>
          )}
        </section>

        <p className="text-center text-xs text-neutral-500 pt-2">{quiz.presentation.footerNote || DEFAULT_FOOTER}</p>
      </div>
    </div>
  );
}
