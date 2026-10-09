import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicWebsiteUrl } from '../lib/ava/website-url.ts'
test('only public HTTPS domains are accepted', () => {
 assert.equal(publicWebsiteUrl('https://shop.customer.com/products#buy'), 'https://shop.customer.com/products')
 for (const value of ['http://shop.customer.com', 'https://localhost', 'https://127.0.0.1', 'https://169.254.169.254', 'https://[::1]', 'https://user:pass@shop.customer.com', 'https://shop.customer.com:8443', 'file:///etc/passwd', 'https://foo.internal', 'https://2130706433', null]) assert.throws(() => publicWebsiteUrl(value))
})
