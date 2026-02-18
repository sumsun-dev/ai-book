import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import PlotStructureSelector from './PlotStructureSelector'

const messages = {
  plotStructures: {
    title: 'Plot Structure',
    description: 'Choose a plot structure',
    three_act: { name: 'Three-Act', description: 'Classic structure', genres: 'Fiction' },
    heros_journey: { name: "Hero's Journey", description: '12 stages', genres: 'Fiction' },
    save_the_cat: { name: 'Save the Cat', description: '15 beats', genres: 'Fiction' },
    kishotenketsu: { name: 'Kishōtenketsu', description: 'Four parts', genres: 'Fiction, Essay' },
    fichtean_curve: { name: 'Fichtean Curve', description: 'Rising crises', genres: 'Fiction' },
    none: { name: 'Free Structure', description: 'No framework', genres: 'All' },
  },
}

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('PlotStructureSelector', () => {
  it('should render for fiction bookType', () => {
    const { container } = renderWithIntl(
      <PlotStructureSelector bookType="fiction" value="none" onChange={vi.fn()} />
    )
    // 6 structures for fiction: three_act, heros_journey, save_the_cat, kishotenketsu, fichtean_curve, none
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(6)
  })

  it('should not render for technical bookType', () => {
    const { container } = renderWithIntl(
      <PlotStructureSelector bookType="technical" value="none" onChange={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should call onChange when structure is selected', () => {
    const onChange = vi.fn()
    const { container } = renderWithIntl(
      <PlotStructureSelector bookType="fiction" value="none" onChange={onChange} />
    )
    // Click the first button (three_act)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0])
    expect(onChange).toHaveBeenCalledWith('three_act')
  })

  it('should show applicable structures for children bookType', () => {
    const { container } = renderWithIntl(
      <PlotStructureSelector bookType="children" value="none" onChange={vi.fn()} />
    )
    // 3 structures for children: three_act, kishotenketsu, none
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(3)
  })
})
