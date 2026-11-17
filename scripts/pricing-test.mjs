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
const { PDFDocument, rgb } = await import('pdf-lib');
const doc = await PDFDocument.create();
const p1 = doc.addPage([600, 400]);
p1.drawText('Black and White Text on Page 1');
const p2 = doc.addPage([600, 400]);
const { createCanvas } = await import('@napi-rs/canvas');
const bitmap = createCanvas(16, 16);
const context = bitmap.getContext('2d');
context.fillStyle = '#ff0000';
context.fillRect(0, 0, 16, 16);
const img = await doc.embedPng(bitmap.toBuffer('image/png'));
p2.drawImage(img, { x: 50, y: 50, width: 100, height: 100 });

const p3 = doc.addPage([600, 400]);
context.fillStyle = '#777777';
context.fillRect(0, 0, 16, 16);
const grey = await doc.embedPng(bitmap.toBuffer('image/png'));
p3.drawRectangle({ x: 50, y: 50, width: 100, height: 100, color: rgb(1, 0, 0) });
p3.drawImage(grey, { x: 50, y: 50, width: 100, height: 100 });
const multiPdf = Buffer.from(await doc.save());

async function runColourCheck(pageRange, expectedColour, expectedBw) {
  const create = await fetch(`${base}/api/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ fileName: 'mixed.pdf', fileSize: multiPdf.length, mimeType: 'application/pdf' }],
      preferences: { copies: 1, colorMode: 'AUTO', sides: 'SINGLE', pageRange },
    }),
  });
  assert.equal(create.status, 201);
  const { session, token } = await create.json();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  try {
    const upload = await fetch(`${base}/api/sessions/upload?sessionId=${session.id}&fileId=${session.files[0].fileId}`, {
      method: 'POST', headers: { Authorization: headers.Authorization }, body: multiPdf,
    });
    assert.equal(upload.status, 200, await upload.clone().text());
    const confirm = await fetch(`${base}/api/sessions/confirm`, {
      method: 'POST', headers, body: JSON.stringify({ sessionId: session.id }),
    });
    assert.equal(confirm.status, 200, await confirm.clone().text());
    const { session: verified } = await confirm.json();
    assert.equal(verified.files[0].pageCount, 3);
    assert.deepEqual(verified.files[0].colorPages, [2]);
    assert.deepEqual(verified.files[0].bwPages, [1, 3]);
    assert.equal(verified.costEstimate.colorPagesCount, expectedColour);
    assert.equal(verified.costEstimate.bwPagesCount, expectedBw);
  } finally {
    await fetch(`${base}/api/sessions/delete`, {
      method: 'POST', headers, body: JSON.stringify({ sessionId: session.id }),
    });
  }
}
await runColourCheck('ALL', 1, 2);
await runColourCheck('1,3', 0, 2);
console.log('✔ Test 5 passed: Visible colour, grayscale scans, covered artwork, and page-range pricing.');

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
