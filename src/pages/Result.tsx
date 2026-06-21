import { useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CheckCircle, TrendingUp, Zap, ArrowRight, Users, AlertTriangle, X } from 'lucide-react'
import type { ProfileAnalysis } from '@/services/profileAnalysis'
import { formatFollowers } from '@/services/profileAnalysis'

function ContactModal({ onClose, instagram }: { onClose: () => void; instagram: string }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', revenue: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }

  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    // Deve ter 11 dígitos e o 3º dígito (índice 2) deve ser 9
    return cleaned.length === 11 && cleaned[2] === '9'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validar número de telefone
    if (!isValidPhone(form.phone)) {
      setError('WhatsApp inválido. Use o formato (XX) 9XXXX-XXXX com o 9 obrigatório.')
      setLoading(false)
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const fbclid = localStorage.getItem('fbclid')
      const clickId = localStorage.getItem('click_id')
      const utmSource = localStorage.getItem('utm_source')
      const utmMedium = localStorage.getItem('utm_medium')
      const utmCampaign = localStorage.getItem('utm_campaign')
      const utmContent = localStorage.getItem('utm_content')
      const utmTerm = localStorage.getItem('utm_term')
      const getCookie = (name: string) => document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1] ?? ''
      const fbp = getCookie('_fbp')
      const fbc = getCookie('_fbc')
      const userAgent = navigator.userAgent
      const res = await fetch(`${apiUrl}/forms/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.replace(/\D/g, ''),
          email: form.email,
          instagram,
          revenue: form.revenue,
          ...(fbclid ? { fbclid } : {}),
          ...(clickId ? { clickId } : {}),
          ...(utmSource ? { utmSource } : {}),
          ...(utmMedium ? { utmMedium } : {}),
          ...(utmCampaign ? { utmCampaign } : {}),
          ...(utmContent ? { utmContent } : {}),
          ...(utmTerm ? { utmTerm } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
          userAgent,
        }),
      })
      if (!res.ok) throw new Error('Erro ao enviar')
      setSent(true)
      if (window.fbq) window.fbq('track', 'Lead')
      // Redireciona pro grupo do WhatsApp após 1 segundo
      setTimeout(() => {
        window.location.href = 'https://chat.whatsapp.com/BbggEw10KBbItcd4CEhlCc?mode=gi_t'
      }, 1000)
    } catch {
      setError('Não foi possível enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-background p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Parabéns!</h3>
            <p className="mt-2 text-base text-muted-foreground">Te vejo na aula para estruturarmos o seu funil de venda</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Quero aumentar minha receita</h3>
              <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados e entraremos em contato em até 1 min.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome completo</label>
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">WhatsApp</label>
                <input
                  required
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                  maxLength={15}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</label>
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div> */}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Média de faturamento mensal</label>
                <select
                  required
                  value={form.revenue}
                  onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>Selecione uma faixa</option>
                  <option value="ate-10k">Até R$ 10.000</option>
                  <option value="10k-30k">R$ 10.000 – R$ 30.000</option>
                  <option value="30k-100k">R$ 30.000 – R$ 100.000</option>
                  <option value="100k-300k">R$ 100.000 – R$ 300.000</option>
                  <option value="acima-300k">Acima de R$ 300.000</option>
                </select>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60"
              >
                {loading ? 'Entrando no grupo...' : 'Aumentar minha receita'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function Result() {
  const location = useLocation()
  const analysis: ProfileAnalysis | undefined = location.state?.analysis
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (window.fbq) window.fbq('track', 'ViewContent')
  }, [])

  if (!analysis) return <Navigate to="/" replace />

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {modalOpen && <ContactModal onClose={() => setModalOpen(false)} instagram={analysis.username} />}
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[100px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <main className="relative z-10 w-full overflow-x-hidden">

        {/* ── DOBRA 1 — Hero personalizado ── */}
        <section className="flex min-h-[80vh] items-center">
          <div className="container mx-auto px-4 pb-16 min-w-0 w-full">
            <div className="mx-auto max-w-3xl text-center">

              {/* Perfil pill */}
              {!analysis.isPrivate && analysis.profile_pic_url ? (
                <div className="mb-8 flex items-center justify-center gap-3 animate-fade-up">
                  <img
                    src={`/ig-image${new URL(analysis.profile_pic_url).pathname}${new URL(analysis.profile_pic_url).search}`}
                    alt={analysis.username}
                    className="h-12 w-12 rounded-full border-2 border-primary/40 object-cover"
                    onError={(e) => {
                      // Fallback se o proxy falhar
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {analysis.full_name || `@${analysis.username}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{analysis.username} · {formatFollowers(analysis.followers)} seguidores
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-8 animate-fade-up">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    @{analysis.username}
                  </span>
                </div>
              )}

              {/* Badge */}
              <div className="mb-6 animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {analysis.hero.badge}
                  {analysis.generatedWithAI && <span className="ml-1 text-[10px] opacity-70">(AI)</span>}
                </span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up-delay-1 mb-6 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-6xl break-words">
                {analysis.hero.headline
                  .split(/(\bmáquina\b|\bpiloto automático\b|\b24h\b|\bautomação\b|\baumatizar\b|\bautomatize\b|\bautomatizar\b)/gi)
                  .map((part, i) =>
                    /máquina|piloto automático|24h|automação|automatizar|automatize|automatizar/i.test(part)
                      ? <span key={i} className="gradient-text">{part}</span>
                      : part
                  )
                }
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-up-delay-2 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {analysis.hero.subheadline}
              </p>

              {/* Stats (apenas perfis públicos com dados) */}
              {!analysis.isPrivate && analysis.followers > 0 && (
                <div className="animate-fade-up-delay-2 mb-10 flex flex-wrap justify-center gap-4">
                  <div className="glass-card glow-primary rounded-2xl px-6 py-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{formatFollowers(analysis.followers)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">seguidores</p>
                  </div>
                  <div className="glass-card rounded-2xl px-6 py-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{analysis.posts.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">publicações</p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="animate-fade-up-delay-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
                >
                  Quero ver ao vivo!
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <p className="mt-4 text-xs text-muted-foreground">
                  🔒 Análise gratuita · Sem compromisso
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DOBRA 2 — Dor personalizada ── */}
        <section className="border-t border-border/40 pb-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">

              {/* Título da solução */}
              <div className="mb-16 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-foreground">
                  <Zap className="h-3 w-3" />
                  Você já identificou o problema. Agora vem a solução.
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Veja ao vivo como funil com IA pode dobrar  suas vendas
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                  Cada lead que não responde rápido vai pro concorrente — sem volta. Na aula ao vivo você vê como resolver isso.
                </p>
              </div>

              {/* Pain points + solução */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Problemas */}
                <div className="glass-card rounded-2xl p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15">
                      <TrendingUp className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">O que está acontecendo hoje</h3>
                  </div>
                  <ul className="space-y-4">
                    {analysis.pain.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[11px] font-bold text-destructive">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed text-white">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Serviço */}
                <div className="glass-card glow-primary rounded-2xl p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                      <CheckCircle className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">O que você vai descobrir na imersão ao vivo</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Por que seu funil atual tá deixando dinheiro na mesa — e como corrigir isso',
                      'Como conectar a IA direto com o gerenciador de anúncio',
                      'Como funil com IA pode aumentar sua conversão — demonstrado ao vivo',
                      'O que tá travando suas vendas hoje e o plano exato pra destravar',
                      'Como sair da armadilha da indicação e ter lead chegando todo dia',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <span className="text-sm leading-relaxed text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <button
                  onClick={() => setModalOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25"
                >
                  Quero ver ao vivo!
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="flex -space-x-2">
                    {['MA', 'JC', 'RS', 'PL'].map((initials) => (
                      <div
                        key={initials}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">+150 funis</span> construídos e gerando clientes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
