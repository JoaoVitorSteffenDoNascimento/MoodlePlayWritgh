'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, makeBlock, mergeConfig } = require('../scripts/install.cjs');

test('preserves other configuration, installs skill, backs up and is idempotent', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-install-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const codexHome = path.join(home, 'custom-codex');
  fs.mkdirSync(codexHome);
  const existing = 'model = "example"\n\n[mcp_servers.other]\ncommand = "example"\n';
  fs.writeFileSync(path.join(codexHome, 'config.toml'), existing);
  const first = install({ home, codexHome });
  assert.equal(first.backups.length, 1);
  assert.equal(fs.readFileSync(first.backups[0], 'utf8'), existing);
  assert.ok(fs.readFileSync(first.config, 'utf8').startsWith(existing));
  assert.ok(fs.readFileSync(first.skillTarget, 'utf8').includes('name: moodle-playwright'));
  const second = install({ home, codexHome });
  assert.equal(second.changed, false);
  assert.deepEqual(second.backups, []);
  const third = install({ home, codexHome, windows: true, headless: true });
  const updated = fs.readFileSync(third.config, 'utf8');
  assert.ok(updated.includes('npx.cmd'));
  assert.ok(updated.includes('--headless'));
  assert.equal(updated.split('[mcp_servers.moodle_playwright]').length - 1, 1);
  assert.ok(updated.startsWith(existing));
});

test('manual conflicts and damaged managed blocks do not modify user files', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-conflict-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const codexHome = path.join(home, '.codex');
  fs.mkdirSync(codexHome);
  const config = path.join(codexHome, 'config.toml');
  const existing = '[mcp_servers."moodle_playwright"]\ncommand = "custom"\n';
  fs.writeFileSync(config, existing);
  assert.throws(() => install({ home, codexHome }), /referência manual/);
  assert.equal(fs.readFileSync(config, 'utf8'), existing);
  assert.equal(fs.existsSync(path.join(home, '.agents')), false);
  assert.throws(() => mergeConfig('# BEGIN MoodlePlayWritgh managed configuration\n', makeBlock()), /incompleto/);
});

test('backs up an edited skill before replacing its entrypoint', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-skill-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const codexHome = path.join(home, '.codex');
  const first = install({ home, codexHome });
  fs.writeFileSync(first.skillTarget, 'Minha versão local');
  const second = install({ home, codexHome });
  assert.equal(second.backups.length, 1);
  assert.equal(fs.readFileSync(second.backups[0], 'utf8'), 'Minha versão local');
});
