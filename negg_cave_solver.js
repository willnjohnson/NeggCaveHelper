// ==UserScript==
// @name         Neopets Negg Cave Solver
// @namespace    GreaseMonkey
// @version      1.0
// @description  Displays a 3x3 grid solution for Neopets' Mysterious Negg Cave puzzle with solution
// @author       @willnjohnson
// @match        *://www.neopets.com/shenkuu/neggcave/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const ICONS = ['🛡️', '🔥', '🍀'], BG_COLORS = ['purple', 'red', 'yellow'];

  const createUI = () => {
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'fixed', top: '10px', right: '10px',
      background: 'rgba(0,0,0,0.8)', border: '2px solid #333',
      borderRadius: '8px', padding: '10px', zIndex: 10000,
      fontFamily: 'Arial,sans-serif'
    });
    div.id = 'negg-cave-ui';
    div.innerHTML = `
      <div style="color:white;font-weight:bold;text-align:center;margin-bottom:10px;font-size:12px;">Negg Cave Solver</div>
      <div style="display:grid;grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);gap:2px;">
        ${[...Array(9)].map((_, i) =>
          `<div id="cell-${i}" style="width:40px;height:40px;border:1px solid #666;display:flex;align-items:center;justify-content:center;font-size:16px;border-radius:4px;"></div>`).join('')}
      </div>`;
    document.body.appendChild(div);
  };

  const extractClues = () => [...document.querySelectorAll('.mnc_clue_table')].map(table =>
    [...table.querySelectorAll('tr')].map(row =>
      [...row.querySelectorAll('td')].map(td => {
        const match = td.innerHTML.match(/mnc_negg_clue_s([0-3X])c([0-3X])/);
        const [r, c] = match ? [match[1], match[2]] : ['X', 'X'];
        return [r === 'X' ? 3 : +r, c === 'X' ? 3 : +c]; // [symbol, color]
      })
    )
  );

  const clueMatches = (grid, clue) =>
    clue.some((_, x) => clue[0].some((_, y) =>
      x <= 3 - clue.length && y <= 3 - clue[0].length &&
      clue.every((row, dx) => row.every(([sym, col], dy) => {
        const val = grid[x + dx][y + dy];
        return (sym === 3 || val % 3 === sym) && (col === 3 || Math.floor(val / 3) === col);
      }))
    ));

  const perms = a => a.length <= 1 ? [a] :
    a.flatMap((v, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [v, ...p]));

  const findSolution = clues =>
    perms([...Array(9).keys()]).find(p =>
      clues.every(c => clueMatches([0, 1, 2].map(i => p.slice(i * 3, i * 3 + 3)), c))
    ) || Array(9).fill(9);

  const render = solution => solution.forEach((v, i) => {
    const el = document.getElementById(`cell-${i}`);
    if (!el || v === 9) return;
    const color = BG_COLORS[Math.floor(v / 3)];
    Object.assign(el.style, {
      backgroundColor: color,
      color: color === 'yellow' ? 'black' : 'white'
    });
    el.textContent = ICONS[v % 3];
  });

  const init = () => {
    createUI();
    try { render(findSolution(extractClues())); }
    catch (e) { console.error('Negg Cave Solver error:', e); }
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
