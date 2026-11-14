import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useFonts } from "./CleanQuiz";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";

// Página de agendamento (/q/:slug/agendar) — substitui o Calendly no fim do
// quiz. Horários vêm da agenda interna do CRM (GET /booking/slots); confirmar
// grava a reunião no lead (POST /booking), que já avisa o closer.
// Quem chega pelo quiz é identificado pelo `quiz_lead_id` (localStorage, salvo
// pelo CleanQuiz); quem abre o link direto informa nome e WhatsApp.

// Textos: por enquanto fixos aqui (cópia do Calendly antigo). Vão virar
// campos editáveis no builder do quiz.
const COPY = {
  host: "Fagner Batista",
  title: "Convert HAIR",
  duration: "30 min",
  conference: "Detalhes da webconferência são providenciados após a confirmação.",
  description:
    "Nessa reunião iremos revelar o método que fez clientes dobrarem o seu faturamento por meio de um funil de clientes prontos pra comprar no WhatsApp da loja.",
  timerLabel: "Garanta seu horário em",
  timerExpired: "Os horários estão acabando. Escolha o seu agora.",
};

const TIMER_SECONDS = 10 * 60;
const NAVY = "#1B1B4B";
const PINK = "#EC3B9E";
const SLATE = "#4F6079";

const WEEKDAYS_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const WEEKDAYS_SHORT = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

interface Slot { at: string; hour: number }
interface Day { ymd: string; weekday: number; slots: Slot[] }

const pad = (n: number) => String(n).padStart(2, "0");
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const dateLabel = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
};

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2" aria-label="AI convertHair">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <path d="M8 4h28a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H18l-8 6v-6H8a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z" fill={PINK} />
        <text x="22" y="27" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="17" fill="#fff">AI</text>
      </svg>
      <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: NAVY }}>
        convert<span style={{ color: PINK }}>Hair</span>
      </span>
    </div>
  );
}

