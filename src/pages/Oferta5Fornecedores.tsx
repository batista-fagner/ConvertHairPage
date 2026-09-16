import { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Quote,
  ImageOff,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
const QUIZ_SLUG = "5fornecedores";

// Piso de faturamento por faixa do quiz — usado só pra garantir que a conta
// de "menos de X%" seja SEMPRE verdadeira mesmo no pior caso da faixa (nunca
// o valor exato, que a gente não tem). "Até 10 mil" não tem piso declarado no
// quiz, então usa uma estimativa conservadora de quem já revende cabelo.
const REVENUE_FLOOR: Record<string, number> = {
  "Até 10 mil": 5000,
  "10 mil a 20 mil": 10000,
  "20 mil a 30 mil": 20000,
  "Acima de 30 mil": 30000,
};

interface Personalization {
  faturamento?: string;
  mudaria?: string;
}

function readPersonalization(slug: string): Personalization {
  try {
    const raw = localStorage.getItem(`quiz_personalization_${slug}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function parsePrice(value?: string): number | null {
  if (!value) return null;
  const n = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatPct(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

interface Fornecedor {
  numero: number;
  diferencial: string;
  detalhe: string;
  imagem?: string;
}

interface Dor {
  titulo: string;
  texto: string;
}

interface Faq {
  pergunta: string;
  resposta: string;
}

// Conteúdo editável no Quiz Builder do CRM (aba Quizzes → "5 Fornecedores" →
// Etapa 4 "Página de venda"). Layout/cores ficam fixos aqui no código; só o
// TEXTO/FOTOS/VALORES vêm do quiz. Os valores abaixo são só fallback — usados
// enquanto o quiz não tiver salesPage preenchido (ou se o fetch falhar).
interface SalesPage {
  headlineBadge?: string;
  headlineTitle?: string;
  headlineHighlight?: string;
  headlineSubtitle?: string;
  dores?: Dor[];
  ofertaBadge?: string;
  ofertaTitle?: string;
  ofertaSubtitle?: string;
  criterios?: string[];
  fornecedores?: Fornecedor[];
  valorAncoragemTexto?: string;
  precoDe?: string;
  precoPor?: string;
  valorRodape?: string;
  depoimentoTexto?: string;
  depoimentoAutor?: string;
  garantiaTitulo?: string;
  garantiaTexto?: string;
  ctaTitulo?: string;
  ctaBotaoLabel?: string;
  faq?: Faq[];
}

const DEFAULT: Required<SalesPage> = {
  headlineBadge: "Você está qualificada",
  headlineTitle: "Chega de arriscar com fornecedor. Receba os 5 validados por quem já testou na prática",
  headlineHighlight: "5 validados",
  headlineSubtitle:
    "Fornecedor errado é prejuízo garantido. Fornecedor certo é risco zero — cabelo de verdade, margem boa e sem susto.",
  dores: [
    { titulo: "Golpe de fornecedor", texto: "Paga adiantado e o fornecedor some, atrasa ou manda menos do que combinou." },
    { titulo: "Cabelo de baixa qualidade", texto: "Vem misturado, embola fácil e não é 100% humano de verdade." },
    { titulo: "Cliente perdido", texto: "A cliente reclama, devolve ou nunca mais compra de você por causa da qualidade." },
  ],
  ofertaBadge: "O que você recebe",
  ofertaTitle: "5 fornecedores validados pessoalmente, prontos pra você chamar hoje",
  ofertaSubtitle: "Cada um já foi filtrado pelos 4 critérios abaixo — o mesmo padrão usado por quem já vende cabelo todo santo dia.",
  criterios: [
    "Fios inteiros, pontas cheias",
    "100% humano, sem mistura sintética",
    "Preço com margem boa de revenda",
    "Entrega fácil, sem enrolação",
  ],
  fornecedores: [
    { numero: 1, diferencial: "Indiano, linha fabril", detalhe: "Alta escala pra quem revende em volume" },
    { numero: 2, diferencial: "Indiano, preço de entrada", detalhe: "Ótimo custo-benefício pra quem tá começando" },
    { numero: 3, diferencial: "Especialista em coloridos e loiros", detalhe: "Entrega rápida, ideal pra pedidos urgentes" },
    { numero: 4, diferencial: "Parceria internacional", detalhe: "Cabelo brasileiro, importação direta" },
    { numero: 5, diferencial: "Referência no mercado", detalhe: "Mais de 30 anos de experiência e confiança" },
  ],
  valorAncoragemTexto: "Só o fornecedor principal da lista já foi avaliado publicamente em R$ 10.000 de valor percebido.",
  precoDe: "R$ 997",
  precoPor: "R$ 47",
  valorRodape:
    "Pra quem fatura R$ 10 mil/mês ou mais, isso representa menos de 0,5% do seu faturamento — pra nunca mais depender de sorte na hora de escolher fornecedor.",
  depoimentoTexto: "Só com essa lista eu economizei mais de R$ 20 mil comprando direto na fonte certa, sem pagar por intermediário.",
  depoimentoAutor: "Relato real de uma participante do Workshop Como Vender Cabelo Todo Santo Dia",
  garantiaTitulo: "Contato direto, sem enrolação",
  garantiaTexto:
    "Você recebe o nome e o WhatsApp de cada um dos 5 fornecedores. Se algum não responder ou não bater com o combinado, você fala com a gente e a gente resolve.",
  ctaTitulo: "Pare de arriscar com fornecedor. Comece hoje com quem já é validado.",
  ctaBotaoLabel: "Quero os 5 fornecedores agora",
  faq: [
    { pergunta: "Funciona pra qualquer estado do Brasil?", resposta: "Sim — os 5 fornecedores atendem por WhatsApp/envio, independente de onde você está." },
    { pergunta: "Recebo os contatos na hora?", resposta: "Sim, o acesso é liberado automaticamente assim que o pagamento é confirmado." },
    { pergunta: "Preciso comprar uma quantidade mínima?", resposta: "Cada fornecedor tem sua própria condição — isso vem detalhado junto com o contato de cada um." },
  ],
};

function pick<T>(value: T[] | undefined, fallback: T[]): T[] {
  return value && value.length > 0 ? value : fallback;
}

function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const idx = text.indexOf(highlight);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="gradient-text">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function FornecedorImage({ imagem, numero }: { imagem?: string; numero: number }) {
  const [failed, setFailed] = useState(false);
  if (!imagem || failed) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground">
        <ImageOff className="h-6 w-6 opacity-40" />
      </div>
    );
  }
  return (
    <img
      src={imagem}
      alt={`Fornecedor ${numero}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-40 w-full rounded-xl object-cover"
    />
  );
}

export default function Oferta5Fornecedores() {
  const [salesPage, setSalesPage] = useState<SalesPage | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(true);
  // Lida uma vez, na montagem — gravado pelo quiz (Quiz.tsx) no navegador
  // dela antes de redirecionar pra cá, não vem de API nem de query string.
  const [personalization] = useState<Personalization>(() => readPersonalization(QUIZ_SLUG));

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.fbq) window.fbq("track", "ViewContent");

    fetch(`${API_URL}/quiz/${QUIZ_SLUG}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCheckoutUrl(data?.checkoutUrl || null);
        setSalesPage(data?.salesPage || null);
      })
      .catch(() => {
        setCheckoutUrl(null);
        setSalesPage(null);
      })
      .finally(() => setLoadingCheckout(false));
  }, []);

  function handleBuyClick() {
    if (window.fbq) window.fbq("track", "InitiateCheckout");
  }

  const sp = salesPage || {};
  const dores = pick(sp.dores, DEFAULT.dores);
  const criterios = pick(sp.criterios, DEFAULT.criterios);
  const fornecedores = pick(sp.fornecedores, DEFAULT.fornecedores);
  const faq = pick(sp.faq, DEFAULT.faq);

  // Personaliza a ancoragem de valor com a faixa de faturamento que ELA
  // respondeu no quiz — cai pro texto genérico do builder se não tiver o
  // dado (acessou a página direto, sem passar pelo quiz) ou a faixa não bater
  // com nenhuma configurada acima.
  const revenueFloor = personalization.faturamento ? REVENUE_FLOOR[personalization.faturamento] : undefined;
  const price = parsePrice(sp.precoPor || DEFAULT.precoPor);
  const valorRodape =
    revenueFloor && price
      ? `Você disse que fatura ${personalization.faturamento} — isso representa menos de ${formatPct(Math.ceil((price / revenueFloor) * 1000) / 10)}% do seu faturamento, pra nunca mais depender de sorte na hora de escolher fornecedor.`
      : sp.valorRodape || DEFAULT.valorRodape;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background ambiente — mesmo padrão visual do resto do site */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full overflow-x-hidden">
        {/* ── 1. Headline de qualificação ── */}
        <section className="pb-16 pt-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {sp.headlineBadge || DEFAULT.headlineBadge}
              </div>
              <h1 className="animate-fade-up-delay-1 mb-6 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl text-balance">
                <Highlighted
                  text={sp.headlineTitle || DEFAULT.headlineTitle}
                  highlight={sp.headlineHighlight ?? DEFAULT.headlineHighlight}
                />
              </h1>
              <p className="animate-fade-up-delay-2 mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
                {sp.headlineSubtitle || DEFAULT.headlineSubtitle}
              </p>

              {/* Callback da resposta dela na última pergunta do quiz ("o que
                  isso mudaria pra você") — só aparece se a personalização
                  existir (veio do quiz de verdade, não acesso direto). */}
              {personalization.mudaria && (
                <div className="animate-fade-up-delay-3 mx-auto mt-6 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    Você mesma disse que isso mudaria: <span className="font-semibold">"{personalization.mudaria}"</span> — é exatamente isso que essa lista entrega.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. Reforço da dor ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
                Você já deve ter passado por isso
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {dores.map((dor, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="mb-2 font-semibold">{dor.titulo}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{dor.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3/4. Oferta + bullets dos fornecedores ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-4 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  {sp.ofertaBadge || DEFAULT.ofertaBadge}
                </span>
              </div>
              <h2 className="mx-auto mb-4 max-w-2xl text-center text-2xl font-bold tracking-tight sm:text-3xl">
                {sp.ofertaTitle || DEFAULT.ofertaTitle}
              </h2>
              <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
                {sp.ofertaSubtitle || DEFAULT.ofertaSubtitle}
              </p>

              <div className="mb-12 flex flex-wrap justify-center gap-3">
                {criterios.map((c, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {c}
                  </span>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fornecedores.map((f, idx) => (
                  <div key={idx} className="glass-card overflow-hidden rounded-2xl p-4">
                    <FornecedorImage imagem={f.imagem} numero={f.numero ?? idx + 1} />
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Fornecedor {f.numero ?? idx + 1}
                      </p>
                      <h3 className="mt-1 font-semibold leading-snug">{f.diferencial}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.detalhe}</p>
                    </div>
                  </div>
                ))}
                <div className="glass-card glow-primary flex flex-col items-center justify-center rounded-2xl p-6 text-center">
                  <Lock className="mb-3 h-6 w-6 text-accent" />
                  <p className="text-sm font-semibold">Nome e contato de cada um</p>
                  <p className="mt-1 text-sm text-muted-foreground">liberados após a confirmação do pagamento</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Ancoragem de valor ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="glass-card glow-primary mx-auto max-w-2xl rounded-3xl p-8 text-center sm:p-12">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Valor já revelado ao vivo
              </p>
              <p className="mt-3 text-lg leading-relaxed">{sp.valorAncoragemTexto || DEFAULT.valorAncoragemTexto}</p>
              <div className="my-8 flex items-center justify-center gap-4 sm:gap-8">
                <div>
                  <p className="text-sm text-muted-foreground line-through">
                    De {sp.precoDe || DEFAULT.precoDe}
                  </p>
                  <p className="text-4xl font-bold sm:text-5xl">
                    <span className="gradient-text">{sp.precoPor || DEFAULT.precoPor}</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{valorRodape}</p>
            </div>
          </div>
        </section>

        {/* ── 6. Prova social ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="glass-card rounded-2xl p-8">
                <Quote className="mb-4 h-8 w-8 text-primary/60" />
                <p className="text-lg leading-relaxed">"{sp.depoimentoTexto || DEFAULT.depoimentoTexto}"</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  — {sp.depoimentoAutor || DEFAULT.depoimentoAutor}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Garantia ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-2xl items-start gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-6">
              <ShieldCheck className="h-8 w-8 shrink-0 text-accent" />
              <div>
                <h3 className="font-semibold">{sp.garantiaTitulo || DEFAULT.garantiaTitulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{sp.garantiaTexto || DEFAULT.garantiaTexto}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. CTA ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                {sp.ctaTitulo || DEFAULT.ctaTitulo}
              </h2>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  onClick={handleBuyClick}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
                >
                  {sp.ctaBotaoLabel || DEFAULT.ctaBotaoLabel}
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-muted px-10 py-4 text-base font-bold text-muted-foreground"
                >
                  {loadingCheckout ? "Carregando..." : "Em breve"}
                </button>
              )}
              <p className="mt-4 text-xs text-muted-foreground">🔒 Pagamento seguro · Acesso liberado na hora</p>
            </div>
          </div>
        </section>

        {/* ── 9. FAQ ── */}
        <section className="border-t border-border/40 pb-24 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-8 text-center text-xl font-bold tracking-tight">Perguntas rápidas</h2>
              <div className="space-y-4">
                {faq.map((f, idx) => (
                  <div key={idx} className="glass-card rounded-xl p-5">
                    <p className="font-semibold">{f.pergunta}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.resposta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
