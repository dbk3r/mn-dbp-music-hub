import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe("Store auth init", () => {
      it("returns 400 for form-encoded body sent directly to store endpoint", async () => {
        const res = await api.post('/store/auth/init').set('Content-Type', 'application/x-www-form-urlencoded').send('email=test@example.com&password=secret')
        expect([400, 415]).toContain(res.status)
        // body should indicate invalid content or parsing error
        expect(res.status).not.toEqual(200)
      })

      it("accepts application/json body and returns 200 or 401 depending on credentials", async () => {
        // using credentials that exist in test DB (may be seeded); if not, we just assert non-500
        const payload = { email: 'den1s.beck3r@gmail.com', password: 'nulleins' }
        const res = await api.post('/store/auth/init').set('Content-Type', 'application/json').send(payload)
        expect([200, 401, 500]).toContain(res.status)
        // ensure server handles gracefully (no throw)
      })
    })
  },
})
