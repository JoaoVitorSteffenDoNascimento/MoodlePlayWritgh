#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const FIELDS = ['language', 'tone', 'length', 'vocabulary', 'rhythm', 'structure', 'emotion', 'confidence', 'explicitPreferences', 'avoid'];

function profilePath(student, home = os.homedir()) {
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(student || '')) throw new Error('Use um alias de 1 a 40 caracteres: letras minúsculas, números, _ ou -.');
  return path.join(home, '.moodle-playwright', 'estudantes', student, 'escrita.json');
}
function read(student, home) {
  const file = profilePath(student, home);
  if (!fs.existsSync(file)) return null;
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value.student !== student || value.version !== 1) throw new Error('Perfil incompatível ou de outro estudante.');
  return value;
}
function update(student, patch, home) {
  const file = profilePath(student, home);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Envie um objeto JSON de preferências.');
  for (const [key, value] of Object.entries(patch)) {
    if (!FIELDS.includes(key)) throw new Error(`Campo não permitido: ${key}. Não armazene prompts ou dados pessoais.`);
    if (['avoid', 'explicitPreferences'].includes(key)) {
      if (!Array.isArray(value) || value.length > 12 || value.some(s => typeof s !== 'string' || s.length > 240)) throw new Error(`Lista inválida: ${key}`);
    } else if (typeof value !== 'string' || value.length > 400) throw new Error(`Preferência inválida: ${key}`);
    if (key === 'confidence' && !['low', 'medium', 'high'].includes(value)) throw new Error('confidence deve ser low, medium ou high.');
  }
  const previous = read(student, home);
  const preferences = { ...(previous?.preferences || {}), ...patch };
  const result = { version: 1, student, preferences, updatedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  return result;
}
function forget(student, home) {
  const file = profilePath(student, home);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
function main() {
  const [action, ...args] = process.argv.slice(2);
  if (action === 'list' && !args.length) {
    const base = path.join(os.homedir(), '.moodle-playwright', 'estudantes');
    console.log(JSON.stringify(fs.existsSync(base) ? fs.readdirSync(base).filter(id => /^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) && fs.existsSync(profilePath(id))) : []));
    return;
  }
  if (!['read', 'update', 'forget'].includes(action) || args.length !== 2 || args[0] !== '--student') throw new Error('Uso: voice-profile.cjs read|update|forget --student alias; ou list. update lê JSON pelo stdin.');
  const student = args[1];
  if (action === 'read') console.log(JSON.stringify(read(student), null, 2));
  if (action === 'update') console.log(JSON.stringify(update(student, JSON.parse(fs.readFileSync(0, 'utf8'))), null, 2));
  if (action === 'forget') { forget(student); console.log('Perfil de escrita apagado.'); }
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { read, update, forget, profilePath };