/** Contador regressivo; o início fica na sessão, então recarregar a página não zera. */
function useCountdown() {
  const [left, setLeft] = useState(TIMER_SECONDS);
  useEffect(() => {
    let start = Date.now();
    try {
      const saved = Number(sessionStorage.getItem("booking_timer_start"));
      if (saved > 0) start = saved;
      else sessionStorage.setItem("booking_timer_start", String(start));
    } catch { /* sessão indisponível: conta a partir de agora */ }
    const tick = () => setLeft(Math.max(0, TIMER_SECONDS - Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

export default function QuizBooking() {
  useFonts();
  const { slug } = useParams();
  const leadId = useMemo(() => {
    try { return localStorage.getItem("quiz_lead_id") || ""; } catch { return ""; }
  }, []);

  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const left = useCountdown();

  const loadSlots = () =>
    fetch(`${API_URL}/booking/slots`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: { days: Day[] }) => {
        setDays(d.days || []);
        setMonth((cur) => {
          if (cur || !d.days?.length) return cur;
          const [y, m] = d.days[0].ymd.split("-").map(Number);
          return { y, m };
        });
      })
      .catch(() => setLoadError(true));

  useEffect(() => {
    document.title = "Escolha uma data e horário";
    loadSlots();
    if (leadId) {
      fetch(`${API_URL}/booking/current?leadId=${encodeURIComponent(leadId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.meetingAt) setBooked(d.meetingAt); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byYmd = useMemo(() => new Map((days || []).map((d) => [d.ymd, d])), [days]);
  const totalSlots = useMemo(() => (days || []).reduce((n, d) => n + d.slots.length, 0), [days]);

  const today = new Date();
  const view = month || { y: today.getFullYear(), m: today.getMonth() + 1 };
  const firstWeekday = new Date(view.y, view.m - 1, 1).getDay();
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const lastYmd = days?.length ? days[days.length - 1].ymd : "";
  const canGoNext = lastYmd > `${view.y}-${pad(view.m)}-31`;
  const canGoPrev = (days?.[0]?.ymd || "") < `${view.y}-${pad(view.m)}-01`;
  const shiftMonth = (delta: number) => {
    const d = new Date(view.y, view.m - 1 + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };

  const pickDay = (day: Day) => {
    setSelectedDay(day);
    setSelectedSlot(null);
    setError("");
    window.scrollTo({ top: 0 });
  };

  const confirm = async () => {
    if (!selectedSlot || saving) return;
    if (!leadId && phone.replace(/\D/g, "").length < 10) {
      setError("Informe seu WhatsApp com DDD.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: leadId || undefined, name, phone, at: selectedSlot.at }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message || "Não foi possível agendar. Tente de novo.");
        if (res.status === 409) {
          setSelectedSlot(null);
          await loadSlots();
          setSelectedDay(null);
        }
        return;
      }
      setBooked(data.meetingAt);
      window.scrollTo({ top: 0 });
    } catch {
      setError("Sem conexão. Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  const fontBody = { fontFamily: "Roboto, system-ui, sans-serif" };
  const fontTitle = { fontFamily: "Sora, system-ui, sans-serif" };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FA] flex justify-center" style={fontBody}>
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* Contador */}
        {!booked && (
          <div className="sticky top-0 z-10 px-4 py-2.5 text-center text-white text-[13px] font-medium" style={{ background: NAVY }}>
            {left > 0 ? (
              <>
                {COPY.timerLabel}{" "}
                <span className="inline-block min-w-[52px] rounded-md px-1.5 py-0.5 font-bold tabular-nums" style={{ background: PINK, fontVariantNumeric: "tabular-nums" }}>
                  {pad(Math.floor(left / 60))}:{pad(left % 60)}
                </span>
              </>
            ) : COPY.timerExpired}
          </div>
        )}

        {booked ? (
          <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-12 text-center">
            <Logo />
            <div className="mt-10 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E7F8EE" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1E9E57" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <h1 className="mt-5 text-[24px] font-bold leading-tight" style={{ ...fontTitle, color: NAVY }}>Reunião confirmada!</h1>
            <p className="mt-4 text-[17px] font-semibold capitalize" style={{ color: NAVY }}>
              {new Date(booked).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-[28px] font-bold tabular-nums" style={{ ...fontTitle, color: PINK }}>{timeLabel(booked)}</p>
            <p className="text-[13px]" style={{ color: SLATE }}>Horário de Brasília · {COPY.duration}</p>
            <p className="mt-6 text-[15px] leading-relaxed" style={{ color: SLATE }}>
              Vamos te chamar no WhatsApp com o link da sala antes da reunião. Deixe esse horário reservado.
            </p>
          </div>
        ) : selectedDay ? (
          /* ── Horários do dia ── */
          <div className="flex-1 flex flex-col">
            <div className="relative px-4 pt-5 pb-4 text-center border-b border-slate-200">
              <button
                onClick={() => { setSelectedDay(null); setSelectedSlot(null); setError(""); }}
                aria-label="Voltar para o calendário"
                className="absolute left-3 top-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              </button>
              <p className="text-[20px] font-bold" style={{ ...fontTitle, color: NAVY }}>{WEEKDAYS_LONG[selectedDay.weekday]}</p>
              <p className="text-[14px]" style={{ color: NAVY }}>{dateLabel(selectedDay.ymd)}</p>
              <p className="mt-1 text-[12px]" style={{ color: SLATE }}>Horário de Brasília</p>
            </div>

            <div className="px-4 pt-6 pb-10">
              <h2 className="text-center text-[19px] font-bold" style={{ ...fontTitle, color: NAVY }}>Selecione um Horário</h2>
              <p className="mt-1 text-center text-[13px]" style={{ color: SLATE }}>
                Duração: {COPY.duration}
                {selectedDay.slots.length <= 3 && (
                  <span className="font-semibold" style={{ color: PINK }}>
                    {" · "}{selectedDay.slots.length === 1 ? "resta 1 horário" : `restam ${selectedDay.slots.length} horários`} neste dia
                  </span>
                )}
              </p>

              {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-center text-[13px] font-medium text-red-700">{error}</p>}

              <div className="mt-5 flex flex-col gap-3">
                {selectedDay.slots.map((slot) => {
                  const active = selectedSlot?.at === slot.at;
                  return (
                    <div key={slot.at}>
                      <button
                        onClick={() => { setSelectedSlot(active ? null : slot); setError(""); }}
                        aria-pressed={active}
                        className="w-full rounded-lg border py-4 text-[16px] font-bold tabular-nums transition"
                        style={active ? { background: NAVY, borderColor: NAVY, color: "#fff" } : { borderColor: PINK, color: PINK, background: "#fff" }}
                      >
                        {timeLabel(slot.at)}
                      </button>
                      {active && (
                        <div className="mt-2.5 rounded-lg bg-slate-50 p-3">
                          {!leadId && (
                            <div className="mb-3 flex flex-col gap-2">
                              <label htmlFor="booking-name" className="text-[12px] font-medium" style={{ color: SLATE }}>Seu nome</label>
                              <input id="booking-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-[16px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300" style={{ color: "#111827", caretColor: "#111827" }} />
                              <label htmlFor="booking-phone" className="text-[12px] font-medium" style={{ color: SLATE }}>WhatsApp com DDD</label>
                              <input id="booking-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-[16px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300" style={{ color: "#111827", caretColor: "#111827" }} />
                            </div>
                          )}
                          <button
                            onClick={confirm}
                            disabled={saving}
                            className="w-full rounded-lg py-4 text-[16px] font-bold text-white transition disabled:opacity-60"
                            style={{ background: PINK }}
                          >
                            {saving ? "Confirmando…" : `Confirmar ${timeLabel(slot.at)}`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Apresentação + calendário ── */
          <>
            <div className="px-6 py-7 border-b border-slate-200"><Logo /></div>

            <div className="px-7 pt-7 pb-8 border-b border-slate-200">
              <p className="text-center text-[16px] font-semibold" style={{ color: SLATE }}>{COPY.host}</p>
              <h1 className="mt-1 text-center text-[27px] font-bold leading-tight" style={{ ...fontTitle, color: NAVY }}>{COPY.title}</h1>

              <div className="mt-6 flex items-center gap-3 text-[15px] font-semibold" style={{ color: SLATE }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                {COPY.duration}
              </div>
              <div className="mt-3 flex items-start gap-3 text-[15px] font-semibold leading-snug" style={{ color: SLATE }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-0.5"><rect x="3" y="7" width="12" height="10" rx="2" /><path d="M15 11l5-3v8l-5-3z" /></svg>
                {COPY.conference}
              </div>
              <p className="mt-5 text-[16px] leading-relaxed" style={{ color: NAVY }}>{COPY.description}</p>
            </div>

            <div className="px-4 pt-8 pb-12">
              <h2 className="text-center text-[22px] font-bold" style={{ ...fontTitle, color: NAVY }}>Selecione um Dia</h2>

              {loadError ? (
                <p className="mt-8 text-center text-[15px]" style={{ color: SLATE }}>Não foi possível carregar a agenda. Recarregue a página.</p>
              ) : !days ? (
                <p className="mt-8 text-center text-[15px]" style={{ color: SLATE }}>Carregando horários…</p>
              ) : !days.length ? (
                <p className="mt-8 text-center text-[15px]" style={{ color: SLATE }}>Sem horários livres no momento. Vamos te chamar no WhatsApp para combinar.</p>
              ) : (
                <>
                  {/* Só avisa quando a agenda está de fato apertada — número alto não cria urgência. */}
                  {totalSlots <= 5 && (
                    <p className="mt-2 text-center text-[13px] font-medium" style={{ color: PINK }}>
                      {totalSlots === 1 ? "Resta 1 horário livre" : `Restam ${totalSlots} horários livres`} na agenda
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-center gap-6">
                    <button onClick={() => shiftMonth(-1)} disabled={!canGoPrev} aria-label="Mês anterior" className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-25 hover:bg-slate-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                    </button>
                    <p className="min-w-[150px] text-center text-[16px] font-semibold" style={{ color: NAVY }}>{MONTHS[view.m - 1]} {view.y}</p>
                    <button onClick={() => shiftMonth(1)} disabled={!canGoNext} aria-label="Próximo mês" className="w-10 h-10 flex items-center justify-center rounded-full disabled:opacity-25 hover:bg-slate-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-7 text-center">
                    {WEEKDAYS_SHORT.map((w) => (
                      <span key={w} className="pb-3 text-[12px] font-medium" style={{ color: SLATE }}>{w}</span>
                    ))}
                    {Array.from({ length: firstWeekday }, (_, i) => <span key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const dayNum = i + 1;
                      const ymd = `${view.y}-${pad(view.m)}-${pad(dayNum)}`;
                      const day = byYmd.get(ymd);
                      return (
                        <div key={ymd} className="flex items-center justify-center py-1">
                          {day ? (
                            <button
                              onClick={() => pickDay(day)}
                              aria-label={`${dayNum} de ${MONTHS[view.m - 1]}, ${day.slots.length} horários livres`}
                              className="w-11 h-11 rounded-full text-[16px] font-bold tabular-nums transition active:scale-95"
                              style={{ background: "#FDE7F3", color: PINK }}
                            >
                              {dayNum}
                            </button>
                          ) : (
                            <span className="w-11 h-11 flex items-center justify-center text-[16px] tabular-nums text-slate-400">{dayNum}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-center text-[12px]" style={{ color: SLATE }}>Horário de Brasília</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
