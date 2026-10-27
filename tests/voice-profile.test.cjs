'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { read, update, forget, profilePath } = require('../skills/moodle-playwright/scripts/voice-profile.cjs');

test('style persists per student, corrections merge and forgetting does not affect peers', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-voice-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  assert.equal(read('aluno-a', home), null);
  update('aluno-a', { tone: 'direto', confidence: 'low' }, home);
  update('aluno-b', { tone: 'reflexivo', confidence: 'high' }, home);
  update('aluno-a', { length: 'curto', confidence: 'high' }, home);
  assert.equal(read('aluno-a', home).preferences.tone, 'direto');
  assert.equal(read('aluno-a', home).preferences.length, 'curto');
  assert.equal(read('aluno-a', home).preferences.confidence, 'high');
  assert.equal(read('aluno-b', home).preferences.tone, 'reflexivo');
  forget('aluno-a', home);
  assert.equal(read('aluno-a', home), null);
  assert.ok(read('aluno-b', home));
});

test('rejects path traversal and raw transcripts without overwriting valid memory', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-voice-invalid-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  assert.throws(() => profilePath('../other', home), /alias/);
  assert.throws(() => profilePath('nome@dominio.example', home), /alias/);
  update('principal', { language: 'pt-BR' }, home);
  const before = fs.readFileSync(profilePath('principal', home), 'utf8');
  assert.throws(() => update('principal', { prompts: ['transcrição'] }, home), /não permitido/);
  assert.throws(() => update('principal', { confidence: 'guess' }, home), /confidence/);
  assert.equal(fs.readFileSync(profilePath('principal', home), 'utf8'), before);
});
