import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readBundlePart, decodeAsset, GCI_ASSETS } from '../scripts/theme-gci.mjs';

// Digests from the original upload verify preservation without a duplicate bundle.
const BASELINE = {
  "normalizedScene": "9e2e916836e2945fcc831d94d3f57d268a4f175aad93c948d34025998754dab4",
  "normalizedRuntime": "222df3b249076e4cd4d2ec2539944da54464d0578c7ebf7a75dbdb287750b0e9",
  "normalizedTweaks": "2acf71b0e7350f5ae4808f31534aec24e67590726ee7a0c9520d528154426d76",
  "normalizedTemplate": "b219831ea570e87ebe293ee7a4cb1ea893f6bb32bde491decb37ea7b0f66c6c1",
  "normalizedOuter": "ae1e4a5c9fd431fa381a3bc49a2cc8c09d3cce9b49470e4acc5a320316504cab",
  "untouchedAssets": {
    "8cf36e0b-f94e-4623-8c0a-c09ba2a3d8ff": "76733c5f388e288ac8dd26d00db373546adf588992470a4b89b8145ad2eee27a",
    "88fcbc49-8a13-4441-a39b-d10356a7156e": "4c1483ecac1bd6af1aa12b9f35b90e3fb6601aa5ae69761136d0cecabf0c47d6",
    "5793beed-3fd0-48d5-95f8-2bb5467283c3": "af755d9014c8ae3b967e81ca14ac66a1578b014786983bc0419864b9a889379e",
    "5f781691-7e75-4cfe-89c3-80a2a7ebc034": "dacbde8e4e587262e2bf7c2e9730cab94eb7043925a1a09c5cfec997966b21e4",
    "73333e4e-80e1-4f11-8805-5cce4f1128c0": "de05165327c4da61523369bc296ce51707e697f44cfab4f0a1596049bd617a50",
    "92c8daab-4b2e-4a2c-a3a5-ce27e7f1c37a": "26539775a1778235f3c1c3a2079e3e9499ae96848565beda22ff29e81c3a5ac8",
    "1636a4f9-8c1b-4e55-936f-1f806fe972cb": "af1173b2f6c405586fe2a4329de4ef9faaad374fdfe843d3a74bd06ffa20d667",
    "227726df-692c-4ef8-a041-f8a1f71113bd": "d7119f430d65f62ab3e3fb5ec258ad872ee8422350e9737585acca3687ed3ef0",
    "794d4cb1-9aa7-4b17-a3f2-d916a0e7f22a": "83ee63d9e0f9b53cfdef07ab398d3b4b93feacf080a24f5603b2ab6e5131ce77",
    "3cee0fce-6f17-4345-a375-67191637f352": "75622d92fdb908f6446bb8e2742f651065f30600741016c066d6c2a6a7c972a0",
    "8a08f08a-5cda-409e-bcb0-4aa198b6092a": "8729e0b18209f3afa91a9f36d7d9f6f4c660ba537f688acd72a63e9f1383b141",
    "5eb0967b-368f-4abb-aebe-42b6c3155a6e": "6563030fae5f383c5fa727c5358b458b4a044e0b727adb8f0db219947d4743e6",
    "a65659e0-0143-40d7-b024-fdaa0fcbfbf9": "9c32e9c8fc38f5d63b9b43584bc0cd7c17f8995ddc443db2d779bd2fad046582",
    "cb8189aa-2e6b-446d-9384-0f3152394161": "dd07928feb4c37b531e74f6b357fd729adbf431635f239c96bde0c89b1710beb",
    "203f00db-02c2-4cc0-b910-11d3453cd191": "e1f89d39e4a9c917076f63817dff3bff65f5a216b2e8994f51b3ba84dde96af0",
    "128d79fa-5e77-47a6-b645-5269a01c844e": "7aa3900b501c1d87809cb12549a737fbf476aafb2b918f27157c49400ccb7741",
    "4d4edde2-92fc-4b2b-98c1-323dc029b6d4": "4d0b24478ea16f03472b0a17f7baa7225156ad349c033b550848d22a656ee31b",
    "d64f65bb-0548-4866-8d99-3eb2900b1846": "4f413e4931f41e4e2dc13c28c442238f36a7860a54328430d315a1ef35b2041c",
    "f91b9d78-47b7-4766-8384-67c757f555b2": "6a52a2ad024453945b21ff43ac9761c46108536c027510ecfbc6de255bf487bd",
    "53025935-2fe5-4e55-9047-680c46d673f7": "862cd986d43f2f3c9bcf1a18795da9e5a75515fa7ec6e9e34632592906698f1f",
    "dd195b87-8d97-413d-a141-dd85dc4c9e24": "ed329368781549a18e019aae310fa84e6de205fbb7646191ac7109d32e2d57ea",
    "495d9fe7-efe5-4470-8b5c-7ea00661efb6": "ce275e4ae6c1ff3913765c64ef9cd77ebaa20e26cebebc0719e3550a8cfafd70"
  },
  "configurations": {
    "OM_SCENES": "'[{\"name\":\"Idle\",\"dur\":2.08,\"desc\":\"Wide shot of the dark factory floor as the title settles in\"},{\"name\":\"Ingest\",\"dur\":2.6,\"desc\":\"Camera pushes in as raw GPU quotes stream onto the belt and the collection agent lights up\"},{\"name\":\"Pipeline\",\"dur\":4.68,\"desc\":\"The tracked lot moves through normalization, duplicate detection and surveillance\"},{\"name\":\"FraudCase\",\"dur\":3.64,\"desc\":\"A duplicate related-party listing is flagged, escalated to the case ledger and rejected\"},{\"name\":\"Compute\",\"dur\":2.86,\"desc\":\"The deterministic engine calculates the index and two human reviewers sign off\"},{\"name\":\"Publish\",\"dur\":3.64,\"desc\":\"The release package publishes, the index card lands, then the camera pulls back to the opening frame\"}]'",
    "OM_PLAYBACK": "'{\"mode\":\"loop\"}'",
    "TWEAK_DEFAULTS": "/*EDITMODE-BEGIN*/{\"accent\":\"#3EE0C6\",\"cadence\":\"1s\",\"showFullNames\":true,\"motionEditor\":true}/*EDITMODE-END*/"
  },
  "extResources": "c3b54c501379e1fa653949571b30bf463e2b40cead7359ea6afc00fd0c5f5faf",
  "pageOrder": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
};
const html = await readFile(new URL('../gci-index-factory.html', import.meta.url), 'utf8');
const manifest = readBundlePart(html, 'manifest');
const template = readBundlePart(html, 'template');
const scene = decodeAsset(manifest[GCI_ASSETS.scene]);
const sha = value => createHash('sha256').update(value).digest('hex');
const normalizeColors = value => value.replace(/#[0-9a-f]{3,8}\b|\b(?:rgba?|oklch)\([^)]*\)/gi, '<COLOR>');
const normalizeScene = value => normalizeColors(value
  .replace('color: [DIM, DIMMER, MUTE].includes(color) ? DIM : INK', 'color')
  .replace('color: ok > 0.2 ? INK : MUTE', 'color: ok > 0.2 ? CY : MUTE'));
const normalizeDocument = value => normalizeColors(value
  .replace('<html lang="en">', '<html>')
  .replace('\n<title>OpenNEXT GCI Index Factory</title>', '')
  .replace('<title>OpenNEXT GCI Index Factory</title>', '<title>Bundled Page</title>'));
const withoutParts = value => value.replace(/(<script type="__bundler\/[^\"]+">)[\s\S]*?(<\/script>)/g, '$1[PACKED DATA]$2');

test('GCI preserves every original scene element, font, coordinate and animation expression', () => {
  assert.equal(sha(normalizeScene(scene)), BASELINE.normalizedScene);
  assert.match(scene, /const T = T_RAW \/ 1\.3/);
  assert.match(scene, /width=\{1920\} height=\{1080\}/);
  assert.match(scene, /const CY = '#3EE0C6', GOLD = '#F5B846', RED = '#FF5C55'/);
  assert.match(scene, /EDGE = '#1D2531'/);
  assert.match(scene, /Same 512-GPU block listed by two related sellers/);
});

test('GCI changes factory backgrounds and typography to the Landing palette only', () => {
  assert.match(scene, /BG = '#FFFFFF', PANEL = '#FFFFFF', PANEL2 = '#F6F7F3'/);
  assert.match(scene, /INK = '#111210', DIM = '#636662'/);
  assert.match(scene, /color: \[DIM, DIMMER, MUTE\]\.includes\(color\) \? DIM : INK/);
  assert.doesNotMatch(scene, /#140f06ee|#081014ee|#14090b|#0d1218f2|#08090cf2|#05060880/);
  assert.match(template, /<html lang="en">/);
  assert.match(template, /<title>OpenNEXT GCI Index Factory<\/title>/);
});

test('GCI retains original controls, runtime logic and authoring interactions', () => {
  assert.equal(sha(normalizeColors(decodeAsset(manifest[GCI_ASSETS.runtime]))), BASELINE.normalizedRuntime);
  assert.equal(sha(normalizeColors(decodeAsset(manifest[GCI_ASSETS.tweaks]))), BASELINE.normalizedTweaks);
  for (const [name, original] of Object.entries(BASELINE.configurations)) {
    const actual = template.match(new RegExp('<script>window\\.' + name + ' = ([\\s\\S]*?);<\\/script>'));
    assert.equal(actual?.[1], original, name);
  }
});

test('GCI keeps every original bundled dependency and font byte-identical', () => {
  assert.equal(Object.keys(manifest).length, Object.keys(BASELINE.untouchedAssets).length + 3);
  for (const [id, digest] of Object.entries(BASELINE.untouchedAssets)) {
    assert.equal(sha(JSON.stringify(manifest[id])), digest, id);
  }
  assert.equal(sha(JSON.stringify(readBundlePart(html, 'ext_resources'))), BASELINE.extResources);
  assert.equal(sha(JSON.stringify(readBundlePart(html, 'page_order'))), BASELINE.pageOrder);
});

test('GCI retains the original document loader and template outside colors and page metadata', () => {
  assert.equal(sha(normalizeDocument(template)), BASELINE.normalizedTemplate);
  assert.equal(sha(normalizeDocument(withoutParts(html))), BASELINE.normalizedOuter);
});
