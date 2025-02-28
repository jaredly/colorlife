const tops = document.createElement('div');
document.body.append(tops);
Object.assign(tops.style, {
    display: 'flex',
    flexWrap: 'wrap',
});

const canvas = document.createElement('canvas');
tops.append(canvas);
canvas.style.marginRight = '12px';
// <canvas id="canvas" width="1000" height="1000" style="width: 500px; height: 500px; border: 5px solid black"></canvas>
const ctx = canvas.getContext('2d');
const sq3 = 2 / Math.sqrt(3);

const hexpoints = [];
for (let i = 0; i < 6; i++) {
    const t = ((Math.PI * 2) / 6) * i + Math.PI / 2;
    const off = 1 / Math.sqrt(3);
    hexpoints.push([Math.cos(t) * off + 0.5, Math.sin(t) * off + off]);
}

const hexagons = () => {
    const cellAt = (ctx, x, y, scale) => {
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
        w: (w, scale) => scale * sq3 * (w + 0.5),
        h: (h, scale) => scale * (h + 1 / 3),
        // ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const circles = () => {
    const sq3 = 2 / Math.sqrt(3);

    const cellAt = (ctx, x, y, scale) => {
        const xs = scale * sq3;
        x *= xs;
        if (y % 2 === 1) x += xs / 2;
        y *= scale;
        ctx.beginPath();
        ctx.ellipse(x + xs / 2, y + xs / 2, xs / 2, xs / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    return {
        xs: 1 * sq3,
        // w: (w, scale) => w * scale,
        w: (w, scale) => scale * sq3 * (w + 0.5),
        h: (h, scale) => scale * (h + 1 / 6),
        // ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const tris = (SYMM, FLIPRIGHT) => {
    const sq3 = 2 / Math.sqrt(3);

    const cellAt = (ctx, x, y, scale) => {
        const xs = scale * sq3;

        let flip = x % 2 == (FLIPRIGHT ? (y % 2 == 0 ? 1 : 0) : 1);
        x *= xs / 2;
        if (!flip) x += xs / 2;
        if (FLIPRIGHT && y % 2 == 1) {
            x -= xs / 2;
        }
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
        xw: (1 / 2) * sq3,
        xs: 2 * sq3,
        w: (w, scale) => (w / 2 + (FLIPRIGHT || SYMM ? 0.5 : 1)) * sq3 * scale,
        h: (h, scale) => scale * h,
        // ys: 1,
        cellAt,
        neighborCells,
        liveness,
    };
};

const cellAt = (ctx, x, y, scale) => {
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

const squares = {
    xs: 1,
    w: (w, scale) => w * scale,
    h: (h, scale) => scale * h,
    // ys: 1,
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
            cells[cells.length - 1].push({ hue: Math.random() * 360, life: 0, drop: -1 });
        }
    }
    return cells;
};

const draw = (ctx, mode, margin, cells, scale, w, h, mdrop) => {
    const FH = mode.h(h, scale) + margin * 2;
    const FW = mode.w(w, scale) + margin * 2;
    if (FW !== ctx.canvas.width || FH !== ctx.canvas.height) {
        ctx.canvas.width = FW;
        ctx.canvas.height = FH;
        ctx.canvas.style.width = ctx.canvas.width / 2 + 'px';
        ctx.canvas.style.height = ctx.canvas.height / 2 + 'px';
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    ctx.save();
    ctx.translate(margin, margin);
    // ctx.scale(0.5, 0.5);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const v = cells[y][x];
            if (v.drop === -1) {
                ctx.fillStyle = `black`;
            } else if (v.life !== 1) {
                const dmin = +dropMin.value;
                const dmax = +dropMax.value;
                const light = mdrop === 0 ? 0 : (1 - Math.min(mdrop, v.drop) / mdrop) * (dmax - dmin) + dmin;
                ctx.fillStyle = `hsl(${v.hue.toFixed(2)},100%,${light.toFixed(2)}%)`;
            } else {
                ctx.fillStyle = `hsl(${v.hue.toFixed(2)},100%,50%)`;
            }
            mode.cellAt(ctx, x, y, scale);
        }
    }
    ctx.restore();
};

/****  */

const getMut = (min, max) => {
    if (max == 0) return 0;
    let by = Math.random() - 0.5;
    let off = (max - min) * by;
    return by < 0 ? off - min : off + min;
};

/** @type {(board: {life: number, hue: number}[][], x: number, y: number) => {life: number, hue: number}} */
const neighbors = (mode, board, x, y, w, h, mutateMin, mutateMax, change) => {
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
        if (cell.life) change.died++;
        return { hue: cell.hue, life: 0, drop: cell.drop === -1 ? -1 : cell.drop + 1 };
    }
    if (cell.life) {
        return cell; // stable
    }
    if (change.bornt === '') {
        change.bornt = `${x},${y}`;
    }
    change.born++;
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

const step = (mode, one, two, w, h, mutateMin, mutateMax, change) => {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            two[y][x] = neighbors(mode, one, x, y, w, h, mutateMin, mutateMax, change);
        }
    }
};

