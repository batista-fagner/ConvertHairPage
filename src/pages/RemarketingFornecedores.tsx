import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ImageOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
const QUIZ_SLUG = "5fornecedores";

interface Fornecedor {
  numero: number;
  diferencial: string;
  detalhe: string;
  imagem?: string;
}

interface SalesPage {
  precoDe?: string;
  precoPor?: string;
  fornecedores?: Fornecedor[];
}

interface QuizData {
  checkoutUrl?: string;
  salesPage?: SalesPage;
  fbPixelId?: string;
}

// Checkout dedicado da Greenn pra essa página (produto/oferta próprio, com
// contador de escassez configurado lá) — não é o mesmo checkoutUrl da página
// de venda original, de propósito: permite separar no relatório da Greenn
// quem comprou pelo remarketing de quem comprou pelo funil frio.
const REMARKETING_CHECKOUT_URL = "https://payfast.greenn.com.br/redirect/320262";

const DEFAULT_PRECO_DE = "R$ 997";
const DEFAULT_PRECO_POR = "R$ 47";
const DEFAULT_FORNECEDORES: Fornecedor[] = [
  { numero: 1, diferencial: "Indiano, linha fabril", detalhe: "Alta escala pra quem revende em volume" },
  { numero: 2, diferencial: "Indiano, preço de entrada", detalhe: "Ótimo custo-benefício pra quem tá começando" },
  { numero: 3, diferencial: "Especialista em coloridos e loiros", detalhe: "Entrega rápida, ideal pra pedidos urgentes" },
  { numero: 4, diferencial: "Parceria internacional", detalhe: "Cabelo brasileiro, importação direta" },
  { numero: 5, diferencial: "Referência no mercado", detalhe: "Mais de 30 anos de experiência e confiança" },
];

const TRACKING_KEYS = ["fbclid", "utm_source", "utm_medium", "utm_campaign"] as const;

// Cola fbclid/UTM (capturados da própria URL dessa página, salvos no
// localStorage) na URL do checkout — mesma lógica pro fbclid (pixel nativo da
// Greenn monta o _fbc) e pro UTM (a Greenn precisa ter "Metas" cadastradas
// pra utm_source/utm_medium/utm_campaign pra devolver isso no saleMetas do
// webhook — só assim o backend consegue gravar a origem no Lead, já que a
// pessoa pode já ser lead antiga, ex: disparo de mensagem numa base/grupo).
function appendTracking(url: string | null): string | null {
  if (!url) return url;
  const params = new URLSearchParams();
  for (const key of TRACKING_KEYS) {
    let value: string | null = null;
    try {
      value = localStorage.getItem(key);
    } catch {
      continue;
    }
    if (value) params.set(key, value);
  }
  const query = params.toString();
  if (!query) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${query}`;
}

function FornecedorImage({ imagem, numero }: { imagem?: string; numero: number }) {
  const [failed, setFailed] = useState(false);
  if (!imagem || failed) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-black/30 text-[#D4AF37]/40">
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={imagem}
      alt={`Fornecedor ${numero}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-32 w-full rounded-xl object-cover"
    />
  );
}

