import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderLanding, renderLogin} from '../opennext-public-pages.js';

test('every illustration packet follows its visible vector route without static raster dots', () => {
  for (const markup of [renderLanding(), renderLogin()]) {
    const artwork = markup.match(/<svg class="public-flow-drawing"[\s\S]*?<\/svg>/)?.[0];
    assert.ok(artwork, 'the illustration is rendered as one scalable coordinate system');
    assert.doesNotMatch(artwork, /<(?:image|img)\b/, 'no baked-in packet remains');
    const routes = new Map([...artwork.matchAll(/<path id="([^"]+)" d="([^"]+)" pathLength="1000"/g)].map(match => [match[1], match[2]]));
    const lines = [...artwork.matchAll(/<use class="public-flow-line" href="#([^"]+)"/g)].map(match => match[1]);
    const packets = [...artwork.matchAll(/<circle class="public-flow-packet" data-route="([^"]+)" cx="0" cy="0" r="4.5"><animateMotion dur="([\d.]+)s" begin="([\d.-]+)s" calcMode="paced" repeatCount="indefinite"><mpath href="#([^"]+)"\/><\/animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.02;0.98;1" dur="([\d.]+)s" begin="([\d.-]+)s" repeatCount="indefinite"\/><\/circle>/g)];
    assert.ok(routes.size >= 3);
    assert.ok(packets.length >= routes.size);
    for (const [id] of routes) {
      assert.ok(lines.includes(id), 'the motion route has an exactly matching visible line');
      assert.ok(packets.some(packet => packet[1] === id), 'each route carries moving capacity');
    }
    assert.equal([...artwork.matchAll(/<circle\b/g)].length, packets.length, 'every circular packet is animated');
    for (const [, id, duration, delay, motionRoute, fadeDuration, fadeDelay] of packets) {
      assert.ok(routes.has(id));
      assert.equal(motionRoute, id, 'native SVG motion references exactly the visible line');
      assert.ok(Number(duration) > 0);
      assert.ok(Number(delay) < 0, 'every packet is already in motion at first paint');
      assert.equal(fadeDuration, duration, 'fade timing stays synchronized with each journey');
      assert.equal(fadeDelay, delay);
    }
  }
  const css = readFileSync(new URL('../opennext-public.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /stroke-dashoffset|offset-path|offset-distance|animation-direction:alternate/);
  assert.match(css, /\.public-flow-toggle:checked~\.public-flow-art \.public-flow-packet\{visibility:hidden\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.public-flow-packet\{animation:none;display:none\}/);
});

test('compute enclosures have closed faces and one consistent perspective', () => {
  const markup = renderLanding();
  const roofs = [...markup.matchAll(/<path class="public-flow-plane" d="M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) Z"/g)];
  assert.equal(roofs.length, 3);
  assert.equal([...markup.matchAll(/class="public-flow-face public-flow-front-face" d="[^"]+ Z"/g)].length, 3);
  assert.equal([...markup.matchAll(/class="public-flow-face public-flow-side-face" d="[^"]+ Z"/g)].length, 3);
  for (const roof of roofs) {
    const [ax, ay, bx, by, cx, cy, dx, dy] = roof.slice(1).map(Number);
    assert.ok(Math.abs((by - ay) / (bx - ax) - 0.22) < 0.0001, 'front edges share a projection axis');
    assert.ok(Math.abs((dy - ay) / (dx - ax) + 0.32) < 0.0001, 'side edges share a projection axis');
    assert.ok(Math.abs((cx - bx) - (dx - ax)) < 0.01, 'opposing edges are parallel');
    assert.ok(Math.abs((cy - by) - (dy - ay)) < 0.01, 'roof closes without skew');
  }
});
