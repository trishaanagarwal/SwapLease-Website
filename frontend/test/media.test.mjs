// node test/media.test.mjs — checks the security-relevant pure logic.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { sign, publicIdOf } from '../api/media.js';

// Signature matches Cloudinary's documented example.
assert.equal(
  sign({ timestamp: 1315060510, public_id: 'sample_image', eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop' }, 'abcd'),
  crypto.createHash('sha1').update('eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image&timestamp=1315060510abcd').digest('hex'),
);

// public_id extraction drives the "own folder only" delete check.
assert.equal(publicIdOf('https://res.cloudinary.com/x/image/upload/v17/u/abc/pic.jpg'), 'u/abc/pic');
assert.equal(publicIdOf('https://res.cloudinary.com/x/image/upload/c_fill,w_200/v17/u/abc/pic.webp'), 'u/abc/pic');
assert.equal(publicIdOf('https://res.cloudinary.com/x/image/upload/v17/legacy.jpg'), 'legacy');
assert.equal(publicIdOf('https://evil.example/image/upload/v1/u/abc/p.jpg'), null);
assert.ok(!publicIdOf('https://res.cloudinary.com/x/image/upload/v1/u/abcd/p.jpg').startsWith('u/abc/'));

// OG fix: replacer functions keep $-patterns literal.
assert.equal('<t>x</t>'.replace(/<t>.*<\/t>/, () => '<t>$& $` $\'</t>'), '<t>$& $` $\'</t>');
console.log('ok');
