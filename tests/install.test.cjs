'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { install, makeBlock, mergeConfig, installClients } = require('../scripts/install.cjs');

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
  assert.ok(fs.existsSync(path.join(home, '.agents/skills/netbeans-swing-ant/references/formulario-nativo.md')));
  assert.ok(fs.existsSync(path.join(home, '.agents/skills/moodle-playwright/references/escrita-simples.md')));
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

test('Claude preserves account state, unrelated servers and permission rules', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-claude-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  fs.mkdirSync(path.join(home, '.claude'));
  fs.writeFileSync(path.join(home, '.claude.json'), JSON.stringify({ projects: { example: { trusted: true } }, mcpServers: { other: { command: 'other' } } }));
  fs.writeFileSync(path.join(home, '.claude/settings.json'), JSON.stringify({ model: 'example', permissions: { deny: ['Read(example)'], ask: ['Bash'], allow: ['Read'] } }));
  const first = installClients({ home, clients: ['claude'] });
  const state = JSON.parse(fs.readFileSync(path.join(home, '.claude.json')));
  const settings = JSON.parse(fs.readFileSync(path.join(home, '.claude/settings.json')));
  assert.equal(state.projects.example.trusted, true);
  assert.equal(state.mcpServers.other.command, 'other');
  assert.ok(state.mcpServers.moodle_playwright.args.includes('--allow-unrestricted-file-access'));
  assert.deepEqual(settings.permissions.deny, ['Read(example)']);
  assert.deepEqual(settings.permissions.ask, ['Bash']);
  assert.deepEqual(settings.permissions.allow, ['Read', 'mcp__moodle_playwright__*']);
  assert.ok(fs.existsSync(path.join(home, '.claude/skills/netbeans-swing-ant/agents/openai.yaml')));
  assert.equal(fs.existsSync(path.join(home, '.codex')), false);
  assert.equal(installClients({ home, clients: ['claude'] }).changed, false);
  assert.ok(first.backups.length >= 2);
  installClients({ home, clients: ['claude'], headless: true, windows: true });
  const updated = JSON.parse(fs.readFileSync(path.join(home, '.claude.json'))).mcpServers.moodle_playwright;
  assert.equal(updated.command, 'npx.cmd');
  assert.ok(updated.args.includes('--headless'));
});

test('both clients preflight conflicts before changing either client', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-both-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const stateFile = path.join(home, '.claude.json');
  const original = JSON.stringify({ mcpServers: { moodle_playwright: { command: 'custom' } } });
  fs.writeFileSync(stateFile, original);
  assert.throws(() => installClients({ home, codexHome: path.join(home, '.codex'), clients: ['codex', 'claude'] }), /Servidor manual/);
  assert.equal(fs.existsSync(path.join(home, '.codex')), false);
  assert.equal(fs.existsSync(path.join(home, '.agents')), false);
  assert.equal(fs.readFileSync(stateFile, 'utf8'), original);
});

test('invalid Claude settings are not overwritten', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'moodle-json-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  fs.mkdirSync(path.join(home, '.claude'));
  const file = path.join(home, '.claude/settings.json');
  fs.writeFileSync(file, '{invalid');
  assert.throws(() => installClients({ home, clients: ['claude'] }));
  assert.equal(fs.readFileSync(file, 'utf8'), '{invalid');
  assert.equal(fs.existsSync(path.join(home, '.claude.json')), false);
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
