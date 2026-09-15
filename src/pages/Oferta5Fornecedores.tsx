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

interface Fornecedor {
  numero: number;
  diferencial: string;
  detalhe: string;
  imagem: string;
}

// Diferenciais descritos SEM nome/contato — isso é o próprio produto pago,
// não pode vazar na página de venda. As fotos ficam em /public/fornecedores/
// (fornecedor-1.jpg .. fornecedor-5.jpg) — enquanto não existirem, o ícone de
// fallback cobre o espaço sem quebrar o layout.
const FORNECEDORES: Fornecedor[] = [
  { numero: 1, diferencial: "Indiano, linha fabril", detalhe: "Alta escala pra quem revende em volume", imagem: "/fornecedores/fornecedor-1.jpg" },
  { numero: 2, diferencial: "Indiano, preço de entrada", detalhe: "Ótimo custo-benefício pra quem tá começando", imagem: "/fornecedores/fornecedor-2.jpg" },
  { numero: 3, diferencial: "Especialista em coloridos e loiros", detalhe: "Entrega rápida, ideal pra pedidos urgentes", imagem: "/fornecedores/fornecedor-3.jpg" },
  { numero: 4, diferencial: "Parceria internacional", detalhe: "Cabelo brasileiro, importação direta", imagem: "/fornecedores/fornecedor-4.jpg" },
  { numero: 5, diferencial: "Referência no mercado", detalhe: "Mais de 30 anos de experiência e confiança", imagem: "/fornecedores/fornecedor-5.jpg" },
];

const CRITERIOS = [
  "Fios inteiros, pontas cheias",
  "100% humano, sem mistura sintética",
  "Preço com margem boa de revenda",
  "Entrega fácil, sem enrolação",
];

const DORES = [
  { titulo: "Golpe de fornecedor", texto: "Paga adiantado e o fornecedor some, atrasa ou manda menos do que combinou." },
  { titulo: "Cabelo de baixa qualidade", texto: "Vem misturado, embola fácil e não é 100% humano de verdade." },
  { titulo: "Cliente perdido", texto: "A cliente reclama, devolve ou nunca mais compra de você por causa da qualidade." },
];

const FAQS = [
  { pergunta: "Funciona pra qualquer estado do Brasil?", resposta: "Sim — os 5 fornecedores atendem por WhatsApp/envio, independente de onde você está." },
  { pergunta: "Recebo os contatos na hora?", resposta: "Sim, o acesso é liberado automaticamente assim que o pagamento é confirmado." },
  { pergunta: "Preciso comprar uma quantidade mínima?", resposta: "Cada fornecedor tem sua própria condição — isso vem detalhado junto com o contato de cada um." },
];

function FornecedorImage({ imagem, numero }: { imagem: string; numero: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.fbq) window.fbq("track", "ViewContent");

    fetch(`${API_URL}/quiz/${QUIZ_SLUG}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCheckoutUrl(data?.checkoutUrl || null))
      .catch(() => setCheckoutUrl(null))
      .finally(() => setLoadingCheckout(false));
  }, []);

  function handleBuyClick() {
    if (window.fbq) window.fbq("track", "InitiateCheckout");
  }

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
                Você está qualificada
              </div>
              <h1 className="animate-fade-up-delay-1 mb-6 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl text-balance">
                Chega de arriscar com fornecedor.{" "}
                <span className="gradient-text">Receba os 5 validados</span> por quem já testou na prática
              </h1>
              <p className="animate-fade-up-delay-2 mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
                Fornecedor errado é prejuízo garantido. Fornecedor certo é risco zero — cabelo de verdade,
                margem boa e sem susto.
              </p>
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
                {DORES.map((dor) => (
                  <div key={dor.titulo} className="glass-card rounded-2xl p-6">
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
                  <Sparkles className="h-3 w-3" />O que você recebe
                </span>
              </div>
              <h2 className="mx-auto mb-4 max-w-2xl text-center text-2xl font-bold tracking-tight sm:text-3xl">
                5 fornecedores validados pessoalmente, prontos pra você chamar hoje
              </h2>
              <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
                Cada um já foi filtrado pelos 4 critérios abaixo — o mesmo padrão usado por quem já vende
                cabelo todo santo dia.
              </p>

              <div className="mb-12 flex flex-wrap justify-center gap-3">
                {CRITERIOS.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {c}
                  </span>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {FORNECEDORES.map((f) => (
                  <div key={f.numero} className="glass-card overflow-hidden rounded-2xl p-4">
                    <FornecedorImage imagem={f.imagem} numero={f.numero} />
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Fornecedor {f.numero}
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
              <p className="mt-3 text-lg leading-relaxed">
                Só o fornecedor principal da lista já foi avaliado publicamente em{" "}
                <span className="font-bold text-foreground">R$ 10.000</span> de valor percebido.
              </p>
              <div className="my-8 flex items-center justify-center gap-4 sm:gap-8">
                <div>
                  <p className="text-sm text-muted-foreground line-through">De R$ 997</p>
                  <p className="text-4xl font-bold sm:text-5xl">
                    <span className="gradient-text">R$ 47</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Pra quem fatura R$ 10 mil/mês ou mais, isso representa{" "}
                <span className="font-semibold text-foreground">menos de 0,5% do seu faturamento</span> — pra
                nunca mais depender de sorte na hora de escolher fornecedor.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. Prova social ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <div className="glass-card rounded-2xl p-8">
                <Quote className="mb-4 h-8 w-8 text-primary/60" />
                <p className="text-lg leading-relaxed">
                  "Só com essa lista eu economizei mais de R$ 20 mil comprando direto na fonte certa, sem
                  pagar por intermediário."
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  — Relato real de uma participante do Workshop Como Vender Cabelo Todo Santo Dia
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
                <h3 className="font-semibold">Contato direto, sem enrolação</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você recebe o nome e o WhatsApp de cada um dos 5 fornecedores. Se algum não responder ou não
                  bater com o combinado, você fala com a gente e a gente resolve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. CTA ── */}
        <section className="border-t border-border/40 pb-20 pt-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                Pare de arriscar com fornecedor. Comece hoje com quem já é validado.
              </h2>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  onClick={handleBuyClick}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
                >
                  Quero os 5 fornecedores agora
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
                {FAQS.map((f) => (
                  <div key={f.pergunta} className="glass-card rounded-xl p-5">
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
