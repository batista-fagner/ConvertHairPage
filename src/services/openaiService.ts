import type { InstagramProfile } from './instagramApi'
import { detectBusinessType, getBusinessTypeLabel, BUSINESS_TYPE_COPY } from './businessTypeDetection'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface GeneratedCopy {
  badge: string
  headline: string
  subheadline: string
  painTitle: string
  painDescription: string
  painPoints: string[]
  cta: string
}

export async function generateCopyWithOpenAI(profile: InstagramProfile): Promise<GeneratedCopy | null> {
  if (!OPENAI_API_KEY) {
    console.warn('VITE_OPENAI_API_KEY not configured, using fallback')
    return null
  }

  const businessType = detectBusinessType(profile.biography)
  const businessTypeLabel = getBusinessTypeLabel(businessType)
  const businessTypeCopy = BUSINESS_TYPE_COPY[businessType]

  const prompt = `
Você é um especialista em copywriting de alta conversão.

Sua tarefa é gerar a hero section de uma página de captura personalizada para este lead específico.

DADOS DO LEAD:
- Nome: ${profile.full_name}
- Handle: @${profile.username}
- Bio: "${profile.biography}"
- Seguidores: ${profile.followers.toLocaleString()}
- Publicações: ${profile.posts}
- Tipo de Negócio: ${businessTypeLabel}

SOBRE O SERVIÇO:
Fagner implementa funil de vendas com IA na ponta do negócio do cliente — resolvendo o gargalo entre lead e venda.
O funil responde automaticamente, qualifica e nutre o lead sem depender de time manual.

SUA TAREFA:
Gerar os elementos da hero section com base no negócio específico deste lead:

HEADLINE — SITUAÇÃO/REALIDADE
├─ Baseada no negócio/contexto da bio
├─ Faz o lead se reconhecer imediatamente
├─ Curta (máximo 2 linhas)
├─ Tom: direto, sem enrolação
└─ Exemplo: "Você lança. Gera lead. Mas quantos desses leads viram alunos?"

SUBHEADLINE — DOR IMPLÍCITA
├─ O que ele está perdendo sem saber
├─ Não é alarmista, é real
├─ Conecta com o negócio específico dele
├─ Curta (máximo 2 linhas)
└─ Exemplo: "Enquanto isso, lead esfria. E você perde receita que já era sua."

PAIN TITLE — TÍTULO DA SEÇÃO DE DOR
├─ Uma pergunta ou afirmação que nomeia o problema principal
├─ Curto, direto
└─ Exemplo: "Onde você mais perde clientes hoje?"

PAIN DESCRIPTION — SOLUÇÃO
├─ Como Fagner resolve especificamente para este negócio
├─ Baseada no contexto da bio
├─ Não é genérica ("a gente implementa funil")
├─ É específica para o nicho dele
├─ Curta (máximo 2 linhas)
└─ Exemplo: "A gente coloca IA no seu processo de captação pra nenhum lead esfriar de novo."

PAIN POINTS — 3 GARGALOS ESPECÍFICOS
├─ 3 problemas reais do funil deste tipo de negócio
├─ Cada um em 1 linha
└─ Baseados no nicho/bio, não genéricos

BADGE — IDENTIFICAÇÃO DO PERFIL
└─ Curto: "Para [tipo específico] que [faz o quê]"

REGRAS CRÍTICAS:
❌ Nunca use porcentagem aleatória ("30% mais clientes")
❌ Nunca assuma canal específico ("visitante do Instagram")
❌ Nunca seja genérico ("melhore suas vendas")
❌ Nunca prometa número sem base real
❌ Nunca use mais de 3 linhas por elemento
✅ Sempre baseie na bio real
✅ Sempre fale do negócio específico dele
✅ Sempre crie identificação imediata
✅ Sempre termine com sensação de urgência real (não falsa)

REFERÊNCIA DE COPY (use como direção, mas personalize):
- Badge: "${businessTypeCopy.rapportBadge}"
- Headline: "${businessTypeCopy.rapportHeadline}"
- Pain points base: ${JSON.stringify(businessTypeCopy.painPoints)}

RETORNE EXATAMENTE neste formato JSON (SEM MARKDOWN):
{
  "badge": "Para [tipo específico] que [faz o quê]",
  "headline": "situação/realidade que faz o lead se reconhecer",
  "subheadline": "dor implícita — o que ele está perdendo",
  "painTitle": "título curto que nomeia o problema principal",
  "painDescription": "como Fagner resolve especificamente para este negócio",
  "painPoints": ["gargalo específico 1", "gargalo específico 2", "gargalo específico 3"],
  "cta": "Quero estruturar meu funil com IA →"
}

Responda APENAS com o JSON, sem explicações, sem markdown.
`

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 800,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.statusText)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error('No content from OpenAI')
      return null
    }

    const parsed = JSON.parse(content)
    return {
      badge: parsed.badge || '',
      headline: parsed.headline || '',
      subheadline: parsed.subheadline || '',
      painTitle: parsed.painTitle || '',
      painDescription: parsed.painDescription || '',
      painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
      cta: parsed.cta || '',
    }
  } catch (error) {
    console.error('Error generating copy with OpenAI:', error)
    return null
  }
}
