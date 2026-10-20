import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PackageDateInput } from '../components/PackageDateInput'
it('opens an empty bounded stay calendar and selects a check-in date', () => {
  const onChange = vi.fn()
  render(
    <PackageDateInput
      label="Check-in date"
      value=""
      minDate="2027-04-08"
      maxDate="2027-06-05"
      onChange={onChange}
    />
  )
  fireEvent.mouseDown(screen.getByLabelText('Check-in date'))
  fireEvent.click(screen.getByLabelText('Check-in date'))
  expect(screen.getByRole('table')).toBeInTheDocument()
  fireEvent.click(document.querySelector('[title="2027-04-10"]')!)
  expect(onChange).toHaveBeenCalledWith('2027-04-10')
})
it('does not commit an end date before the configured start date, including typed dates', () => {
  const onChange = vi.fn()
  render(
    <PackageDateInput
      label="End date"
      value="2027-05-15"
      minDate="2027-05-10"
      onChange={onChange}
    />
  )
  const input = screen.getByLabelText('End date')
  fireEvent.change(input, { target: { value: '2027-05-09' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 })
  fireEvent.blur(input)
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(input, { target: { value: '2027-05-12' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 })
  expect(onChange).toHaveBeenCalledWith('2027-05-12')
})
