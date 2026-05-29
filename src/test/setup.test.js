describe('test infrastructure smoke test', () => {
  it('should run under jsdom environment', () => {
    expect(true).toBe(true)
  })

  it('should have document defined (jsdom)', () => {
    expect(typeof document).toBe('object')
  })
})
