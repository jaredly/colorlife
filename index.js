/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
const sq3 = 2 / Math.sqrt(3);

const hexpoints = [];
for (let i = 0; i < 6; i++) {
    const t = ((Math.PI * 2) / 6) * i + Math.PI / 2;
    const off = 1 / Math.sqrt(3);
    hexpoints.push([Math.cos(t) * off, Math.sin(t) * off]);
}

const hexagons = () => {
    const cellAt = (x, y, scale) => {
        const xs = scale * sq3;
        x *= xs;
        if (y % 2 === 1) x += xs / 2;
        y *= scale;
        ctx.beginPath();
        hexpoints.forEach(([dx, dy], i) => {
            if (i === 0) {
                ctx.moveTo(x + dx * xs, y + dy * xs);
            } else {
                ctx.lineTo(x + dx * xs, y + dy * xs);
            }
        });
        // ctx.ellipse(x, y, scale / 2, scale / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    return {
        xs: 1 * sq3,
        ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const circles = () => {
    const sq3 = 2 / Math.sqrt(3);

    const cellAt = (x, y, scale) => {
        const xs = scale * sq3;
        x *= xs;
        if (y % 2 === 1) x += xs / 2;
        y *= scale;
        ctx.beginPath();
        ctx.ellipse(x, y, scale / 2, scale / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    return {
        xs: 1 * sq3,
        ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const tris = () => {
    const sq3 = 2 / Math.sqrt(3);

    const SYMM = false;

    const cellAt = (x, y, scale) => {
        const xs = scale * sq3;

        let flip = x % 2 == 1;
        x *= xs / 2;
        if (flip) x -= xs / 2;
        if (!SYMM) {
            if (y % 2 === 1) x += xs / 2;
        }
        y *= scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (flip) {
            ctx.lineTo(x + xs, y);
            ctx.lineTo(x + xs / 2, y + scale);
        } else {
            ctx.lineTo(x + xs / 2, y + scale);
            ctx.lineTo(x - xs / 2, y + scale);
        }
        ctx.fill();
    };

    return {
        xs: 2 * sq3,
        ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const cellAt = (x, y, scale) => {
    ctx.fillRect(x * scale, y * scale, scale, scale);
};

const next = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

const wrap = (v, max) => {
    return v < 0 ? max - 1 : v >= max ? 0 : v;
};

const neighborCells = (board, x, y, w, h) => {
    return next.map(([dx, dy]) => board[wrap(y + dy, h)][wrap(x + dx, w)]);
};

const liveness = (self, count) => {
    return count === 3 || (self && count == 2);
};

const conway = {
    xs: 1,
    ys: 1,
    cellAt,
    neighborCells,
    liveness,
};

/** @type {(w: number, h: number) => Array<Array<{hue: number, life: number, drop: number}>>} */
const makeBoard = (w, h) => {
    const cells = [];
    for (let y = 0; y < h; y++) {
        cells.push([]);
        for (let x = 0; x < w; x++) {
            cells[cells.length - 1].push({ hue: Math.random() * 360, life: 0, drop: 0 });
        }
    }
    return cells;
};

const draw = (mode, cells, scale, w, h, mdrop) => {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const v = cells[y][x];
            if (v.life == 0) {
                // const mdrop = 20;
                const dmin = +dropMin.value;
                const dmax = +dropMax.value;
                const light = (1 - Math.min(mdrop, v.drop) / mdrop) * (dmax - dmin) + dmin;
                ctx.fillStyle = `hsl(${v.hue.toFixed(2)},100%,${light.toFixed(2)}%)`;
            } else {
                ctx.fillStyle = `hsl(${v.hue.toFixed(2)},100%,50%)`;
            }
            mode.cellAt(x, y, scale);
        }
    }
};

/****  */

const getMut = (min, max) => {
    if (max == 0) return 0;
    let by = Math.random() - 0.5;
    let off = (max - min) * by;
    return by < 0 ? off - min : off + min;
};

/** @type {(board: {life: number, hue: number}[][], x: number, y: number) => {life: number, hue: number}} */
const neighbors = (mode, board, x, y, w, h, mutateMin, mutateMax) => {
    let count = 0;
    let hues = [];
    mode.neighborCells(board, x, y, w, h).forEach((cell) => {
        count += cell.life;
        if (cell.life) {
            hues.push(cell.hue);
        }
    });
    const cell = board[y][x];
    const live = mode.liveness(cell.life, count);
    if (!live) {
        return { hue: cell.hue, life: 0, drop: cell.drop + 1 };
    }
    if (cell.life) {
        return cell; // stable
    }
    const hue = hueverage(hues, (getMut(mutateMin, mutateMax) / 180) * Math.PI);
    return { life: 1, hue: hue, drop: 0 };
};

const hueverage = (hues, extra = 0) => {
    let x = 0;
    let y = 0;
    hues.forEach((hue) => {
        const r = (hue / 180) * Math.PI;
        x += Math.cos(r);
        y += Math.sin(r);
    });
    let back = Math.atan2(y, x) + extra;
    if (back < 0) back += Math.PI * 2;
    return (back * 180) / Math.PI;
};

const step = (mode, one, two, w, h, mutateMin, mutateMax) => {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            two[y][x] = neighbors(mode, one, x, y, w, h, mutateMin, mutateMax);
        }
    }
};

const input = (name, placeholder) => {
    const node = document.createElement('input');
    node.type = 'text';
    node.placeholder = placeholder;
    const outer = document.createElement('div');
    outer.textContent = name;
    outer.append(node);
    document.body.append(outer);
    return node;
};

const range = (name, min, max, value, step = 1) => {
    const node = document.createElement('input');
    const outer = document.createElement('div');
    outer.textContent = name;
    outer.append(node);
    node.type = 'range';
    node.step = step + '';
    node.min = min + '';
    node.max = max + '';
    node.value = value + '';
    const show = document.createElement('span');
    show.textContent = node.value;
    node.oninput = () => (show.textContent = node.value);
    node.onchange = () => (show.textContent = node.value);
    outer.append(show);
    document.body.append(outer);
    return node;
};

const run = (mode, ival, w, h, scale, seed) => {
    let one = makeBoard(w, h);
    let two = makeBoard(w, h);

    const t = w * h * seed;
    for (let i = 0; i < t; i++) {
        const x = (Math.random() * w) | 0;
        const y = (Math.random() * h) | 0;
        one[y][x].life = 1;
    }
    draw(mode, one, scale, w, h, +mdrop.value);

    const tick = () => {
        for (let i = 0; i < +multi.value; i++) {
            step(mode, one, two, w, h, mutateMin.value, mutateMax.value);
            [one, two] = [two, one];
        }
        draw(mode, one, scale, w, h, +mdrop.value);
    };

    stepper.onclick = () => tick();

    let runSpeed = +speed.value;

    const next = () => {
        tick();
        if (speed.value !== runSpeed) {
            runSpeed = speed.value;
            clearInterval(ival.current);
            ival.current = setInterval(next, runSpeed);
        }
    };

    clearInterval(ival.current);
    ival.current = setInterval(next, runSpeed);
};

const button = (name, onclick) => {
    const node = document.createElement('button');
    node.textContent = name;
    node.onclick = onclick;
    node.style.marginRight = '10px';
    document.body.append(node);
    return node;
};

const scale = range('scale', 1, 80, 80);
const mutateMin = range('mutate min', 0, 360, 0);
const mutateMax = range('mutate max', 0, 360, 30);
const speed = range('speed', 30, 300, 30);
const seed = range('seed', 0, 1, 0.3, 0.1);
const mdrop = range('dropoff steps', 0, 200, 20);
const dropMin = range('dropoff min', 0, 50, 10);
const dropMax = range('dropoff max', 0, 50, 20);
const multi = range('multi step', 1, 20, 1);

const configs = { scale, mutateMin, mutateMax, speed, seed, mdrop, dropMin, dropMax, multi };

const runConfig = (save) => {
    Object.keys(configs).forEach((key) => {
        if (save[key] != null) {
            configs[key].value = save[key];
            configs[key].onchange();
        }
    });
    go();
};

const stepper = button('Step');
const pause = button('pause', () => {
    if (ival.current == null) {
        ival.current = setInterval(() => stepper.onclick(), speed.value);
    } else {
        clearInterval(ival.current);
        ival.current = null;
    }
});

const ival = { current: null };

// const modee = tris();

const modes = { conway, triangles: tris(), circles: circles(), hexagons: hexagons() };

// const mode = conway;
// const mode = tris();
let mode = modes.hexagons;

const go = () => {
    clearInterval(ival);
    const w = ((ctx.canvas.width / scale.value) * mode.xs) | 0;
    const h = ((ctx.canvas.height / scale.value) * mode.ys) | 0;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    run(mode, ival, w, h, +scale.value, +seed.value);
};

ctx.canvas.onclick = () => go();

go();

const save = button('save', () => {
    const config = { id: Math.random().toString(32).slice(2) };
    Object.keys(configs).forEach((key) => {
        config[key] = +configs[key].value;
    });
    saves.push(config);
    const href = ctx.canvas.toDataURL();
    localStorage[JSON.stringify(config)] = href;
    saveSaves(saves);
    showSaves();
});

Object.keys(modes).forEach((key) => {
    button(key, () => {
        mode = modes[key];
    });
});

const savesNode = document.createElement('div');
document.body.append(savesNode);
Object.assign(savesNode.style, {
    marginTop: '12px',
    maxWidth: '90vw',
    flexDirection: 'row',
    display: 'flex',
    flexWrap: 'wrap',
});

const key = 'colorlife:saves';
const loadSaves = () => {
    const raw = localStorage[key];
    return raw ? JSON.parse(raw) : [];
};
const saveSaves = (saves) => (localStorage[key] = JSON.stringify(saves));

/** @type {Array<Record<string, number>>} */
let saves = loadSaves();

const showSaves = () => {
    savesNode.innerHTML = '';
    savesNode.style.display = 'flex';
    saves.forEach((save) => {
        const href = localStorage[JSON.stringify(save)];
        const node = document.createElement('div');
        const img = document.createElement('img');
        img.src = href;
        img.style.width = '250px';
        img.style.height = '250px';
        node.append(img);
        const text = document.createElement('div');
        Object.assign(text.style, {
            whiteSpace: 'pre',
        });
        text.textContent = JSON.stringify(save);
        node.onclick = () => {
            runConfig(save);
        };
        savesNode.append(node);
    });
};
showSaves();
