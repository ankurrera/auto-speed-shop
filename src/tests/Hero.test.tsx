import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '../components/homepage/Hero'

describe('Hero Component', () => {
  it('renders with default props', () => {
    render(<Hero />)
    
    expect(screen.getByText('Premium Auto Parts')).toBeInTheDocument()
    expect(screen.getByText('for Every Drive')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shop Now' })).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    render(
      <Hero
        title="Custom Title"
        subtitle="Custom Subtitle"
        description="Custom description"
        ctaText="Custom CTA"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom CTA' })).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<Hero />)
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Premium auto part')
  })
})