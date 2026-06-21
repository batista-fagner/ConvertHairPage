export type BusinessType = 'launch' | 'immersion' | 'infoproduct' | 'generic'

interface BusinessTypePattern {
  type: BusinessType
  keywords: string[]
  label: string
  description: string
}

const BUSINESS_PATTERNS: BusinessTypePattern[] = [
  {
    type: 'launch',
    keywords: [
      'lançamento', 'lancamento', 'vsl', 'webinar', 'live', 'challenge',
      'masterclass', 'desafio', 'bootcamp', 'workshop', 'sequência',
      'sequencia', 'email', 'funil', 'lista', 'inscrição', 'inscricao',
      'aplicar', 'vagas limitadas', 'urgência', 'urgencia',
    ],
    label: 'Lançamento e Sequências',
    description: 'Você estrutura vendas via lançamento, VSL, webinar ou desafios',
  },
  {
    type: 'immersion',
    keywords: [
      'imersão', 'imersao', 'presencial', 'presenciais', 'método',
      'metodo', 'intensivo', 'intensiva', 'aula', 'aulas', 'turma',
      'turmas', 'grupo', 'grupos', 'participar', 'aluno', 'alunos',
      'inscrito', 'inscritos', 'certificado', 'certificacao', 'diploma',
    ],
    label: 'Imersões e Cursos',
    description: 'Você vende através de imersões, cursos ou programas estruturados',
  },
  {
    type: 'infoproduct',
    keywords: [
      'infoproduto', 'info produto', 'produto digital', 'ebook', 'e-book',
      'guia', 'template', 'planilha', 'checklist', 'sistema', 'método',
      'metodo', 'fórmula', 'formula', 'mini curso', 'minicurso',
      'venda', 'vendas', 'vender', 'cliente', 'clientes', 'lucro',
    ],
    label: 'Infoprodutos e Produtos Digitais',
    description: 'Você vende produtos digitais ou informação de alto valor',
  },
]

export function detectBusinessType(bio: string): BusinessType {
  const lower = bio.toLowerCase()

  // Contar matches por tipo
  const typeScores = BUSINESS_PATTERNS.map((pattern) => ({
    type: pattern.type,
    score: pattern.keywords.filter((kw) => lower.includes(kw)).length,
  }))

  // Ordenar por score
  typeScores.sort((a, b) => b.score - a.score)

  // Se tem matches, retorna o melhor; senão generic
  if (typeScores[0].score > 0) {
    return typeScores[0].type
  }

  return 'generic'
}

export function getBusinessTypeLabel(type: BusinessType): string {
  return BUSINESS_PATTERNS.find((p) => p.type === type)?.label || 'Negócio Digital'
}

// Copy específica por tipo de negócio
export const BUSINESS_TYPE_COPY: Record<
  BusinessType,
  {
    rapportBadge: string
    rapportHeadline: string
    aiOptimization: string
    painPoints: string[]
  }
> = {
  launch: {
    rapportBadge: 'Para empreendedores que vendem via lançamento',
    rapportHeadline: 'Seu lançamento pode rodar no automático — enquanto você foca no conteúdo',
    aiOptimization:
      'Com IA, você estrutura a sequência perfeita, copia que vende mais e timing certo — tudo personalizado pro seu público.',
    painPoints: [
      'Estruturar a sequência de emails sem deixar nada ao acaso',
      'Escrever copy que vende quando você não consegue chegar em todo mundo manualmente',
      'Não perder leads frios durante o lançamento por falta de follow-up',
    ],
  },

  immersion: {
    rapportBadge: 'Para coaches e mentores que vendem imersões',
    rapportHeadline: 'Seus inscritos podem virar clientes — sem você responder cada mensagem',
    aiOptimization:
      'IA que qualifica inscritos, estrutura o funil de conversão e automatiza o follow-up — você foca só em entregar.',
    painPoints: [
      'Converter inscritos em participantes pagos dentro do prazo',
      'Qualificar quem está realmente pronto vs quem só quer fuçar',
      'Manter o momentum entre o último email e o início da imersão',
    ],
  },

  infoproduct: {
    rapportBadge: 'Para criadores que vendem infoprodutos',
    rapportHeadline: 'Sua taxa de conversão pode triplicar — com IA escrevendo pra você',
    aiOptimization:
      'IA que monta a sequência de vendas, cria copy irresistível e otimiza cada etapa — resultado: mais conversões, menos esforço.',
    painPoints: [
      'Criar copy que venda mais sem ficar escrevendo 8h por dia',
      'Estruturar a jornada do cliente pra maximizar conversão',
      'Saber se seu preço, posicionamento e mensagem tão certos',
    ],
  },

  generic: {
    rapportBadge: 'Para empreendedores que querem crescer com inteligência',
    rapportHeadline: 'Sua operação pode rodar mais rápido — com IA fazendo o trabalho manual',
    aiOptimization:
      'IA que otimiza qualquer etapa do seu funil — desde atração até retenção — liberando seu tempo pra crescimento real.',
    painPoints: [
      'Não saber qual etapa do funil é seu maior gargalo',
      'Perder leads por falta de sistema e automação',
      'Gastar tempo demais em tarefas que máquinas poderiam fazer',
    ],
  },
}
