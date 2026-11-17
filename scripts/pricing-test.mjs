import assert from 'node:assert/strict';

const base = process.env.ZDROP_TEST_URL || 'http://localhost:3000';

console.log('Testing Pricing & Micro-Payment Endpoints...');

const pdf = Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>>>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF');

// 1. Create a session with 2 copies and B&W
const createRes = await fetch(`${base}/api/sessions/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      { fileName: 'notes.pdf', fileSize: pdf.length, mimeType: 'application/pdf' },
    ],
    preferences: {
      copies: 2,
      colorMode: 'BW',
      sides: 'SINGLE',
      pageRange: 'ALL',
    },
  }),
});

assert.equal(createRes.status, 201);
const { session, token } = await createRes.json();
assert.ok(session.costEstimate, 'Session should have a cost estimate');
assert.equal(session.costEstimate.copies, 2);
assert.equal(session.costEstimate.ratePerPage, 2);
assert.equal(session.costEstimate.currencySymbol, '₹');
assert.equal(session.paymentStatus, 'UNPAID');
console.log('✔ Test 1 passed: Session created with initial cost estimate (UNPAID).');

// 2. Upload file & confirm session
const upRes = await fetch(`${base}/api/sessions/upload?sessionId=${session.id}&fileId=${session.files[0].fileId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: pdf,
});
assert.equal(upRes.status, 200);

const confRes = await fetch(`${base}/api/sessions/confirm`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: session.id }),
});
assert.equal(confRes.status, 200);
const confData = await confRes.json();
assert.equal(confData.session.status, 'ACTIVE');
console.log('✔ Test 2 passed: Session confirmed and ACTIVE awaiting shopkeeper OTP acceptance.');

// 3. Shopkeeper enters 6-digit OTP on Kiosk -> /api/sessions/resolve
const resolveRes = await fetch(`${base}/api/sessions/resolve?code=${session.accessCode}`);
assert.equal(resolveRes.status, 200);
const resolveData = await resolveRes.json();
assert.equal(resolveData.session.status, 'ACCESSED');
assert.ok(resolveData.session.costEstimate, 'Resolved session must have cost estimate');
assert.ok(resolveData.session.costEstimate.totalAmount > 0, 'Cost estimate amount must be > 0');
assert.equal(resolveData.session.costEstimate.upiId, '', 'An anonymous job has no shop UPI recipient');
assert.equal(resolveData.session.shopName, undefined);
console.log('✔ Test 3 passed: Anonymous OTP resolution preserves pricing without assigning an unrelated shop.');

// 4. Test Payment status update via API (Customer pays via UPI QR)
const payRes = await fetch(`${base}/api/sessions/payment`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: session.id,
    paymentStatus: 'PAID_ONLINE',
    paymentMethod: 'UPI',
  }),
});

assert.equal(payRes.status, 200);
const payData = await payRes.json();
assert.equal(payData.session.paymentStatus, 'PAID_ONLINE');
assert.equal(payData.session.paymentMethod, 'UPI');
console.log('✔ Test 4 passed: Payment updated to PAID_ONLINE (UPI).');

// 5. Test Auto Color Checker with Mixed PDF (1 B&W page + 1 Image page)
const { PDFDocument } = await import('pdf-lib');
const doc = await PDFDocument.create();
const p1 = doc.addPage([600, 400]);
p1.drawText('Black and White Text on Page 1');
const p2 = doc.addPage([600, 400]);
const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const img = await doc.embedPng(pngBytes);
p2.drawImage(img, { x: 50, y: 50, width: 100, height: 100 });
const multiPdf = Buffer.from(await doc.save());

const autoCreateRes = await fetch(`${base}/api/sessions/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: [
      { fileName: 'mixed.pdf', fileSize: multiPdf.length, mimeType: 'application/pdf' },
    ],
    preferences: {
      copies: 1,
      colorMode: 'AUTO',
      sides: 'SINGLE',
      pageRange: 'ALL',
    },
  }),
});
assert.equal(autoCreateRes.status, 201);
const { session: autoSession, token: autoToken } = await autoCreateRes.json();

await fetch(`${base}/api/sessions/upload?sessionId=${autoSession.id}&fileId=${autoSession.files[0].fileId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${autoToken}` },
  body: multiPdf,
});

const autoConfRes = await fetch(`${base}/api/sessions/confirm`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${autoToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: autoSession.id }),
});
assert.equal(autoConfRes.status, 200);
const autoConfData = await autoConfRes.json();

assert.equal(autoConfData.session.files[0].pageCount, 2);
assert.deepEqual(autoConfData.session.files[0].colorPages, [2], 'Page 2 should be detected as color image');
assert.deepEqual(autoConfData.session.files[0].bwPages, [1], 'Page 1 should be detected as B&W');
assert.equal(autoConfData.session.costEstimate.colorPagesCount, 1);
assert.equal(autoConfData.session.costEstimate.bwPagesCount, 1);
assert.ok(autoConfData.session.costEstimate.savingsVsFullColor > 0, 'Auto Color Saver should save vs full color');
console.log(`✔ Test 5 passed: Auto Color Checker correctly marked Page 2 as Color and Page 1 as B&W (Saved ₹${autoConfData.session.costEstimate.savingsVsFullColor}).`);

// Cleanup auto session
await fetch(`${base}/api/sessions/delete`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${autoToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: autoSession.id }),
});

// 6. Cleanup initial session
const delRes = await fetch(`${base}/api/sessions/delete`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sessionId: session.id }),
});
assert.equal(delRes.status, 200);
console.log('✔ Test 6 passed: Sessions cleaned up & files permanently purged.');

console.log('🎉 ALL PRICING & MICRO-PAYMENT ENDPOINT TESTS PASSED SUCCESSFULLY!');
