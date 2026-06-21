import type { InstagramProfile } from './instagramApi'
import { generateCopyWithOpenAI, type GeneratedCopy } from './openaiService'

export type Niche = 'health' | 'ecommerce' | 'food' | 'services' | 'marketing' | 'education' | 'generic'
export type Size = 'micro' | 'small' | 'medium' | 'large'

export interface ProfileAnalysis {
  niche: Niche
  size: Size
  isPrivate: boolean
  username: string
  full_name: string
  profile_pic_url: string
  followers: number
  posts: number
  hero: {
    badge: string
    headline: string
    subheadline: string
  }
  pain: {
    title: string
    description: string
    points: string[]
  }
  cta: string
  generatedWithAI?: boolean
}

// --- Detecção de nicho via bio ---

const NICHE_KEYWORDS: Record<Niche, string[]> = {
  health: [
    'fisio', 'clínica', 'médico', 'médica', 'saúde', 'odonto', 'dentist',
    'nutriç', 'psicólog', 'terapeut', 'ortoped', 'pediatr', 'cardiolog',
    'esteticist', 'dermatolog', 'biomédic', 'enfermei', 'farmac', 'hospital',
  ],
  ecommerce: [
    'loja', 'shop', 'store', 'moda', 'roupas', 'produtos', 'atacado',
    'varejo', 'boutique', 'e-commerce', 'ecommerce', 'vendas online',
  ],
  food: [
    'restaurante', 'café', 'confeitari', 'doceria', 'salgados', 'pizza',
    'hambúrgu', 'gastronom', 'culinári', 'bistrô', 'padaria', 'açaí',
    'delivery', 'chef', 'buffet',
  ],
  services: [
    'advocaci', 'advogad', 'contabilidade', 'contador', 'seguros',
    'financeiro', 'finanças', 'imóveis', 'imobiliária', 'corretor',
    'arquitet', 'engenhei', 'construç', 'reform',
  ],
  marketing: [
    'marketing', 'agência', 'agencia', 'tráfego', 'trafego', 'ads',
    'social media', 'conteúdo', 'copywriter', 'branding', 'designer',
    'criativo', 'digital',
  ],
  education: [
    'coach', 'mentor', 'cursо', 'curso', 'professor', 'educaç',
    'treinamento', 'aula', 'capacitaç', 'palest', 'consultoria',
  ],
  generic: [],
}

function detectNiche(bio: string): Niche {
  const lower = bio.toLowerCase()
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS) as [Niche, string[]][]) {
    if (niche === 'generic') continue
    if (keywords.some(kw => lower.includes(kw))) return niche
  }
  return 'generic'
}

