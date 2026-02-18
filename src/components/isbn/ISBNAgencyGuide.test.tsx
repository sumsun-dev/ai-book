import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ISBNAgencyGuide from './ISBNAgencyGuide'

const messages = {
  isbn: {
    guide: {
      title: 'ISBN Application Guide',
      description: 'ISBN issuance process through Korea ISBN Agency',
      step1: { title: 'Register Publisher', description: 'Register at the National Library' },
      step2: { title: 'Apply for ISBN', description: 'Apply online' },
      step3: { title: 'Confirm Issuance', description: 'Confirm the issued ISBN' },
      agencyUrl: 'Korea ISBN Center',
      learnMore: 'Learn More',
    },
  },
}

describe('ISBNAgencyGuide', () => {
  it('should render all three steps', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ISBNAgencyGuide />
      </NextIntlClientProvider>
    )

    // Should have heading, 3 step items with number icons
    expect(container.querySelector('h3')).not.toBeNull()
    const stepIcons = container.querySelectorAll('.w-8.h-8')
    expect(stepIcons.length).toBe(3)
    // Each step should have a title (h4) and description (p)
    const stepTitles = container.querySelectorAll('h4')
    expect(stepTitles.length).toBe(3)
  })

  it('should render external link to ISBN agency', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ISBNAgencyGuide />
      </NextIntlClientProvider>
    )

    const link = container.querySelector('a[href="https://www.nl.go.kr/seoji/"]')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('target')).toBe('_blank')
  })
})
