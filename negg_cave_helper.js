// ==UserScript==
// @name          Neopets Negg Cave Helper
// @namespace     GreaseMonkey
// @version       1.2
// @description   Displays all possible 3x3 grid solutions for Neopets' Mysterious Negg Cave puzzle. Usually, there's one unique solution, but sometimes a different solution exists.
// @match         *://www.neopets.com/shenkuu/neggcave/*
// @grant         none
// ==/UserScript==

(() => {
  'use strict';
  const ICONS = ['🛡️', '🔥', '🍀'], COLORS = ['purple', 'red', 'yellow'];
  let solutionCount = 0; // To keep track of the number of solutions found

  const createUI = () => {
    const div = document.createElement('div');
    div.id = 'negg-cave-solutions-container'; // Changed ID for the container of all solutions
    Object.assign(div.style, {
      position: 'fixed', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)',
      border: '2px solid #333', borderRadius: '8px', padding: '10px', zIndex: 10000,
      fontFamily: 'Arial,sans-serif', maxHeight: '90%', overflowY: 'auto' // Added for scroll if many solutions
    });
    div.innerHTML = `<div style="color:white;font-weight:bold;text-align:center;margin-bottom:10px;font-size:12px;">Negg Cave Solver (All Solutions)</div>`;
    document.body.appendChild(div);
  };

  const createSolutionBox = (id) => {
    const solutionBox = document.createElement('div');
    solutionBox.id = `negg-cave-solution-${id}`;
    Object.assign(solutionBox.style, {
      marginBottom: '15px',
      padding: '10px',
      border: '1px solid #555',
      borderRadius: '5px',
      backgroundColor: 'rgba(255,255,255,0.1)'
    });
    solutionBox.innerHTML = `<div style="color:white;font-weight:bold;margin-bottom:5px;">Solution ${id + 1}:</div>
      <div style="display:grid;grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);gap:2px;">
      ${Array.from({ length: 9 }, (_, i) => `<div id="cell-${id}-${i}" style="width:40px;height:40px;border:1px solid #666;display:flex;align-items:center;justify-content:center;font-size:16px;border-radius:4px;"></div>`).join('')}
      </div>`;
    document.getElementById('negg-cave-solutions-container').appendChild(solutionBox);
  };

  const extractClues = () =>
    [...document.querySelectorAll('.mnc_clue_table')].map(t => {
      const clue = [];
      [...t.querySelectorAll('tr')].forEach(r => {
        const row = [];
        [...r.querySelectorAll('td')].forEach(td => {
          if (td.classList.contains('empty')) {
            row.push(null); // pad with null
          } else {
            const div = td.querySelector('.mnc_negg_clue_cell');
            const m = div?.className.match(/s([0-3X])c([0-3X])/);
            if (m) {
              const [_, s, c] = m;
              row.push([
                s === 'X' ? 3 : +s,
                c === 'X' ? 3 : +c
              ]);
            } else {
              row.push(null);
            }
          }
        });
        clue.push(row);
      });
      return clue;
    });

  const clueMatches = (grid, clue) => {
    const h = clue.length, w = clue[0].length;
    for (let x = 0; x <= 3 - h; x++) {
      for (let y = 0; y <= 3 - w; y++) {
        let match = true;
        for (let dx = 0; dx < h && match; dx++) {
          for (let dy = 0; dy < w && match; dy++) {
            const clueCell = clue[dx][dy];
            if (!clueCell) continue; // Skip empty cells
            const [s, c] = clueCell;
            const v = grid[x + dx][y + dy];
            if ((s !== 3 && v % 3 !== s) || (c !== 3 && Math.floor(v / 3) !== c)) {
              match = false;
            }
          }
        }
        if (match) return true;
      }
    }
    return false;
  };

  const perms = a => a.length <= 1 ? [a] : a.flatMap((v, i) =>
    perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [v, ...p]));

  // Modified to find all solutions
  const findAllSolutions = clues =>
    perms([...Array(9).keys()]).filter(p =>
      clues.every(clue => clueMatches([0, 1, 2].map(i => p.slice(i * 3, i * 3 + 3)), clue))
    );

  const renderSolution = (sol, solutionIndex) => {
    createSolutionBox(solutionIndex); // Create a new box for each solution
    sol.forEach((v, i) => {
      const el = document.getElementById(`cell-${solutionIndex}-${i}`); // Use unique ID
      if (!el) return;
      const color = COLORS[Math.floor(v / 3)];
      Object.assign(el.style, { backgroundColor: color, color: color === 'yellow' ? 'black' : 'white' });
      el.textContent = ICONS[v % 3];
    });
  };

  const init = () => {
    createUI(); // Create the main container
    try {
      const solutions = findAllSolutions(extractClues());
      if (solutions.length === 0) {
        document.getElementById('negg-cave-solutions-container').innerHTML += '<div style="color:white; text-align:center;">No solutions found.</div>';
      } else {
        solutions.forEach((sol, index) => {
          renderSolution(sol, index); // Render each solution
        });
      }
    } catch (e) {
      console.error('Negg Cave Solver Error:', e);
      document.getElementById('negg-cave-solutions-container').innerHTML += `<div style="color:red; text-align:center;">Error: ${e.message}</div>`;
    }
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
