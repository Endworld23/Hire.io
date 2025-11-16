import { Buffer } from 'node:buffer'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export type ResumeParseResult = {
  text: string
  skills: string[]
  yearsOfExperience?: number
  summary?: string
  techTags: string[]
}

export class ResumeParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'ResumeParseError'
    if (options?.cause) {
      // @ts-ignore Node 18 cause support
      this.cause = options.cause
    }
  }
}

const SKILL_DICTIONARY = [
  'react',
  'vue',
  'angular',
  'node',
  'typescript',
  'javascript',
  'python',
  'java',
  'c#',
  'aws',
  'gcp',
  'azure',
  'sql',
  'postgres',
  'graphql',
  'docker',
  'kubernetes',
  'figma',
  'sketch',
  'swift',
  'kotlin',
]

const TECH_TAG_RULES: Record<string, string[]> = {
  backend: ['node', 'java', 'c#', 'python', 'go', 'scala'],
  frontend: ['react', 'vue', 'angular', 'typescript', 'css'],
  mobile: ['swift', 'kotlin', 'android', 'ios'],
  data: ['sql', 'python', 'spark', 'hadoop'],
  design: ['figma', 'sketch', 'xd'],
}

export async function parseResume(
  buffer: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<ResumeParseResult> {
  const rawText = await extractText(buffer, mimeType, fileName)
  const text = cleanText(rawText)

  const skills = extractSkills(text)
  const yearsOfExperience = estimateYears(text)
  const summary = buildSummary(text)
  const techTags = deriveTechTags(text)

  return {
    text,
    skills,
    yearsOfExperience,
    summary,
    techTags,
  }
}

async function extractText(buffer: Buffer, mimeType: string, fileName?: string) {
  const extension = (fileName?.split('.').pop() || '').toLowerCase()
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    try {
      const data = await pdf(buffer)
      return data.text
    } catch (error) {
      throw new ResumeParseError('Unable to extract text from PDF', { cause: error })
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (error) {
      throw new ResumeParseError('Unable to extract text from DOCX', { cause: error })
    }
  }

  if (mimeType === 'text/plain' || extension === 'txt') {
    return buffer.toString('utf8')
  }

  if (mimeType === 'application/msword' || extension === 'doc') {
    // Best-effort fallback for legacy DOC files
    return buffer.toString('utf16le')
  }

  throw new ResumeParseError(`Unsupported resume format: ${mimeType || extension || 'unknown'}`)
}

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractSkills(text: string) {
  const normalized = text.toLowerCase()
  const detected = new Set<string>()

  for (const skill of SKILL_DICTIONARY) {
    if (normalized.includes(skill.toLowerCase())) {
      detected.add(capitalizeSkill(skill))
    }
  }

  return Array.from(detected)
}

function estimateYears(text: string) {
  const regex = /(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi
  const matches = Array.from(text.matchAll(regex))
  if (!matches.length) {
    return undefined
  }

  const years = matches
    .map(match => Number(match[1]))
    .filter(value => Number.isFinite(value))
    .sort((a, b) => b - a)[0]

  if (!years) {
    return undefined
  }

  return Math.min(Math.max(years, 1), 40)
}

function buildSummary(text: string) {
  if (!text) return undefined
  const firstParagraph = text.split('\n').slice(0, 6).join(' ')
  const summary = firstParagraph.trim().slice(0, 500)
  return summary || undefined
}

function deriveTechTags(text: string) {
  const normalized = text.toLowerCase()
  const tags: string[] = []

  for (const [tag, keywords] of Object.entries(TECH_TAG_RULES)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      tags.push(tag)
    }
  }

  return tags
}

function capitalizeSkill(skill: string) {
  if (skill.toLowerCase() === 'sql') return 'SQL'
  if (skill.toLowerCase() === 'c#') return 'C#'
  if (skill.toLowerCase() === 'aws') return 'AWS'
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}