// Página de remarketing pra quem respondeu o quiz "5 Fornecedores" (é MQL —
// já demonstrou dor real de golpe/fornecedor ruim), mas não comprou. Não
// reconstrói a dor do zero como a página de venda original — reabre a dor
// que a pessoa JÁ confirmou ter (71% das respostas do quiz relatam golpe ou
// cabelo ruim que custou cliente, ver análise de 2026-09-21) e fecha rápido,
// em só 2 seções + 1 objeção curta. Paleta dourada de propósito — remete às
// cores de cabelo (loiro/mega hair), contraste alto contra o fundo escuro.
export default function RemarketingFornecedores() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Captura fbclid/UTM do clique NESSE link específico (remarketing/disparo
    // em grupo) — sem isso, só sobrava o fbclid antigo (da visita original ao
    // quiz), o que atribuiria a venda ao clique errado. Mesmo padrão do
    // Quiz.tsx/Index.tsx, estendido pra também guardar UTM (não só fbclid).
    const urlParams = new URLSearchParams(window.location.search);
    for (const key of TRACKING_KEYS) {
      const value = urlParams.get(key);
      if (!value) continue;
      try {
        localStorage.setItem(key, value);
      } catch {
        // localStorage indisponível — appendTracking só não vai achar nada, sem quebrar nada.
      }
    }

    fetch(`${API_URL}/quiz/${QUIZ_SLUG}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: QuizData) => {
        setQuiz(data);
        if (data?.fbPixelId && window.fbq) {
          window.fbq("init", data.fbPixelId);
          window.fbq("track", "PageView");
          window.fbq("track", "ViewContent");
        }
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoadingCheckout(false));
  }, []);

  function handleBuyClick() {
    if (window.fbq) window.fbq("track", "InitiateCheckout");
  }

  const checkoutUrl = appendTracking(REMARKETING_CHECKOUT_URL);
  const precoDe = quiz?.salesPage?.precoDe || DEFAULT_PRECO_DE;
  const precoPor = quiz?.salesPage?.precoPor || DEFAULT_PRECO_POR;
  const fornecedores = quiz?.salesPage?.fornecedores?.length ? quiz.salesPage.fornecedores : DEFAULT_FORNECEDORES;

  const BuyButton = ({ className = "" }: { className?: string }) =>
    checkoutUrl ? (
      <a
        href={checkoutUrl}
        onClick={handleBuyClick}
        className={`group inline-flex animate-cta-pulse items-center gap-2 rounded-xl bg-gradient-to-r from-[#f4e5a1] via-[#d4af37] to-[#b8860b] px-10 py-4 text-base font-bold text-[#1a1206] transition-all duration-300 hover:brightness-110 ${className}`}
      >
        Quero os 5 fornecedores agora
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    ) : (
      <button
        disabled
        className={`inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-white/10 px-10 py-4 text-base font-bold text-white/40 ${className}`}
      >
        {loadingCheckout ? "Carregando..." : "Em breve"}
      </button>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0a05]">
      {/* Fundo ambiente em tom dourado, propositalmente sutil */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#d4af37]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#d4af37]/8 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full overflow-x-hidden">
        {/* ── 1. Hero — reabre a dor que ela já confirmou no quiz ── */}
        <section className="pb-14 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-1.5 text-xs font-medium text-[#f4e5a1]">
                <Clock className="h-3.5 w-3.5" />
                Você já deu o primeiro passo
              </div>
              <h1 className="mb-6 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl text-balance">
                O golpe de fornecedor te custou dinheiro. A lista que{" "}
                <span className="gradient-gold">aumenta seu faturamento</span> ainda tá disponível.
              </h1>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/70">
                Os 5 fornecedores validados que iam resolver isso ainda estão disponíveis — mas só até essa condição
                fechar.
              </p>
              <div className="mt-8 flex justify-center">
                <a
                  href="#preco"
                  className="group inline-flex animate-cta-pulse items-center gap-2 rounded-xl bg-gradient-to-r from-[#f4e5a1] via-[#d4af37] to-[#b8860b] px-8 py-3.5 text-base font-bold text-[#1a1206] transition-all duration-300 hover:brightness-110"
                >
                  Quero garantir agora
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Oferta + FOMO + preço ── */}
        <section id="oferta" className="border-t border-[#d4af37]/15 pb-16 pt-14 scroll-mt-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Só falta 1 passo para <span className="gradient-gold">aumentar o seu faturamento</span>: garantir a
                lista antes que feche
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
                Enquanto você decide, quem já garantiu está negociando direto com os 5 fornecedores validados — sem
                esperar, sem arriscar.
              </p>

              <div className="mb-10 grid gap-4 sm:grid-cols-2">
                {[
                  "Fios inteiros, pontas cheias, 100% humano",
                  "Preço com margem boa de revenda",
                  "Contato direto, sem intermediário",
                  "Risco zero do golpe que você já viveu (ou teme viver)",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#d4af37]/20 bg-white/[0.03] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" />
                    <p className="text-sm leading-relaxed text-white/85">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {fornecedores.slice(0, 5).map((f, idx) => (
                  <div key={idx} className="overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-white/[0.03] p-3">
                    <FornecedorImage imagem={f.imagem} numero={f.numero ?? idx + 1} />
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#d4af37]">
                      Fornecedor {f.numero ?? idx + 1}
                    </p>
                  </div>
                ))}
              </div>

              <div id="preco" className="glow-gold mx-auto max-w-md scroll-mt-6 rounded-3xl border border-[#d4af37]/30 bg-white/[0.03] p-8 text-center">
                <p className="text-sm font-medium uppercase tracking-wide text-white/60">Sua condição</p>
                <div className="my-4 flex items-center justify-center gap-4">
                  <span className="text-lg text-white/40 line-through">{precoDe}</span>
                  <span className="gradient-gold text-4xl font-bold sm:text-5xl">{precoPor}</span>
                </div>

                <div className="mb-6 space-y-2.5 text-left">
                  {[
                    "Nome e WhatsApp dos 5 fornecedores validados, liberado na hora",
                    "Cabelo 100% humano, fios inteiros, pontas cheias — nada de mistura",
                    "Preço com margem boa pra você vender e aumentar o faturamento",
                    "Risco zero do golpe que você já viveu (ou teme viver)",
                    "Contato direto com cada fornecedor, sem intermediário",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                      <p className="text-sm leading-snug text-white/85">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="mb-6 flex items-center justify-center gap-2 text-sm text-[#f4e5a1]">
                  <AlertTriangle className="h-4 w-4" />
                  Só enquanto essa condição estiver no ar
                </p>
                <BuyButton className="w-full justify-center" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Objeção final (curta) ── */}
        <section className="border-t border-[#d4af37]/15 pb-20 pt-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-xl text-center">
              <h3 className="mb-3 text-xl font-bold text-white">Ainda com dúvida?</h3>
              <p className="mb-8 text-white/70">
                Você recebe o nome e o WhatsApp de cada fornecedor na hora — sem enrolação, sem esperar.
              </p>
              <div className="flex justify-center">
                <BuyButton />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
