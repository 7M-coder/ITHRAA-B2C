import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'
import { afterEach } from 'vitest'
import userEventLib from '@testing-library/user-event'

afterEach(() => {
  cleanup()
})

interface CustomRenderOptions {
  route?: string
  routerProps?: MemoryRouterProps
}

function customRender(
  ui: React.ReactElement,
  { route = '/', routerProps = {}, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        {children}
      </MemoryRouter>
    ),
    ...options
  })
}

// Export selectively instead of `export *`
// Export just what you need from @testing-library/react
export { screen }
export { userEventLib as userEvent } // Can be renamed to 'userEvent' for consistency
export { render } from '@testing-library/react'
export { customRender as renderWithRouter }
