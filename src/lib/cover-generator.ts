import type { BookProject } from '@/types/book'
import { getTemplateById, type CoverTemplate } from './cover-templates'

export interface GenerateCoverOptions {
  project: BookProject
  templateId?: string
  customPrompt?: string
  useAI?: boolean
}

export interface CoverGenerationResult {
  imageUrl: string
  prompt?: string
  template?: string
}

// Generate a prompt for DALL-E based on book details
export function generateCoverPrompt(project: BookProject, template?: CoverTemplate): string {
  const typeDescriptions: Record<string, string> = {
    fiction: 'a captivating fiction novel',
    nonfiction: 'an informative non-fiction book',
    selfhelp: 'an inspiring self-help book',
    technical: 'a professional technical book',
    essay: 'a thoughtful essay collection',
    children: "a colorful children's book",
    poetry: 'an elegant poetry collection',
  }

  const styleDescriptions: Record<string, string> = {
    classic: 'elegant, traditional, with ornate details',
    modern: 'clean, minimalist, contemporary design',
    minimal: 'extremely simple, lots of white space',
    vibrant: 'colorful, energetic, bold',
    nature: 'organic, natural elements, earthy tones',
    dark: 'mysterious, dramatic lighting, dark atmosphere',
  }

  const bookTypeDesc = typeDescriptions[project.type] || 'a book'
  const styleDesc = template ? styleDescriptions[template.id] || '' : ''

  const prompt = `
Professional book cover design for ${bookTypeDesc} titled "${project.title}".
${project.description ? `Theme: ${project.description.slice(0, 100)}` : ''}
${styleDesc ? `Style: ${styleDesc}` : ''}
High quality, professional publishing quality, no text on image.
  `.trim()

  return prompt
}

// Generate cover using template (no AI)
export function generateTemplateCover(
  project: BookProject,
  templateId: string
): CoverGenerationResult {
  getTemplateById(templateId)

  // For template-based covers, we return a placeholder that will be rendered client-side
  return {
    imageUrl: `/api/cover/template?id=${templateId}&title=${encodeURIComponent(project.title)}&type=${project.type}`,
    template: templateId,
  }
}

// API call to generate AI cover
export async function generateAICover(
  project: BookProject,
  customPrompt?: string
): Promise<CoverGenerationResult> {
  const response = await fetch('/api/cover/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: project.id,
      title: project.title,
      type: project.type,
      description: project.description,
      customPrompt,
    }),
  })

  if (!response.ok) {
    throw new Error('AI 표지 생성에 실패했습니다.')
  }

  const data = await response.json()
  return {
    imageUrl: data.imageUrl,
    prompt: data.prompt,
  }
}
