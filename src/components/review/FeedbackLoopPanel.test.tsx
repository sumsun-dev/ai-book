import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import FeedbackLoopPanel from './FeedbackLoopPanel'

const messages = {
  feedbackLoop: {
    title: 'Auto Improvement',
    description: 'Automatically improve chapter quality',
    start: 'Start Auto Improvement',
    maxIterations: 'Max Iterations',
    progress: 'Iteration {current}/{total}',
    iteration: 'Iteration {n}',
    pass: 'PASS',
    revise: 'REVISE',
    statusPassed: 'Quality check passed',
    statusMaxReached: 'Max iterations reached',
    reload: 'Reload',
    error: 'An error occurred',
    scores: {
      grammar: 'Grammar',
      clarity: 'Clarity',
      coherence: 'Coherence',
      engagement: 'Engagement',
      targetFit: 'Target Fit',
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

describe('FeedbackLoopPanel', () => {
  it('should not render when overallScore >= 7', () => {
    const { container } = renderWithIntl(
      <FeedbackLoopPanel
        projectId="proj-1"
        chapterNumber={1}
        overallScore={8}
        onComplete={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should not render when overallScore is null', () => {
    const { container } = renderWithIntl(
      <FeedbackLoopPanel
        projectId="proj-1"
        chapterNumber={1}
        overallScore={null}
        onComplete={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render when overallScore < 7', () => {
    const { container } = renderWithIntl(
      <FeedbackLoopPanel
        projectId="proj-1"
        chapterNumber={1}
        overallScore={5}
        onComplete={vi.fn()}
      />
    )
    // Should render a panel with a button and select
    expect(container.querySelector('button')).not.toBeNull()
    expect(container.querySelector('select')).not.toBeNull()
  })

  it('should show max iterations selector', () => {
    const { container } = renderWithIntl(
      <FeedbackLoopPanel
        projectId="proj-1"
        chapterNumber={1}
        overallScore={4}
        onComplete={vi.fn()}
      />
    )
    const select = container.querySelector('select')
    expect(select).not.toBeNull()
    expect(select?.querySelectorAll('option').length).toBe(3)
  })
})