let parent = document.body;

const input = (name, placeholder) => {
    const node = document.createElement('input');
    node.type = 'text';
    node.placeholder = placeholder;
    const outer = document.createElement('div');
    outer.textContent = name;
    outer.append(node);
    parent.append(outer);
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
    parent.append(outer);
    return node;
};

const seedBoard = (board, w, h, seed) => {
    const t = w * h * seed;
    for (let i = 0; i < t; i++) {
        const x = (Math.random() * w) | 0;
        const y = (Math.random() * h) | 0;
        board[y][x].life = 1;
    }
    // for (let y = 0; y < h; y++) {
    //     for (let x = 0; x < w; x++) {
    //         board[y][x] = { hue: (360 / w) * x, life: 0, drop: 0 };
    //     }
    // }
    // const on = { drop: 0, life: 1, hue: 1 };
    // board[5][5] = { ...on };
    // board[5][6] = { ...on };
    // board[5][7] = { ...on };
    // board[6][7] = { ...on };
    // board[7][6] = { ...on };
};

const newStall = () => ({ born: 0, died: 0, count: 0, bornt1: '', bornt2: '' });

const run = (ctx, margin, ival, w, h, scale) => {
    let one = makeBoard(w, h);
    let two = makeBoard(w, h);

    seedBoard(one, w, h, +seed.value);
    draw(ctx, mode, margin, one, scale, w, h, +mdrop.value);

    let stallcheck = newStall();

    /**
     * Difference means:
     * - birth / death check is stalled
     * - 'first birth'
     */
    const birthDeathCheck = (change) => {
        return (
            (stallcheck.born !== change.born || stallcheck.died !== change.died) &&
            !(stallcheck.died === change.born && stallcheck.born == change.died)
        );
    };

    const firstBirthCheck = (change) => {
        return change.bornt !== stallcheck.bornt1 && change.bornt !== stallcheck.bornt2;
    };

    // hmm it can go every other.
    const isStalled = (change) => {
        if (birthDeathCheck(change) || firstBirthCheck(change)) {
            stallcheck = { ...change, count: 0, bornt1: change.bornt, bornt2: stallcheck.bornt1 };
            return false;
        }
        stallcheck.bornt2 = stallcheck.bornt1;
        stallcheck.bornt1 = change.bornt;
        stallcheck.count++;
        return stallcheck.count >= 15;
    };

    const tick = () => {
        for (let i = 0; i < +multi.value; i++) {
            const change = { born: 0, died: 0, bornt: '' };
            step(mode, one, two, w, h, mutateMin.value, mutateMax.value, change);
            [one, two] = [two, one];
            if (isStalled(change)) {
                one = makeBoard(w, h);
                two = makeBoard(w, h);
                seedBoard(one, w, h, +seed.value);
                stallcheck = newStall();
                break;
            }
        }
        // For Debugging:
        // scl.textContent = `Stalled ${stallcheck.born} ${stallcheck.died} ${stallcheck.count} ${stallcheck.bornt1} ${stallcheck.bornt2}`;
        draw(ctx, mode, margin, one, scale, w, h, +mdrop.value);
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
    parent.append(node);
    return node;
};

const config = document.createElement('div');
parent = config;
tops.append(config);

const scale = range('Scale', 1, 80, 40);
const size = range('Size', 200, 3000, 1000, 50);

const apply = button('Apply', () => {
    go();
    apply.disabled = true;
});
apply.style.marginTop = '8px';
apply.disabled = true;

parent.append(document.createElement('hr'));

scale.oninput = () => (apply.disabled = false);
size.oninput = () => (apply.disabled = false);

const mutateMin = range('Hue Mutation (min)', 0, 360, 0);
const mutateMax = range('Hue Mutation (max)', 0, 360, 30);
const speed = range('Step Speed (ms)', 30, 300, 30);
const seed = range('Initial Saturation', 0, 1, 0.3, 0.01);
const mdrop = range('Dropoff steps', 0, 200, 20);
const dropMin = range('Dropoff lightness (min)', 0, 50, 10);
const dropMax = range('Dropoff lightness (max)', 0, 50, 20);
const multi = range('Multi-step', 1, 20, 1);

const modes = {
    squares,
    triangles: tris(false),
    trianglesFlip: tris(false, true),
    trianglesOff: tris(true),
    circles: circles(),
    hexagons: hexagons(),
};

const modeNames = {
    squares: 'Standard',
    triangles: 'Offset Triangles',
    trianglesFlip: 'Triangles',
    trianglesOff: 'Stacked Triangles',
    circles: 'Circles',
    hexagons: 'Hexagons',
};

let mode = modes.triangles;

parent.append(document.createElement('hr'));

const modeButtons = {};
Object.keys(modes).forEach((key) => {
    modeButtons[key] = button(modeNames[key], () => {
        mode = modes[key];
        modeButtons[key].disabled = true;
        Object.keys(modeButtons).forEach((k) => {
            if (k !== key) {
                modeButtons[k].disabled = false;
            }
        });
        apply.disabled = false;
    });
    if (modes[key] === mode) {
        modeButtons[key].disabled = true;
    }
});
parent.append(document.createElement('hr'));
// const HEIGHT = 1000;

const configs = { size, scale, mutateMin, mutateMax, speed, seed, mdrop, dropMin, dropMax, multi };

const runConfig = (save) => {
    Object.keys(configs).forEach((key) => {
        if (save[key] != null) {
            configs[key].value = save[key];
            configs[key].onchange();
        }
    });
    console.log('running', save);
    if (save.mode && modes[save.mode]) {
        mode = modes[save.mode];
        Object.keys(modeButtons).forEach((k) => {
            modeButtons[k].disabled = k === save.mode;
        });
    }
    go();
};

const stepper = button('Step');
const pause = button('Pause', () => {
    if (ival.current == null) {
        ival.current = setInterval(() => stepper.onclick(), speed.value);
        pause.textContent = 'Pause';
    } else {
        clearInterval(ival.current);
        ival.current = null;
        pause.textContent = 'Play';
    }
});
parent.append(document.createElement('hr'));

const ival = { current: null };

const go = () => {
    clearInterval(ival);

    const margin = Math.min(100, +size.value / 10);
    const w = (((+size.value - margin * 2) / scale.value) * mode.xs) | 0;
    const h = ((+size.value - margin * 2) / scale.value) | 0;
    const FH = mode.h(h, +scale.value) + margin * 2;
    const FW = mode.w(w, +scale.value) + margin * 2;
    ctx.canvas.width = FW;
    ctx.canvas.height = FH;
    ctx.canvas.style.width = ctx.canvas.width / 2 + 'px';
    ctx.canvas.style.height = ctx.canvas.height / 2 + 'px';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // ctx.strokeStyle = 'white';
    // ctx.strokeRect(margin, margin, ctx.canvas.width - margin * 2 + 1, ctx.canvas.height - margin * 2 + 1);
    run(ctx, margin, ival, w, h, +scale.value);
};

const resizeIfNeeded = () => {};

ctx.canvas.onclick = () => go();

go();

const saver = document.createElement('canvas');
saver.width = 250;
saver.height = 250;
// document.body.append(saver);
// saver.style.visibility = 'hidden';

const save = button('Save Configuration', () => {
    const config = { id: Math.random().toString(32).slice(2) };
    Object.keys(configs).forEach((key) => {
        config[key] = +configs[key].value;
    });
    Object.keys(modeButtons).forEach((k) => {
        if (modeButtons[k].disabled) {
            config.mode = k;
        }
    });

    const sctx = saver.getContext('2d');

    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const scale = 250 / Math.max(ch, cw);
    const x = cw < ch ? ((ch - cw) / 2) * scale : 0;
    const y = ch < cw ? ((cw - ch) / 2) * scale : 0;

    sctx.fillRect(0, 0, saver.width, saver.height);
    sctx.drawImage(ctx.canvas, x, y, 250 - x * 2, 250 - y * 2);

    const href = saver.toDataURL();
    localStorage[JSON.stringify(config)] = href;
    saves.push({ config, href });

    saveSaves(saves);
    showSaves();
});

parent = document.body;

const scl = document.createElement('div');
document.body.append(scl);

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
const getSaveds = () => {
    const raw = localStorage[key];
    return raw ? JSON.parse(raw).map((config) => ({ config, href: localStorage[JSON.stringify(config)] })) : [];
};
const saveSaves = (saves) => {
    localStorage[key] = JSON.stringify(saves.map((c) => c.config));
    saves.forEach(({ config, href }) => {
        const k = JSON.stringify(config);
        if (!localStorage[k]) {
            localStorage[k] = href;
        }
    });
};

/** @type {Array<Record<string, number>>} */
let saves = getSaveds();

window.loadSaves = (data) => {
    saves = data;
    showSaves();
};

if (!localStorage[key]) {
    const script = document.createElement('script');
    script.src = './saves.js';
    document.body.append(script);
}

const showSaves = () => {
    savesNode.innerHTML = '';
    savesNode.style.display = 'flex';
    saves.forEach((save) => {
        const { config, href } = save;
        const node = document.createElement('div');
        node.style.position = 'relative';
        const img = document.createElement('img');
        img.src = href;
        img.style.width = '250px';
        img.style.height = '250px';
        img.style.cursor = 'pointer';
        node.append(img);
        const text = document.createElement('div');
        Object.assign(text.style, {
            whiteSpace: 'pre',
        });
        text.textContent = JSON.stringify(config);
        img.onclick = () => {
            runConfig(config);
        };
        const rm = document.createElement('button');
        rm.onclick = () => {
            const at = saves.indexOf(save);
            if (at !== -1) {
                saves.splice(at, 1);
                saveSaves(saves);
                showSaves();
            }
        };
        rm.innerHTML = '&times;';
        rm.onmouseover = () => (rm.style.background = 'pink');
        rm.onmouseleave = () => (rm.style.background = 'none');
        Object.assign(rm.style, {
            position: 'absolute',
            top: '0',
            right: '0',
            cursor: 'pointer',
            color: 'red',
            background: 'none',
            border: 'none',
        });
        node.append(rm);
        savesNode.append(node);
    });
};
showSaves();

const after = document.createElement('div');
document.body.append(after);
after.style.marginTop = '12px';

const sl = button('Export Saves', () => {
    const blob = new Blob([`loadSaves(${JSON.stringify(saves)});`], {
        type: 'text/javascript',
    });
    const a = document.createElement('a');
    a.download = `saves.js`;
    a.href = URL.createObjectURL(blob);
    document.body.append(a);
    a.click();
    a.remove();
});
after.append(sl);

after.append(
    button('Clear Saves', () => {
        if (!localStorage[key]) {
            localStorage[key] = '[]';
        } else {
            localStorage.removeItem(key);
            saves.forEach(({ config }) => {
                localStorage.removeItem(JSON.stringify(config));
            });
        }
        saves = [];
        showSaves();
    }),
);
