/* Figures explain a finite example; they do not execute Ashnav or inspect a world. */
(() => {
  'use strict';
  const {offsets, cell} = window.ASHNAV_MODELS;
  const button = 'rounded border border-line bg-surface px-3 py-1.5 text-[12px] hover:border-accent';
  const panel = 'diagram-component nav-figure my-6 overflow-hidden rounded-md border border-line bg-surface p-4';
  const label = (x, y, text, extra = '') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;

  function neighborhood(host) {
    host.innerHTML = `<figure class="${panel}"><div class="flex flex-wrap items-end gap-4"><label class="text-[12px]">Neighborhood<select class="mt-1 block rounded border border-line bg-page p-2 text-foreground" aria-label="Neighborhood"><option>N6</option><option>N18</option><option>N26</option></select></label><button class="${button}" type="button">Reset</button></div><svg viewBox="0 0 630 250" role="img" aria-label="Three XZ slices through the 3 by 3 by 3 neighborhood"></svg><p class="diagram-reading font-mono text-[12px]" role="status" aria-live="polite"></p><figcaption>Three XZ slices of a 3D neighborhood. X increases right; Z increases down. Y increases between slices. The center C stays fixed. Numbers give edge costs in cell units; a dash means no edge. All candidate cells are walkable in this illustration.</figcaption></figure>`;
    const select = host.querySelector('select');
    const render = () => {
      const candidates = offsets(select.value);
      let svg = '';
      for (let y = -1; y <= 1; y++) {
        const base = (y + 1) * 210 + 8;
        svg += label(base + 88, 24, `Y = ${y}`, 'text-anchor="middle"');
        for (let z = -1; z <= 1; z++) for (let x = -1; x <= 1; x++) {
          const active = candidates.some(p => p[0] === x && p[1] === y && p[2] === z);
          const center = x === 0 && y === 0 && z === 0;
          const px = base + (x + 1) * 57, py = 42 + (z + 1) * 57;
          const cost = Math.sqrt(x*x + y*y + z*z);
          svg += `<rect x="${px}" y="${py}" width="51" height="51" rx="4" fill="${active ? 'var(--accent-soft)' : 'var(--bg)'}" stroke="${active || center ? 'var(--accent)' : 'var(--border)'}"/>`;
          svg += label(px+25.5, py+31, center ? 'C' : active ? cost === 1 ? '1' : cost < 1.5 ? '√2' : '√3' : '—', 'text-anchor="middle"');
        }
        svg += label(base + 82, 237, 'X →     Z ↓', 'text-anchor="middle" class="muted-label"');
      }
      host.querySelector('svg').innerHTML = svg;
      host.querySelector('.diagram-reading').textContent = `${select.value}: ${candidates.length} possible neighbors · center excluded`;
    };
    select.addEventListener('change', render);
    host.querySelector('button').addEventListener('click', () => {select.value = 'N6'; render();});
    render();
  }

  function mapping(host) {
    host.innerHTML = `<figure class="${panel}"><div class="grid grid-cols-2 gap-4 max-[680px]:grid-cols-1"><label class="text-[12px]">World X <output class="world-x"></output><input class="mt-2 block w-full accent-accent" aria-label="World X" type="range" min="-5" max="3" step="0.1" value="-3"></label><label class="text-[12px]">Cell size (world units)<select class="mt-1 block w-full rounded border border-line bg-page p-2 text-foreground" aria-label="Cell size"><option value="1">1</option><option value="2" selected>2</option></select></label></div><div class="mt-3 flex flex-wrap gap-2"><button class="${button}" type="button" data-boundary>Upper boundary</button><button class="${button}" type="button" data-reset>Reset</button></div><svg viewBox="0 0 600 195" role="img" aria-label="X-axis section of three cells at origin X minus four"></svg><p class="diagram-reading font-mono text-[12px]" role="status" aria-live="polite"></p><figcaption>X-axis section of the quick-start grid. Origin X = −4 stays fixed. Y and Z stay at the middle of their single cell. World X and cell size change the input; the camera stays fixed. Cell centers are shown as dots. The upper edge belongs to the next cell, outside this three-cell grid. Changing cell size never changes an N6 graph edge cost of 1.</figcaption></figure>`;
    const slider = host.querySelector('input'), select = host.querySelector('select');
    const render = () => {
      const world = Number(slider.value), size = Number(select.value), index = cell(world, -4, size);
      const project = n => 42 + (n + 5) * 63;
      let svg = `<path d="M30 132 H568" stroke="var(--muted)" fill="none"/>`;
      for (let i = 0; i < 3; i++) {
        const lo = -4+i*size, hi = lo+size;
        svg += `<rect x="${project(lo)}" y="52" width="${63*size}" height="72" fill="var(--accent-soft)" stroke="var(--accent)"/>`;
        svg += label(project((lo+hi)/2), 80, `node ${i}`, 'text-anchor="middle"');
        svg += `<circle cx="${project((lo+hi)/2)}" cy="103" r="3" fill="var(--muted)"/>`;
        svg += label(project(lo), 152, `${lo}`, 'text-anchor="middle" class="muted-label"');
      }
      svg += label(project(-4+3*size), 152, `${-4+3*size}`, 'text-anchor="middle" class="muted-label"');
      svg += `<path d="M${project(world)} 28 V128" stroke="var(--text)" stroke-width="2" stroke-dasharray="4 3"/>`;
      svg += label(project(world), 20, `X = ${world.toFixed(1)}`, 'text-anchor="middle"');
      svg += label(300, 182, 'World X → (world units)', 'text-anchor="middle" class="muted-label"');
      host.querySelector('svg').innerHTML = svg;
      host.querySelector('.world-x').textContent = `= ${world.toFixed(1)} world units`;
      host.querySelector('.diagram-reading').textContent = `cell X = floor((${world.toFixed(1)} − (−4)) / ${size}) = ${index} · node = ${index >= 0 && index < 3 ? index : -1}`;
    };
    slider.addEventListener('input', render);
    select.addEventListener('change', render);
    host.querySelector('[data-reset]').addEventListener('click', () => {slider.value = '-3'; select.value = '2'; render();});
    host.querySelector('[data-boundary]').addEventListener('click', () => {slider.value = String(-4+3*Number(select.value)); render();});
    render();
  }

  window.WikiDiagrams = {
    mount(root) {
      for (const host of root.querySelectorAll('[data-diagram]')) {
        if (host.dataset.diagram === 'neighborhood') neighborhood(host);
        if (host.dataset.diagram === 'world-mapping') mapping(host);
      }
      return () => {};
    }
  };
})();
