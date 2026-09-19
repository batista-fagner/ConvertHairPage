import { useEffect, useState } from "react";
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Quote,
  ImageOff,
  Wallet,
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

function formatBRL(n: number): string {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface Fornecedor {
  numero: number;
  diferencial: string;
  detalhe: string;
  imagem?: string;
  valor?: string;
}

interface Dor {
  titulo: string;
  texto: string;
}

interface Faq {
  pergunta: string;
  resposta: string;
}

interface JornadaPasso {
  titulo: string;
  texto?: string;
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
  valorRodapeTitulo?: string;
  depoimentoTexto?: string;
  depoimentoAutor?: string;
  garantiaTitulo?: string;
  garantiaTexto?: string;
  jornada?: JornadaPasso[];
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
  valorRodapeTitulo: "Cabe fácil no seu orçamento",
  valorRodape:
    "Pra quem fatura R$ 10 mil/mês ou mais, isso representa menos de 0,5% do seu faturamento — pra nunca mais depender de sorte na hora de escolher fornecedor.",
  depoimentoTexto: "Só com essa lista eu economizei mais de R$ 20 mil comprando direto na fonte certa, sem pagar por intermediário.",
  depoimentoAutor: "Relato real de uma participante do Workshop Como Vender Cabelo Todo Santo Dia",
  garantiaTitulo: "Contato direto, sem enrolação",
  garantiaTexto:
    "Você recebe o nome e o WhatsApp de cada um dos 5 fornecedores. Se algum não responder ou não bater com o combinado, você fala com a gente e a gente resolve.",
  jornada: [
    { titulo: "Você garante sua vaga", texto: "Confirma o pagamento e o acesso libera na hora." },
    { titulo: "Recebe os 5 contatos", texto: "Nome e WhatsApp de cada fornecedor chegam direto pra você." },
    { titulo: "Fala direto com eles", texto: "Sem intermediário, você negocia preço e condição na hora." },
    { titulo: "Compra com fornecedor validado", texto: "Cabelo de verdade, sem risco de golpe." },
    { titulo: "Vende com mais confiança e mais lucro" },
  ],
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

    fetch(`${API_URL}/quiz/${QUIZ_SLUG}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCheckoutUrl(data?.checkoutUrl || null);
        setSalesPage(data?.salesPage || null);
        // Pixel dedicado do quiz (ver Quiz.entity.fbPixelId) — o SDK do fbevents.js
        // já é carregado global no index.html, mas nenhuma página até hoje
        // chamava fbq('init', ...), então os fbq('track', ...) abaixo nunca
        // disparavam de verdade. Sem fbPixelId configurado no quiz, mantém
        // desligado (não inicializa com pixel nenhum).
        if (data?.fbPixelId && window.fbq) {
          window.fbq("init", data.fbPixelId);
          window.fbq("track", "PageView");
          window.fbq("track", "ViewContent");
        }
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
  const jornada = pick(sp.jornada, DEFAULT.jornada);

  // Escada de valor — só aparece se pelo menos 1 fornecedor tiver "valor"
  // preenchido no builder; sem isso, cai pro bloco simples de/por de sempre
  // (não quebra quiz nenhum que ainda não usa esse campo novo).
  const fornecedoresComValor = fornecedores
    .map((f) => ({ ...f, valorNum: parsePrice(f.valor) }))
    .filter((f): f is Fornecedor & { valorNum: number } => f.valorNum !== null);
  const somaPercebida = fornecedoresComValor.reduce((sum, f) => sum + f.valorNum, 0);
  const hasValueStack = fornecedoresComValor.length > 0;

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
      {/* Fita de urgência — mesmo padrão do ticker da Index.tsx */}
      <div className="relative z-50 w-full overflow-hidden bg-yellow-400 py-2">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-8 text-sm font-bold tracking-wide text-gray-900">
              🔥 ATENÇÃO: acesso aos 5 fornecedores validados disponível por tempo limitado 🔥
            </span>
          ))}
        </div>
      </div>

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
              <p className="animate-fade-up-delay-2 mx-auto max-w-xl text-lg leading-relaxed text-foreground">
                {sp.headlineSubtitle || DEFAULT.headlineSubtitle}
              </p>

              <a
                href="#oferta"
                className="group mt-8 inline-flex animate-fade-up-delay-2 items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
              >
                {sp.ctaBotaoLabel || DEFAULT.ctaBotaoLabel}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              {/* Callback da resposta da última pergunta ("o que isso
                  mudaria pra você") desativado em 2026-09-16 — citar a opção
                  marcada ao pé da letra (ex: "Tudo isso junto") soou robótico
                  e não persuasivo. Ideia pra retomar depois: gerar a frase
                  via IA a partir da resposta, em vez de citação literal. O
                  dado (personalization.mudaria) continua sendo salvo pelo
                  Quiz.tsx, só não é mais exibido aqui. */}
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
                    <p className="text-sm leading-relaxed text-foreground">{dor.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3/4. Oferta + bullets dos fornecedores ── */}
        <section id="oferta" className="border-t border-border/40 pb-20 pt-16 scroll-mt-6">
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
              <p className="mx-auto mb-12 max-w-xl text-center text-foreground">
                {sp.ofertaSubtitle || DEFAULT.ofertaSubtitle}
              </p>

              <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {criterios.map((c, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-lg font-bold leading-snug">{c}</p>
                  </div>
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
                      <p className="mt-1 text-sm text-foreground">{f.detalhe}</p>
                    </div>
                  </div>
                ))}
                <div className="glass-card glow-primary flex flex-col items-center justify-center rounded-2xl p-6 text-center">
                  <Lock className="mb-3 h-6 w-6 text-accent" />
                  <p className="text-lg font-bold">Ainda bloqueado</p>
                  <p className="mt-1.5 text-sm text-foreground">
                    O nome e o contato de cada fornecedor só aparecem depois da confirmação. Cada dia que passa é
                    mais um dia arriscando comprar de quem não é confiável.
                  </p>
                </div>
              </div>

              <div className="mt-12 text-center">
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
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Ancoragem de valor ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="glass-card glow-primary mx-auto max-w-2xl rounded-3xl p-8 text-center sm:p-12">
              <p className="text-sm font-medium uppercase tracking-wide text-foreground">
                Valor já revelado ao vivo
              </p>
              <p className="mt-3 text-lg leading-relaxed">{sp.valorAncoragemTexto || DEFAULT.valorAncoragemTexto}</p>

              {hasValueStack ? (
                <div className="my-8 mx-auto max-w-sm text-left">
                  {fornecedoresComValor.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-border/40 py-2.5 text-sm"
                    >
                      <span className="text-foreground">Fornecedor {f.numero ?? idx + 1}</span>
                      <span className="text-foreground line-through">{f.valor}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 text-base font-semibold">
                    <span>Valor total</span>
                    <span className="line-through">{formatBRL(somaPercebida)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
                    <span className="text-sm font-medium">Seu investimento hoje</span>
                    <span className="text-2xl font-bold">
                      <span className="gradient-text">{sp.precoPor || DEFAULT.precoPor}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="my-8 flex items-center justify-center gap-4 sm:gap-8">
                  <div>
                    <p className="text-sm text-foreground line-through">
                      De {sp.precoDe || DEFAULT.precoDe}
                    </p>
                    <p className="text-4xl font-bold sm:text-5xl">
                      <span className="gradient-text">{sp.precoPor || DEFAULT.precoPor}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-2">
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
              </div>
            </div>

            {/* Card separado, com mais destaque que um texto de rodapé —
                reforça sozinho o argumento de "cabe no seu bolso". */}
            <div className="mx-auto mt-6 max-w-2xl">
              <div className="glass-card rounded-2xl p-8">
                <Wallet className="mb-4 h-8 w-8 text-accent" />
                <p className="text-xl font-bold leading-snug">
                  {sp.valorRodapeTitulo || DEFAULT.valorRodapeTitulo}
                </p>
                <p className="mt-3 text-base leading-relaxed text-foreground">{valorRodape}</p>
              </div>
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
                <p className="mt-4 text-sm text-foreground">
                  — {sp.depoimentoAutor || DEFAULT.depoimentoAutor}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Jornada pós-compra ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              O que acontece depois que você garante sua vaga
            </h2>
            <div className="mx-auto max-w-md">
              {jornada.map((passo, idx) => {
                const isLast = idx === jornada.length - 1;
                return (
                  <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                    {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />}
                    <div
                      className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isLast ? "bg-accent text-accent-foreground" : "border border-primary/30 bg-primary/15 text-primary"
                      }`}
                    >
                      {isLast ? <Trophy className="h-5 w-5" /> : idx + 1}
                    </div>
                    <div className={isLast ? "glass-card glow-primary flex-1 rounded-2xl p-5" : "flex-1 pt-1.5"}>
                      <h3 className={isLast ? "text-lg font-bold" : "font-semibold"}>{passo.titulo}</h3>
                      {passo.texto && <p className="mt-1 text-sm text-foreground">{passo.texto}</p>}
                    </div>
                  </div>
                );
              })}
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
              <p className="mt-4 text-xs text-foreground">🔒 Pagamento seguro · Acesso liberado na hora</p>
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
                    <p className="mt-1.5 text-sm text-foreground">{f.resposta}</p>
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
