import test from 'node:test';
import assert from 'node:assert/strict';
import { projectSchema } from '../../lib/project-validation';

test('le contact accepte les formats français et belges, sans accepter du texte ni un numéro tronqué', () => {
  const phone = projectSchema.shape.phone;
  for (const value of ['06 12 34 56 78', '+33 6 12 34 56 78', '+32 471 12 34 56', '0471 12 34 56', '02 123 45 67']) {
    assert.equal(phone.safeParse(value).success, true, value);
  }
  for (const value of ['', '0612', '+33 6 12 34 56', '06 12 34 56 78 abc', '+32 471 12 34 5678']) {
    assert.equal(phone.safeParse(value).success, false, value);
  }
});
