/* Explanatory models checked against the Java examples. No Minecraft simulation. */
(() => {
  'use strict';
  const offsets = neighborhood => {
    if (!['N6', 'N18', 'N26'].includes(neighborhood)) throw new Error('Unknown neighborhood');
    const values = [];
    for (let z = -1; z <= 1; z++) for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
      const axes = Math.abs(x) + Math.abs(y) + Math.abs(z);
      if (axes && (neighborhood === 'N26' || axes <= (neighborhood === 'N18' ? 2 : 1))) values.push([x, y, z]);
    }
    return values;
  };
  const cell = (world, origin, size) => {
    if (![world, origin, size].every(Number.isFinite) || size <= 0) throw new Error('Finite values and positive cell size required');
    return Math.floor((world - origin) / size);
  };
  window.ASHNAV_MODELS = {offsets, cell};
})();
