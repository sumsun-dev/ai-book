import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ConsistencyReport from './ConsistencyReport'

const messages = {
  review: {
    consistency: {
      title: 'Consistency Check',
      description: 'Detect consistency issues',
      check: 'Run Check',
      checking: 'Checking...',
      noIssues: 'No consistency issues found.',
      issueCount: '{count} issues found',
      summary: 'Summary',
      chapters: 'Chapter {a} ↔ {b}',
      severity: { error: 'Error', warning: 'Warning', info: 'Info' },
      types: {
        character_name: 'Character Name',
        character_trait: 'Character Trait',
        timeline: 'Timeline',
        setting: 'Setting',
        plot: 'Plot',
        style: 'Style',
      },
      suggestion: 'Suggestion',
    },
  },
}

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('ConsistencyReport', () => {
  it('should render title and check button', () => {
    const { container } = renderWithIntl(<ConsistencyReport projectId="proj-1" />)
    // Should have a button and heading
    expect(container.querySelector('button')).not.toBeNull()
    expect(container.querySelector('h2')).not.toBeNull()
  })

  it('should not show results initially', () => {
    const { container } = renderWithIntl(<ConsistencyReport projectId="proj-1" />)
    // No summary or issue cards should be visible initially
    const summarySection = container.querySelector('[class*="bg-neutral-50"]')
    expect(summarySection).toBeNull()
  })
})