function detectSize(followers: number): Size {
  if (followers >= 100_000) return 'large'
  if (followers >= 10_000) return 'medium'
  if (followers >= 1_000) return 'small'
  return 'micro'
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// --- Copy por nicho + tamanho ---

type CopyMap = Record<Niche, Record<Size, { badge: string; headline: string; subheadline: string; painTitle: string; painDesc: string; painPoints: string[]; cta: string }>>

const COPY: CopyMap = {
  health: {
    micro: {
      badge: 'Para profissionais de saúde em crescimento',
      headline: 'Sua agenda pode estar cheia — sem você fazer nada manualmente',
      subheadline: 'Automatize o primeiro contato com pacientes do Instagram e transforme seguidores em consultas agendadas, no piloto automático.',
      painTitle: 'Quantos pacientes você perde por falta de resposta rápida?',
      painDesc: 'Pacientes em potencial mandam mensagem, você demora a responder — e eles já marcaram com outro profissional.',
      painPoints: [
        'DMs sem resposta viram pacientes do concorrente',
        'Você atende, estuda e ainda precisa gerenciar redes sociais',
        'Sem sistema, cada lead é tratado de forma diferente',
      ],
      cta: 'Quero encher minha agenda no piloto automático',
    },
    small: {
      badge: 'Para clínicas e consultórios em expansão',
      headline: 'Você já tem audiência. Agora é hora de converter seguidores em pacientes',
      subheadline: 'Com automação inteligente, cada mensagem recebida no Instagram vira uma oportunidade real de agendamento — 24h por dia.',
      painTitle: 'Sua clínica ainda depende de você para responder cada mensagem?',
      painDesc: 'Com uma audiência crescente, a demanda aumenta — mas o tempo não. É hora de deixar a tecnologia trabalhar por você.',
      painPoints: [
        'Volume de mensagens maior do que você consegue responder',
        'Sem follow-up automático, leads esfriam e somem',
        'Pacientes qualificados perdidos por falta de agilidade',
      ],
      cta: 'Automatizar meu atendimento agora',
    },
    medium: {
      badge: 'Clínica de alto volume — automação obrigatória',
      headline: 'Com essa audiência, cada DM sem resposta é um paciente que foi embora',
      subheadline: 'Você construiu uma base sólida. Agora deixe a automação converter essa audiência em agenda lotada — sem esforço manual.',
      painTitle: 'Você tem seguidores. Mas quantos viraram pacientes esse mês?',
      painDesc: 'Uma audiência expressiva sem automação é dinheiro parado. Cada mensagem não respondida rapidamente custa uma consulta.',
      painPoints: [
        'Taxa de conversão baixa apesar da audiência grande',
        'Equipe sobrecarregada com atendimento manual',
        'Sem métricas claras de quantos leads o Instagram gera',
      ],
      cta: 'Transformar minha audiência em pacientes',
    },
    large: {
      badge: 'Referência na área — escale seu impacto',
      headline: 'Você é referência. Sua operação precisa acompanhar esse nível',
      subheadline: 'Com uma audiência massiva, a automação não é opcional — é o que separa clínicas que escalam das que travam por falta de processo.',
      painTitle: 'Autoridade sem sistema é oportunidade perdida em escala',
      painDesc: 'Sua marca já convence. O problema é que sem automação, parte da audiência nunca recebe o acompanhamento que precisa para converter.',
      painPoints: [
        'Impossível responder manualmente com essa audiência',
        'Sem funil, grandes audiências convertem mal',
        'Concorrentes menores com automação convertem mais do que você',
      ],
      cta: 'Escalar minha operação com automação',
    },
  },

  ecommerce: {
    micro: {
      badge: 'Para lojas que querem vender mais pelo Instagram',
      headline: 'Sua loja pode vender enquanto você dorme — com automação no Instagram',
      subheadline: 'Pare de depender de postagem por postagem. Automatize o atendimento e converta seguidores em compradores no piloto automático.',
      painTitle: 'Você perde vendas fora do horário comercial?',
      painDesc: 'Clientes perguntam sobre produtos à meia-noite. Sem resposta automática, eles compram de outra loja até você acordar.',
      painPoints: [
        'Vendas perdidas fora do horário de atendimento',
        'Sem follow-up, clientes abandonam a compra',
        'Tempo demais gasto respondendo as mesmas perguntas',
      ],
      cta: 'Quero minha loja vendendo 24h',
    },
    small: {
      badge: 'Para e-commerces em aceleração',
      headline: 'Você tem produto bom e audiência crescendo. Falta só automação para escalar',
      subheadline: 'Transforme cada seguidor em um comprador em potencial com fluxos automáticos de atendimento e recuperação no Instagram.',
      painTitle: 'Quantas vendas você deixou escapar essa semana?',
      painDesc: 'Com uma audiência em crescimento, responder manualmente já não escala. Cada mensagem sem resposta é uma venda que foi para o concorrente.',
      painPoints: [
        'Crescimento travado por gargalo de atendimento',
        'Sem automação de recuperação de interesse',
        'Métricas de conversão abaixo do potencial',
      ],
      cta: 'Escalar minhas vendas com automação',
    },
    medium: {
      badge: 'E-commerce de médio porte — hora de escalar de verdade',
      headline: 'Com essa audiência, você deveria faturar 3x mais pelo Instagram',
      subheadline: 'A maioria dos e-commerces com sua audiência não usa 20% do potencial de conversão do Instagram. Vamos mudar isso.',
      painTitle: 'Audiência grande, conversão pequena — esse é o problema',
      painDesc: 'Seguidores que não compram são um ativo desperdiçado. Com automação inteligente, cada interação vira uma oportunidade de venda.',
      painPoints: [
        'ROI do Instagram aquém do esperado',
        'Sem funil estruturado de conversão',
        'Equipe gasta tempo em operação, não em crescimento',
      ],
      cta: 'Maximizar conversão da minha audiência',
    },
    large: {
      badge: 'Grande loja — automação em escala',
      headline: 'Sua marca é forte. Sua automação precisa ser também',
      subheadline: 'Em uma operação do seu tamanho, cada processo manual é um gargalo que custa dinheiro. Automação não é custo — é investimento com retorno imediato.',
      painTitle: 'Operação grande sem automação = dinheiro jogado fora',
      painDesc: 'Marcas grandes que ainda operam manualmente perdem para concorrentes menores e mais ágeis. Automação é o diferencial competitivo.',
      painPoints: [
        'Custos operacionais altos por falta de automação',
        'Experiência inconsistente para o cliente final',
        'Impossível escalar sem processos automatizados',
      ],
      cta: 'Automatizar minha operação agora',
    },
  },

  food: {
    micro: {
      badge: 'Para negócios de alimentação em crescimento',
      headline: 'Seu delivery pode lotar — sem você responder mensagem por mensagem',
      subheadline: 'Automatize pedidos, dúvidas e reservas pelo Instagram e foque no que você faz de melhor: cozinhar.',
      painTitle: 'Quantos pedidos você perde por demora no atendimento?',
      painDesc: 'Cliente com fome não espera. Se você demorar 5 minutos para responder, ele já pediu em outro lugar.',
      painPoints: [
        'Pedidos perdidos pela demora na resposta',
        'Você cozinha E atende — impossível fazer os dois bem',
        'Sem sistema de reservas automático',
      ],
      cta: 'Automatizar meu atendimento e lotar pedidos',
    },
    small: { badge: 'Para restaurantes e deliveries em expansão', headline: 'Seu negócio de alimentação pode crescer sem contratar mais atendentes', subheadline: 'Com automação no Instagram, você gerencia pedidos, reservas e dúvidas sem sobrecarregar sua equipe.', painTitle: 'Sua equipe está sobrecarregada com atendimento manual?', painDesc: 'Em horário de pico, cada mensagem sem resposta é um cliente que desiste. Automação resolve isso.', painPoints: ['Pico de mensagens nos horários de maior movimento', 'Equipe dividida entre cozinha e atendimento', 'Sem padronização no atendimento ao cliente'], cta: 'Resolver meu atendimento com automação' },
    medium: { badge: 'Negócio de alimentação consolidado', headline: 'Você tem fila. Hora de ter sistema', subheadline: 'Com sua audiência, cada mensagem não respondida é um cliente que vai para o concorrente. Automação inteligente resolve isso.', painTitle: 'Fila de fora, caos por dentro — é hora de organizar', painDesc: 'Negócios de alimentação com sua audiência que não usam automação perdem entre 20-40% das oportunidades de venda.', painPoints: ['Alto volume impossível de gerenciar manualmente', 'Experiência inconsistente prejudica a reputação', 'Sem métricas de conversão das redes sociais'], cta: 'Organizar e escalar meu negócio' },
    large: { badge: 'Referência em gastronomia — escale com processos', headline: 'Uma marca da sua expressão precisa de automação à altura', subheadline: 'Marcas de gastronomia que escalam com qualidade usam automação. É o que separa um negócio local de uma rede.', painTitle: 'Reputação construída — operação precisa acompanhar', painDesc: 'Com sua audiência, cada interação conta. Automação garante que nenhum cliente fique sem resposta — em qualquer horário.', painPoints: ['Escala exige processos, não só pessoas', 'Atendimento inconsistente em horários de pico', 'Potencial de franquia travado por falta de sistematização'], cta: 'Sistematizar meu negócio para escalar' },
  },

  services: {
    micro: { badge: 'Para prestadores de serviços em crescimento', headline: 'Seus próximos clientes estão no Instagram — mas você precisa de um sistema para captá-los', subheadline: 'Automatize a triagem e o primeiro contato com potenciais clientes. Foque só em quem realmente tem potencial.', painTitle: 'Quanto tempo você perde com leads que não fecham?', painDesc: 'Sem automação, você trata todo lead igual — e gasta energia com quem não vai fechar. Automação filtra e qualifica por você.', painPoints: ['Tempo gasto com leads não qualificados', 'Sem processo de follow-up estruturado', 'Dificuldade em gerar leads novos consistentemente'], cta: 'Qualificar e captar clientes no piloto automático' },
    small: { badge: 'Para empresas de serviços em expansão', headline: 'Escalar serviços sem escalar equipe — isso é possível com automação', subheadline: 'Com automação inteligente, você atende mais clientes com a mesma equipe e ainda melhora a experiência de cada um.', painTitle: 'Seu crescimento está travado por gargalo operacional?', painDesc: 'Empresas de serviços que não automatizam o atendimento inicial perdem para concorrentes mais ágeis, mesmo sendo tecnicamente melhores.', painPoints: ['Crescimento travado por capacidade de atendimento', 'Leads perdidos por falta de resposta rápida', 'Equipe sobrecarregada com tarefas repetitivas'], cta: 'Escalar minha empresa de serviços' },
    medium: { badge: 'Empresa de serviços consolidada', headline: 'Com essa audiência, você deveria fechar 3x mais contratos pelo Instagram', subheadline: 'Automação transforma sua presença no Instagram em uma máquina de geração e qualificação de leads — 24h por dia.', painTitle: 'Audiência cresceu. Pipeline de clientes acompanhou?', painDesc: 'Empresas de serviços do seu tamanho que usam automação reduzem o custo de aquisição em até 60% e fecham contratos mais rápido.', painPoints: ['CAC alto por processo de prospecção manual', 'Sem funil estruturado de conversão', 'Dependência excessiva de indicações'], cta: 'Estruturar meu funil de clientes' },
    large: { badge: 'Empresa de referência no setor', headline: 'Autoridade no mercado + automação = liderança imbatível', subheadline: 'Empresas da sua expressão que combinam autoridade com automação dominam o mercado. É a combinação mais poderosa que existe.', painTitle: 'Liderança de mercado exige sistemas líderes', painDesc: 'Com sua reputação, cada lead perdido por falta de processo é um contrato que vai para o segundo lugar. Automação garante que isso não aconteça.', painPoints: ['Escala exige processos robustos de captação', 'Experiência inconsistente em pontos de contato digitais', 'Concorrentes menores e mais ágeis capturando seu mercado'], cta: 'Dominar meu mercado com automação' },
  },

  marketing: {
    micro: { badge: 'Para agências e profissionais de marketing', headline: 'Você vende marketing — mas sua própria captação ainda é manual?', subheadline: 'Automatize sua prospecção no Instagram e mostre na prática o que você entrega para os clientes.', painTitle: 'Sapateiro sem sapato — você usa automação para seus clientes, mas não para você?', painDesc: 'Agências e profissionais de marketing que automatizam sua própria prospecção têm um argumento irrefutável de venda.', painPoints: ['Tempo gasto prospectando manualmente', 'Sem demonstração prática do seu serviço', 'Pipeline de clientes instável'], cta: 'Automatizar minha própria prospecção' },
    small: { badge: 'Para agências em crescimento', headline: 'Sua agência pode crescer sem depender de indicações', subheadline: 'Com automação inteligente no Instagram, você cria uma máquina previsível de geração de clientes — e ainda usa como case para vender.', painTitle: 'Crescimento da sua agência ainda é imprevisível?', painDesc: 'Agências que dependem de indicações para crescer vivem em montanha-russa. Automação cria previsibilidade.', painPoints: ['Receita mensal imprevisível', 'Sem processo replicável de captação', 'Tempo gasto em prospecção ao invés de entrega'], cta: 'Criar previsibilidade na minha agência' },
    medium: { badge: 'Agência consolidada — hora de escalar', headline: 'Você já provou que entrega resultado. Hora de escalar a captação', subheadline: 'Com sua audiência e credibilidade, automação de captação transforma sua agência em uma máquina de crescimento.', painTitle: 'Capacidade de entrega cresceu. Captação acompanhou?', painDesc: 'Agências do seu tamanho que não sistematizam captação ficam presas em um teto de crescimento. Automação quebra esse teto.', painPoints: ['Equipe cresceu mas captação continua manual', 'CAC alto por falta de funil estruturado', 'Dificuldade em entrar em novos nichos'], cta: 'Escalar captação da minha agência' },
    large: { badge: 'Agência de referência no mercado', headline: 'Agências que lideram o mercado usam automação como diferencial competitivo', subheadline: 'Combine sua autoridade com processos automatizados e crie uma vantagem competitiva que concorrentes não conseguem copiar.', painTitle: 'Liderança exige inovação constante', painDesc: 'O mercado está se automatizando. Agências que liderarem a adoção de automação hoje definirão os padrões do setor amanhã.', painPoints: ['Mercado se automatizando mais rápido que a operação', 'Clientes exigindo resultados mais rápidos e previsíveis', 'Margem pressionada por processos manuais ineficientes'], cta: 'Liderar a automação no meu mercado' },
  },

  education: {
    micro: { badge: 'Para educadores e coaches em crescimento', headline: 'Seu conhecimento pode impactar muito mais pessoas — no piloto automático', subheadline: 'Automatize o primeiro contato com potenciais alunos e clientes de mentoria. Foque em ensinar, não em prospectar.', painTitle: 'Você ainda prospecta alunos um por um?', painDesc: 'Educadores e coaches que não automatizam a captação passam mais tempo prospectando do que transformando vidas.', painPoints: ['Tempo gasto com triagem manual de interessados', 'Sem processo de nutrição de leads', 'Dificuldade em lançar com consistência'], cta: 'Automatizar minha captação de alunos' },
    small: { badge: 'Para criadores de conteúdo educacional', headline: 'Você tem audiência engajada. Hora de converter em alunos e clientes', subheadline: 'Com automação, cada seguidor engajado recebe a jornada certa para se tornar um aluno ou cliente da sua mentoria.', painTitle: 'Audiência engajada mas conversão baixa?', painDesc: 'Criadores de conteúdo com seu tamanho de audiência que não usam automação convertem em média 3x menos do que poderiam.', painPoints: ['Engajamento alto mas vendas não acompanham', 'Sem funil de conversão estruturado', 'Lançamentos inconsistentes e estressantes'], cta: 'Converter minha audiência em clientes' },
    medium: { badge: 'Autoridade educacional consolidada', headline: 'Com essa audiência, você pode ter uma máquina de matrícula rodando 24h', subheadline: 'Combine sua autoridade com automação inteligente e transforme seu Instagram em uma fonte constante de alunos e mentorados.', painTitle: 'Autoridade construída — falta sistematizar a conversão', painDesc: 'Profissionais de educação e coaching da sua expressão que usam automação faturam de forma consistente, sem depender de lançamentos.', painPoints: ['Faturamento oscilante por depender de lançamentos', 'Alto esforço de vendas para manter crescimento', 'Sem receita recorrente previsível'], cta: 'Criar receita consistente com automação' },
    large: { badge: 'Referência educacional — impacto em escala', headline: 'Você mudou milhares de vidas. Automação vai multiplicar esse impacto', subheadline: 'Educadores e coaches de referência que combinam autoridade com automação criam movimentos, não apenas negócios.', painTitle: 'Impacto real exige alcance real', painDesc: 'Com sua audiência e credibilidade, a única barreira para multiplicar seu impacto é ter processos que escalam sem você.', painPoints: ['Crescimento limitado pela sua energia pessoal', 'Sem sistema para nutrir toda a audiência', 'Potencial de escala global travado por operação manual'], cta: 'Multiplicar meu impacto com automação' },
  },

  generic: {
    micro: { badge: 'Para empreendedores em crescimento', headline: 'Seu negócio pode crescer no piloto automático — pelo Instagram', subheadline: 'Automatize o atendimento e a captação de clientes enquanto você foca no que realmente importa para crescer.', painTitle: 'Você está fazendo tudo manualmente ainda?', painDesc: 'Empreendedores que ainda operam manualmente perdem para concorrentes mais ágeis — mesmo tendo um produto ou serviço melhor.', painPoints: ['Tempo consumido por tarefas repetitivas de atendimento', 'Leads perdidos por falta de resposta rápida', 'Crescimento dependente demais de você'], cta: 'Automatizar meu negócio agora' },
    small: { badge: 'Para negócios em expansão', headline: 'Você tem tração. Agora é hora de colocar no piloto automático', subheadline: 'Automação inteligente transforma seu Instagram em uma fonte constante de clientes — sem você precisar estar online 24h.', painTitle: 'Seu crescimento está travado por gargalo operacional?', painDesc: 'Negócios com sua audiência que não usam automação deixam de converter entre 30-50% dos leads que chegam pelo Instagram.', painPoints: ['Crescimento travado por falta de processos', 'Leads perdidos por follow-up inconsistente', 'Você ainda é o gargalo do próprio negócio'], cta: 'Colocar meu negócio no piloto automático' },
    medium: { badge: 'Negócio consolidado — hora de escalar', headline: 'Com essa audiência, você deveria estar faturando muito mais pelo Instagram', subheadline: 'Combine sua presença estabelecida com automação inteligente e desbloqueie um novo nível de faturamento.', painTitle: 'Audiência grande, conversão abaixo do potencial?', painDesc: 'Negócios do seu tamanho que implementam automação aumentam a taxa de conversão do Instagram em até 4x nos primeiros 3 meses.', painPoints: ['ROI do Instagram aquém do investimento em conteúdo', 'Sem funil estruturado de conversão', 'Dependência de plataformas externas para captar clientes'], cta: 'Desbloquear o potencial do meu Instagram' },
    large: { badge: 'Marca estabelecida — automação como diferencial', headline: 'Você construiu uma audiência expressiva. Automação é o próximo passo obrigatório', subheadline: 'Marcas da sua expressão que usam automação criam vantagens competitivas que concorrentes levam anos para replicar.', painTitle: 'Presença forte, processo ainda manual?', painDesc: 'Com sua audiência, cada interação não automatizada é um custo operacional e uma oportunidade perdida ao mesmo tempo.', painPoints: ['Escala impossível com atendimento manual', 'Experiência inconsistente compromete a marca', 'Concorrentes menores e mais ágeis ganhando terreno'], cta: 'Automatizar na escala que minha marca merece' },
  },
}

// --- Fallback para perfis privados ---

export const FALLBACK_ANALYSIS: Omit<ProfileAnalysis, 'username' | 'full_name' | 'profile_pic_url' | 'followers' | 'posts'> = {
  niche: 'generic',
  size: 'micro',
  isPrivate: true,
  hero: {
    badge: 'Para quem quer gerar leads qualificados com previsibilidade',
    headline: 'Você capta leads. Mas seu funil está qualificando ou desperdiçando?',
    subheadline: 'Sem um funil estruturado com IA, você depende de sorte — e perde venda que já era sua.',
  },
  pain: {
    title: 'Seu funil converte ou só coleta contato?',
    description: 'Fagner implementa funil de vendas com IA na ponta do seu negócio — qualificando, nutrindo e convertendo lead em cliente sem depender de time manual.',
    points: [
      'Lead chega, ninguém responde rápido — ele vai pro concorrente',
      'Follow-up não acontece — lead esfria e some',
      'Time gasta tempo com lead frio — em vez de fechar quem tá pronto',
    ],
  },
  cta: 'Quero implementar meu funil com IA →',
}

// --- Função principal ---

export async function analyzeProfile(profile: InstagramProfile | null, username: string): Promise<ProfileAnalysis> {
  if (!profile || profile.is_private) {
    return {
      ...FALLBACK_ANALYSIS,
      username: username.replace('@', '').trim(),
      full_name: '',
      profile_pic_url: '',
      followers: 0,
      posts: 0,
      isPrivate: true,
    }
  }

  // Tenta gerar com OpenAI primeiro
  const aiCopy = await generateCopyWithOpenAI(profile)
  if (aiCopy) {
    return {
      niche: detectNiche(profile.biography),
      size: detectSize(profile.followers),
      isPrivate: false,
      username: profile.username,
      full_name: profile.full_name,
      profile_pic_url: profile.profile_pic_url_hd || profile.profile_pic_url,
      followers: profile.followers,
      posts: profile.posts,
      hero: {
        badge: aiCopy.badge,
        headline: aiCopy.headline,
        subheadline: aiCopy.subheadline,
      },
      pain: {
        title: aiCopy.painTitle,
        description: aiCopy.painDescription,
        points: aiCopy.painPoints,
      },
      cta: aiCopy.cta,
      generatedWithAI: true,
    }
  }

  // Fallback: usa as 28 combinações
  const niche = detectNiche(profile.biography)
  const size = detectSize(profile.followers)
  const copy = COPY[niche][size]

  return {
    niche,
    size,
    isPrivate: false,
    username: profile.username,
    full_name: profile.full_name,
    profile_pic_url: profile.profile_pic_url_hd || profile.profile_pic_url,
    followers: profile.followers,
    posts: profile.posts,
    hero: {
      badge: copy.badge,
      headline: copy.headline,
      subheadline: copy.subheadline,
    },
    pain: {
      title: copy.painTitle,
      description: copy.painDesc,
      points: copy.painPoints,
    },
    cta: copy.cta,
    generatedWithAI: false,
  }
}

export { formatFollowers }
