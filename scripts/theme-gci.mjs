import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync, gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

// Re-theme the supplied composition in place. Its original renderer, fonts,
// controls, scenes and animation remain bundled, without reconstruction.
export const GCI_ASSETS = Object.freeze({
  scene: 'a56997d2-2e89-42bb-b9e7-2eeaa63c38da',
  runtime: '93151221-e581-42f4-a221-dd87044d2b7b',
  tweaks: '8da44164-d3ee-46e6-9132-16991d0dfed2',
});

export function readBundlePart(html, name) {
  const pattern = new RegExp(`<script type="__bundler/${name}">([\\s\\S]*?)<\\/script>`);
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing original bundle ${name}`);
  return JSON.parse(match[1]);
}

export function decodeAsset(asset) {
  const bytes = Buffer.from(asset.data, 'base64');
  return (asset.compressed ? gunzipSync(bytes) : bytes).toString('utf8');
}

function replaceRequired(source, before, after) {
  if (!source.includes(before)) throw new Error(`Original color token not found: ${before}`);
  return source.split(before).join(after);
}

function patches(source, pairs) {
  return pairs.reduce((value, [before, after]) => replaceRequired(value, before, after), source);
}

export function themeScene(source) {
  return patches(source, [
    ["const BG = '#07080B', PANEL = '#0C0F14', PANEL2 = '#101520', EDGE = '#1D2531';",
      "const BG = '#FFFFFF', PANEL = '#FFFFFF', PANEL2 = '#F6F7F3', EDGE = '#1D2531';"],
    ["const INK = '#E9EDF4', DIM = '#8E99B0', DIMMER = '#4A5365', MUTE = '#7E88A0';",
      "const INK = '#111210', DIM = '#636662', DIMMER = '#636662', MUTE = '#636662';"],
    ['letterSpacing: ls, color, fontWeight: w',
      'letterSpacing: ls, color: [DIM, DIMMER, MUTE].includes(color) ? DIM : INK, fontWeight: w'],
    ['color: ok > 0.2 ? CY : MUTE', 'color: ok > 0.2 ? INK : MUTE'],
    ['#140f06ee', '#ffffffee'],
    ['#081014ee', '#ffffffee'],
    ['#14090b', '#ffffff'],
    ['#0d1218f2', '#fffffff2'],
    ['#08090cf2', '#f6f7f3f2'],
    ['#05060880', '#f6f7f380'],
    ...['04', '05', '06', '08', '10'].map(alpha => [`#ffffff${alpha}`, `#111210${alpha}`]),
  ]);
}

export function themeRuntime(source) {
  return patches(source, [
    ["background: '#0a0a0a'", "background: '#ffffff'"],
    ["background: 'rgba(20,20,20,0.92)'", "background: 'rgba(246,247,243,0.96)'"],
    ["color: '#f6f4ef'", "color: '#111210'"],
    ["color: 'rgba(246,244,239,0.55)'", "color: '#636662'"],
    ["background: 'rgba(255,255,255,0.12)'", "background: 'rgba(17,18,16,0.12)'"],
    ["background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'",
      "background: hover ? 'rgba(17,18,16,0.12)' : 'rgba(17,18,16,0.04)'"],
    ["background: '#fff'", "background: '#111210'"],
  ]);
}

export function themeTweaks(source) {
  return patches(source, [
    ['background:rgba(250,249,247,.78)', 'background:rgba(246,247,243,.78)'],
    ['color:#29261b', 'color:#111210'],
    ['color:rgba(41,38,27,', 'color:rgba(17,18,16,'],
  ]);
}

export function themeTemplate(source) {
  return patches(source, [
    ['<html><head>', '<html lang="en"><head>\n<title>OpenNEXT GCI Index Factory</title>'],
    ['background: #07080B', 'background: #FFFFFF'],
    ['color: #3EE0C6', 'color: #111210'],
    ['color: #7defd9', 'color: #636662'],
  ]);
}

export function themeBundle(source) {
  const manifest = readBundlePart(source, 'manifest');
  const template = readBundlePart(source, 'template');
  for (const [id, transform] of [
    [GCI_ASSETS.scene, themeScene],
    [GCI_ASSETS.runtime, themeRuntime],
    [GCI_ASSETS.tweaks, themeTweaks],
  ]) {
    const asset = manifest[id];
    if (!asset?.compressed) throw new Error(`Missing original compressed asset ${id}`);
    const themed = transform(decodeAsset(asset));
    manifest[id] = { ...asset, data: gzipSync(themed, { level: 9 }).toString('base64') };
  }
  let output = source.replace(/<script type="__bundler\/manifest">[\s\S]*?<\/script>/,
    () => `<script type="__bundler/manifest">${JSON.stringify(manifest)}</script>`);
  output = output.replace(/<script type="__bundler\/template">[\s\S]*?<\/script>/,
    () => `<script type="__bundler/template">${JSON.stringify(themeTemplate(template)).replace(/</g, '\\u003c')}</script>`);
  // The temporary loading screen is part of the original bundle, too.
  output = patches(output, [
    ['<html>\n<head>', '<html lang="en">\n<head>'],
    ['<title>Bundled Page</title>', '<title>OpenNEXT GCI Index Factory</title>'],
    ['background: #07080B', 'background: #FFFFFF'],
    ['fill="#07080B"', 'fill="#FFFFFF"'],
    ['fill="#101520"', 'fill="#F6F7F3"'],
    ['color: #666', 'color: #636662'],
    ['color: #999', 'color: #636662'],
    ['color:#999', 'color:#636662'],
    ['font-size="54" fill="#3EE0C6"', 'font-size="54" fill="#111210"'],
  ]);
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , input, output] = process.argv;
  if (!input || !output) throw new Error('Usage: node scripts/theme-gci.mjs original.html output.html');
  await writeFile(output, themeBundle(await readFile(input, 'utf8')));
  console.log(`Preserved original GCI composition; updated background and text colors: ${output}`);
}
