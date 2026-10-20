import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PackageDateInput } from '../components/PackageDateInput'
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
