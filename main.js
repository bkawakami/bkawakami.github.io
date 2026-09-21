// Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-VL5JMCR888');

/* ============================================================
   brunokawakami.com — interações
   - Campo de dados do hero (4 engines: 3 em canvas 2D + wormhole em WebGL)
   - Decode/scramble nos títulos
   - Reveals de scroll, contadores, botões magnéticos
   - Relógio ao vivo, barra de progresso, menu mobile
   ============================================================ */
(function () {
    'use strict';

    var CONFIG = {
        // 'aleatorio' | 'correntes' | 'profundidade' | 'terreno' | 'wormhole'
        // (para testar um específico sem editar: ?hero=wormhole na URL)
        heroEffect: 'aleatorio',
        density: 1,       // 0.4 – 2    (multiplica a contagem de partículas)
        mouseForce: 1,    // 0.2 – 3    (multiplica as forças do ponteiro)
     };

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    // ── Reveals de scroll ────────────────────────────────────
    function initReveals() {
        var els = document.querySelectorAll('[data-reveal]');
        if (!els.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            for (var i = 0; i < els.length; i++) els[i].classList.add('is-revealed');
            return;
        }

        // stagger entre irmãos diretos
        for (var j = 0; j < els.length; j++) {
            var el = els[j];
            var sibs = el.parentElement.querySelectorAll(':scope > [data-reveal]');
            var idx = Math.max(0, Array.prototype.indexOf.call(sibs, el));
            el.style.transitionDelay = (idx % 9) * 70 + 'ms';
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('is-revealed');
                io.unobserve(en.target);
            });
        }, { threshold: 0.12 });

        for (var k = 0; k < els.length; k++) io.observe(els[k]);
    }

    // ── Decode/scramble nos títulos ──────────────────────────
    // O texto final já ocupa o espaço (spans invisíveis), então a
    // animação não provoca reflow nem "pulo" de layout.
    function initScramble() {
        var titles = document.querySelectorAll('h1, h2');
        if (!titles.length || reduceMotion || !('IntersectionObserver' in window)) return;

        var CHARS = '!<>-_\\/[]{}—=+*#01';

        function esc(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function run(el) {
            var orig = el.textContent;
            if (!orig.trim()) return;

            el.style.height = el.offsetHeight + 'px';
            el.style.overflow = 'hidden';

            var total = Math.min(130, orig.length * 4 + 48);
            var win = 5;
            var frame = 0;

            (function tick() {
                frame++;
                var done = Math.floor((frame / total) * orig.length);
                if (frame % 5 === 0) {
                    var end = Math.min(orig.length, done + win);
                    var mid = '';
                    for (var i = done; i < end; i++) {
                        mid += orig[i] === ' ' ? ' ' : CHARS[(Math.random() * CHARS.length) | 0];
                    }
                    el.innerHTML = esc(orig.slice(0, done)) +
                        '<span style="opacity:0.45">' + esc(mid) + '</span>' +
                        '<span style="opacity:0">' + esc(orig.slice(end)) + '</span>';
                }
                if (frame < total) requestAnimationFrame(tick);
                else {
                    el.textContent = orig;
                    el.style.height = '';
                    el.style.overflow = '';
                }
            })();
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                io.unobserve(en.target);
                run(en.target);
            });
        }, { threshold: 0.5 });

        for (var i = 0; i < titles.length; i++) io.observe(titles[i]);
    }

    // ── Contadores dos números ───────────────────────────────
    function initCountups() {
        var els = document.querySelectorAll('[data-countup]');
        if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                io.unobserve(el);

                var orig = el.textContent;
                var m = orig.match(/\d+/);
                if (!m) return;

                var target = parseInt(m[0], 10);
                var start = performance.now();
                var dur = 1500;

                requestAnimationFrame(function tick(now) {
                    var t = Math.min(1, (now - start) / dur);
                    var e = 1 - Math.pow(1 - t, 4); // ease-out quart
                    el.textContent = orig.replace(m[0], String(Math.round(target * e)));
                    if (t < 1) requestAnimationFrame(tick);
                    else el.textContent = orig;
                });
            });
        }, { threshold: 0.6 });

        for (var i = 0; i < els.length; i++) io.observe(els[i]);
    }

    // ── Botões magnéticos ────────────────────────────────────
    function initMagnetic() {
        if (reduceMotion) return;
        var els = document.querySelectorAll('[data-magnetic]');

        for (var i = 0; i < els.length; i++) {
            (function (el) {
                el.addEventListener('pointermove', function (e) {
                    if (e.pointerType !== 'mouse') return;
                    var r = el.getBoundingClientRect();
                    var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
                    var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
                    el.style.transform = 'translate(' + (x * 6).toFixed(1) + 'px,' + (y * 4).toFixed(1) + 'px)';
                });
                el.addEventListener('pointerleave', function () {
                    el.style.transform = 'translate(0,0)';
                });
            })(els[i]);
        }
    }

    // ── Relógio ao vivo + barra de progresso de scroll ───────
    function initChrome() {
        var clock = document.getElementById('hero-clock');
        if (clock) {
            var tick = function () {
                clock.textContent = new Date().toLocaleTimeString('pt-BR') + ' BRT';
            };
            tick();
            setInterval(tick, 1000);
        }

        var bar = document.getElementById('nav-progress');
        if (!bar) return;

        var raf = null;
        var onScroll = function () {
            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = null;
                var d = document.documentElement;
                var p = Math.min(1, d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight));
                bar.style.transform = 'scaleX(' + p + ')';
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
    }

    // ── Menu mobile ──────────────────────────────────────────
    function initNav() {
        var toggle = document.getElementById('nav-toggle');
        var menu = document.getElementById('nav-menu');
        if (!toggle || !menu) return;

        var close = function () {
            menu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menu');
        };

        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        });

        menu.addEventListener('click', function (e) {
            if (e.target.closest('a')) close();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
        });
    }

    /* ========================================================
    /* ========================================================
       Campo de dados do hero
       ======================================================== */
    var heroField = (function () {
        var teardown = null;
        var running = null;

        function boot(fx) {
            // Guarda contra loop duplicado: qualquer re-init encerra o anterior.
            if (teardown) { teardown(); teardown = null; }

            var old = document.getElementById('flow-canvas');
            if (!old) return;
            var host = old.parentElement;

            // Um canvas só aceita um tipo de contexto ('2d' OU 'webgl') na vida
            // inteira. Trocar por um clone limpo deixa cada boot escolher o seu.
            var canvas = old.cloneNode(false);
            host.replaceChild(canvas, old);

            var ctx = null, gl = null;
            if (fx === 'wormhole') {
                try {
                    gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' })
                        || canvas.getContext('experimental-webgl');
                } catch (err) { gl = null; }
                if (!gl) fx = 'correntes';
            }
            if (!gl) {
                ctx = canvas.getContext('2d');
                if (!ctx) return;
            }

            running = fx;

            var density = CONFIG.density;
            var force = CONFIG.mouseForce;

            var W = 0, H = 0, DPR = 1;
            var alive = true, visible = true, raf = null, resizeTimer = null, frames = 0, lastNow = 0;
            var pointer = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0 };
            var pulses = [];
            var engine = null;

            var isMobile = function () { return W < 768; };

            // ── Engine 1 — CORRENTES ──────────────────────────
            // Flow field por soma de senos; o ponteiro vira um vórtice.
            function makeCorrentes() {
                var N = Math.round((isMobile() ? 700 : 1800) * density);
                var ps = [];
                for (var i = 0; i < N; i++) {
                    ps.push({
                        x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
                        sp: Math.random() * 1.3 + 0.45, br: Math.random() > 0.75
                    });
                }
                var t = 0;

                return {
                    step: function () {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = 'rgba(0,0,0,0.085)';
                        ctx.fillRect(0, 0, W, H);
                        t += 0.005;

                        var R = 260;
                        var dim = [], brt = [];

                        for (var i = 0; i < ps.length; i++) {
                            var p = ps[i];
                            var varr = Math.sin(p.x * 0.0032 + p.y * 0.0011 + t) * 0.85 +
                                Math.sin(p.x * 0.0009 - p.y * 0.0021 + t * 0.7) * 0.55 +
                                Math.sin((p.x + p.y) * 0.0006 + t * 1.3) * 0.3;
                            var ang = -0.6 + varr;

                            var dx = pointer.x - p.x, dy = pointer.y - p.y;
                            var d = Math.sqrt(dx * dx + dy * dy);
                            if (d < R && d > 0.001) {
                                var k = 1 - d / R;
                                var ta = Math.atan2(dy, dx) + Math.PI / 2;
                                p.vx += Math.cos(ta) * k * 0.42 * force + (dx / d) * k * 0.08 * force + pointer.vx * 0.014 * k;
                                p.vy += Math.sin(ta) * k * 0.42 * force + (dy / d) * k * 0.08 * force + pointer.vy * 0.014 * k;
                            }

                            for (var q = 0; q < pulses.length; q++) {
                                var pu = pulses[q];
                                var qx = p.x - pu.x, qy = p.y - pu.y;
                                var qd = Math.sqrt(qx * qx + qy * qy) || 1;
                                if (Math.abs(qd - pu.t * 7) < 50) {
                                    var s = (1 - pu.t / 90) * 2.4 * force;
                                    p.vx += (qx / qd) * s;
                                    p.vy += (qy / qd) * s;
                                }
                            }

                            p.vx += Math.cos(ang) * 0.1;
                            p.vy += Math.sin(ang) * 0.1;

                            var cs = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                            var mx = p.sp * (1 + (d < R ? 0.7 : 0));
                            if (cs > mx) { p.vx = p.vx / cs * mx; p.vy = p.vy / cs * mx; }

                            var ox = p.x, oy = p.y;
                            p.x += p.vx; p.y += p.vy;

                            // Wrap direcional: quem sai pela direita volta pela esquerda,
                            // quem sai por cima volta por baixo — ao longo da borda INTEIRA.
                            // Antes o renascimento ficava restrito a um trecho da borda e
                            // os cantos (topo-esquerda, base-direita) ficavam sem partícula,
                            // então o vórtice do ponteiro não tinha o que mover ali.
                            if (p.x > W) { p.x = 0; p.y = Math.random() * H; p.vx = 0; p.vy = 0; continue; }
                            if (p.y < 0) { p.y = H; p.x = Math.random() * W; p.vx = 0; p.vy = 0; continue; }
                            if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.5; }
                            if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy) * 0.5; }

                            if (Math.abs(p.x - ox) < 50 && Math.abs(p.y - oy) < 50) {
                                (p.br ? brt : dim).push(ox, oy, p.x, p.y);
                            }
                        }

                        ctx.lineWidth = 0.9;
                        ctx.strokeStyle = 'rgba(160,160,160,0.16)';
                        ctx.beginPath();
                        for (var a = 0; a < dim.length; a += 4) {
                            ctx.moveTo(dim[a], dim[a + 1]); ctx.lineTo(dim[a + 2], dim[a + 3]);
                        }
                        ctx.stroke();

                        ctx.globalCompositeOperation = 'lighter';
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                        ctx.beginPath();
                        for (var b = 0; b < brt.length; b += 4) {
                            ctx.moveTo(brt[b], brt[b + 1]); ctx.lineTo(brt[b + 2], brt[b + 3]);
                        }
                        ctx.stroke();

                        ctx.lineWidth = 1.3;
                        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                        ctx.beginPath();
                        for (var c = 0; c < brt.length; c += 4) {
                            ctx.moveTo(brt[c], brt[c + 1]); ctx.lineTo(brt[c + 2], brt[c + 3]);
                        }
                        ctx.stroke();
                        ctx.globalCompositeOperation = 'source-over';
                    }
                };
            }

            // ── Engine 2 — PROFUNDIDADE ───────────────────────
            // Campo de estrelas 3D com parallax de câmera e repulsão em screen-space.
            function makeProfundidade() {
                var N = Math.round((isMobile() ? 300 : 680) * density);
                var ps = [];
                for (var i = 0; i < N; i++) {
                    ps.push({
                        x: (Math.random() * 2 - 1) * 1.15,
                        y: (Math.random() * 2 - 1) * 0.8,
                        z: 0.12 + Math.random() * 1.5,
                        sz: 0.5 + Math.random(),
                        tw: Math.random() * 6.28,
                        vx: 0, vy: 0
                    });
                }
                var t = 0;
                var cam = { x: 0, y: 0 };

                var respawn = function (p) {
                    p.z = 1.62;
                    p.x = (Math.random() * 2 - 1) * 1.15;
                    p.y = (Math.random() * 2 - 1) * 0.8;
                    p.vx = 0; p.vy = 0;
                };

                return {
                    step: function () {
                        ctx.fillStyle = 'rgba(0,0,0,0.4)';
                        ctx.fillRect(0, 0, W, H);
                        t += 0.016;

                        var fov = H * 0.9;
                        var tx = pointer.x < -999 ? 0 : ((pointer.x / W) - 0.5) * 0.24;
                        var ty = pointer.y < -999 ? 0 : ((pointer.y / H) - 0.5) * 0.17;
                        cam.x += (tx - cam.x) * 0.045;
                        cam.y += (ty - cam.y) * 0.045;

                        for (var i = 0; i < ps.length; i++) {
                            var p = ps[i];
                            p.z -= 0.0022 * (0.6 + p.sz * 0.5);
                            if (p.z < 0.1) respawn(p);

                            var sx = W / 2 + (p.x - cam.x) * fov / p.z;
                            var sy = H / 2 + (p.y - cam.y) * fov / p.z;

                            var dx = sx - pointer.x, dy = sy - pointer.y;
                            var d = Math.sqrt(dx * dx + dy * dy);
                            if (d < 200 && d > 0.001) {
                                var k = Math.pow(1 - d / 200, 2);
                                p.vx += (dx / d) * k * 1.5 * force - pointer.vx * 0.02 * k;
                                p.vy += (dy / d) * k * 1.5 * force - pointer.vy * 0.02 * k;
                            }

                            for (var q = 0; q < pulses.length; q++) {
                                var pu = pulses[q];
                                var qx = sx - pu.x, qy = sy - pu.y;
                                var qd = Math.sqrt(qx * qx + qy * qy) || 1;
                                if (Math.abs(qd - pu.t * 8) < 60) {
                                    var s = (1 - pu.t / 90) * 3 * force;
                                    p.vx += (qx / qd) * s;
                                    p.vy += (qy / qd) * s;
                                }
                            }

                            p.vx *= 0.9; p.vy *= 0.9;
                            p.x += p.vx * p.z / fov;
                            p.y += p.vy * p.z / fov;

                            sx = W / 2 + (p.x - cam.x) * fov / p.z;
                            sy = H / 2 + (p.y - cam.y) * fov / p.z;
                            if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) { respawn(p); continue; }

                            var r = Math.min(5, Math.max(0.35, (1.15 / p.z) * p.sz));
                            var al = Math.min(1, Math.max(0.06, 1.68 - p.z)) * (0.55 + 0.45 * Math.sin(t * 2 + p.tw));

                            if (p.z < 0.45) {
                                ctx.fillStyle = 'rgba(255,255,255,' + (al * 0.12).toFixed(3) + ')';
                                ctx.beginPath(); ctx.arc(sx, sy, r * 2.4, 0, 6.284); ctx.fill();
                            }
                            ctx.fillStyle = 'rgba(255,255,255,' + (al * 0.85).toFixed(3) + ')';
                            ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.284); ctx.fill();
                        }
                    }
                };
            }

            // ── Engine 3 — TERRENO ────────────────────────────
            // Malha wireframe com física de mola por vértice.
            function makeTerreno() {
                var cols = isMobile() ? 56 : Math.round(96 * Math.min(1.4, density));
                var rows = isMobile() ? 26 : 36;
                var h = new Float32Array(cols * rows);
                var hv = new Float32Array(cols * rows);
                var t = 0;

                var Z_NEAR = 2.2, Z_SPAN = 12.8, RADIUS = 9;
                var zOf = function (i) { return Z_NEAR + (i / (rows - 1)) * Z_SPAN; };
                var xOf = function (j) { return -9 + 18 * (j / (cols - 1)); };

                var base = function (X, Z, tt) {
                    return (Math.sin(X * 0.55 + tt * 0.9) * Math.cos(Z * 0.42 - tt * 0.6) * 0.45 +
                        Math.sin(X * 0.21 - tt * 0.5) * Math.sin(Z * 0.23 + tt * 0.8) * 0.85) * 0.62;
                };

                // Converte um ponto de tela na posição (fracionária) da malha,
                // invertendo a projeção do plano do chão. Fora da malha a posição
                // continua válida até o raio de influência, então a elevação
                // se apaga suavemente nas bordas em vez de sumir de repente.
                var gridFromScreen = function (mx, my) {
                    if (mx < -999) return null;
                    var fov = H * 0.95, cy = H * 0.30, camY = 2.0;
                    var yFar = cy + camY * fov / (Z_NEAR + Z_SPAN);
                    var Z, fi;
                    if (my >= yFar) {
                        Z = camY * fov / Math.max(my - cy, 0.001);
                        fi = (Z - Z_NEAR) / Z_SPAN * (rows - 1);
                    } else {
                        // Acima do horizonte: some ao longo de 90px de "céu".
                        var up = yFar - my;
                        if (up > 90) return null;
                        Z = Z_NEAR + Z_SPAN;
                        fi = (rows - 1) + (up / 90) * (RADIUS / 2.2);
                    }
                    var X = (mx - W / 2) * Z / fov;
                    var fj = (X + 9) / 18 * (cols - 1);
                    if (fj < -RADIUS || fj > cols - 1 + RADIUS) return null;
                    if (fi < -RADIUS / 2.2 || fi > rows - 1 + RADIUS / 2.2) return null;
                    return { i: fi, j: fj };
                };

                return {
                    step: function () {
                        t += 0.016;
                        var fov = H * 0.95, cy = H * 0.30, camY = 2.0;

                        var g = gridFromScreen(pointer.x, pointer.y);
                        var stir = Math.min(30, Math.abs(pointer.vx) + Math.abs(pointer.vy));
                        for (var n = 0; n < pulses.length; n++) {
                            if (pulses[n].g === undefined) pulses[n].g = gridFromScreen(pulses[n].x, pulses[n].y);
                        }

                        for (var i = 0; i < rows; i++) {
                            var Z = zOf(i);
                            for (var j = 0; j < cols; j++) {
                                var idx = i * cols + j;
                                var target = base(xOf(j), Z, t);

                                if (g) {
                                    var dj = j - g.j, di = (i - g.i) * 2.2;
                                    var dd = Math.sqrt(dj * dj + di * di);
                                    if (dd < RADIUS) {
                                        var k = Math.pow(1 - dd / RADIUS, 2);
                                        target += k * (1.15 + stir * 0.05) * force;
                                    }
                                }

                                for (var q = 0; q < pulses.length; q++) {
                                    var pu = pulses[q];
                                    if (!pu.g) continue;
                                    var pj = j - pu.g.j, pi = (i - pu.g.i) * 2.2;
                                    var pd = Math.sqrt(pj * pj + pi * pi);
                                    if (Math.abs(pd - pu.t * 0.42) < 2.4) {
                                        hv[idx] += (1 - pu.t / 90) * 0.16 * force;
                                    }
                                }

                                hv[idx] += (target - h[idx]) * 0.09;
                                hv[idx] *= 0.86;
                                h[idx] += hv[idx];
                            }
                        }

                        // Render back-to-front
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, W, H);

                        var px = new Float32Array(cols), py = new Float32Array(cols);
                        for (var r = rows - 1; r >= 0; r--) {
                            var rz = zOf(r);
                            var depth = 1 - (rz - Z_NEAR) / Z_SPAN;
                            var a = 0.05 + Math.pow(depth, 1.6) * 0.5;

                            for (var c = 0; c < cols; c++) {
                                px[c] = W / 2 + xOf(c) * fov / rz;
                                py[c] = cy + (camY - h[r * cols + c]) * fov / rz;
                            }

                            ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(px[0], py[0]);
                            for (var c2 = 1; c2 < cols; c2++) ctx.lineTo(px[c2], py[c2]);
                            ctx.stroke();

                            if (r < rows - 1) {
                                var z2 = zOf(r + 1);
                                ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.35).toFixed(3) + ')';
                                ctx.beginPath();
                                for (var c3 = 0; c3 < cols; c3 += 6) {
                                    ctx.moveTo(px[c3], py[c3]);
                                    ctx.lineTo(
                                        W / 2 + xOf(c3) * fov / z2,
                                        cy + (camY - h[(r + 1) * cols + c3]) * fov / z2
                                    );
                                }
                                ctx.stroke();
                            }

                            if (depth > 0.72) {
                                ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')';
                                for (var c4 = 0; c4 < cols; c4 += 3) {
                                    ctx.fillRect(px[c4] - 1, py[c4] - 1, 2, 2);
                                }
                            }
                        }
                    }
                };
            }

            // ── Engine 4 — WORMHOLE ───────────────────────────
            // Túnel de partículas em WebGL: garganta estreita, boca aberta para
            // cima e disco espalhado embaixo. O ponteiro mira a câmera; o clique
            // dá um pulso de velocidade e brilho.
            function makeWormhole() {
                var TAU = Math.PI * 2;
                var smallScreen = Math.min(W, H) < 700;

                // Superfície em unidades do raio da garganta. w corre ao longo do
                // meridiano: w < 0 é a folha de baixo (vira disco), w > 0 a de cima (cone).
                var SHAPE = { TA: 1.9, TB: 0.35, F: 1.55, WTOP: 16, WBOT: 14, K: 0.3, LTOP: 0.9, LBOT: 4.5, X0: 1.25, XK: 0.28, BETA: 0.3 };

                var N_STRANDS = 340, N_SEG = 300, N_RINGS = 30, N_RSEG = 220;
                var N_PART = smallScreen ? 100000 : 170000;
                var NECK_SHARE = smallScreen ? 0.26 : 0.4;
                var N_STARS = 650;

                var COLOR = [1, 1, 1];
                var SPEED = 1, TWIST = 1, BRIGHT = 1, DIR = 1;
                var DENSITY = Math.min(1, Math.max(0.15, (smallScreen ? 0.7 : 0.8) * density));

                // ── random determinístico ──
                var seed = 20260917;
                var rand = function () {
                    seed = (seed + 0x6D2B79F5) | 0;
                    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                };
                var gauss = function () {
                    var u = 0, v = 0;
                    while (u === 0) u = rand();
                    while (v === 0) v = rand();
                    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
                };

                // As partículas viajam em u, com w = u + BETA * atan(u): correm na
                // garganta e relaxam nos flancos.
                var solveU = function (target) {
                    var u = target;
                    for (var i = 0; i < 40; i++) {
                        var f = u + SHAPE.BETA * Math.atan(u) - target;
                        u -= f / (1 + SHAPE.BETA / (1 + u * u));
                    }
                    return u;
                };
                var U_TOP = solveU(SHAPE.WTOP);
                var U_BOT = -solveU(-SHAPE.WBOT);
                var SPAN_U = U_TOP + U_BOT;
                var NECK_SPAN = SPAN_U / 4;
                var NECK_LO = solveU(-2.95);

                // ── geometria ──
                var GOLDEN = Math.PI * (3 - Math.sqrt(5));
                var strandTheta = new Float32Array(N_STRANDS);
                for (var si = 0; si < N_STRANDS; si++) strandTheta[si] = (si * GOLDEN) % TAU;

                var STRAND_VERTS = N_STRANDS * N_SEG * 2;
                var RING_VERTS = N_RINGS * N_RSEG * 2;
                var lineData = new Float32Array((STRAND_VERTS + RING_VERTS) * 4);
                var o = 0;
                var sMin = Math.asinh(-SHAPE.WBOT), sMax = Math.asinh(SHAPE.WTOP);
                for (var li = 0; li < N_STRANDS; li++) {
                    var th0 = strandTheta[li], sd0 = rand();
                    for (var lj = 0; lj < N_SEG; lj++) {
                        var w0 = Math.sinh(sMin + (sMax - sMin) * lj / N_SEG);
                        var w1 = Math.sinh(sMin + (sMax - sMin) * (lj + 1) / N_SEG);
                        lineData[o++] = w0; lineData[o++] = th0; lineData[o++] = sd0; lineData[o++] = 0;
                        lineData[o++] = w1; lineData[o++] = th0; lineData[o++] = sd0; lineData[o++] = 0;
                    }
                }
                for (var rk = 0; rk < N_RINGS; rk++) {
                    var ph = rk / N_RINGS, sd1 = rand();
                    for (var rm = 0; rm < N_RSEG; rm++) {
                        var a0 = TAU * rm / N_RSEG, a1 = TAU * (rm + 1) / N_RSEG;
                        lineData[o++] = a0; lineData[o++] = ph; lineData[o++] = sd1; lineData[o++] = 1;
                        lineData[o++] = a1; lineData[o++] = ph; lineData[o++] = sd1; lineData[o++] = 1;
                    }
                }

                var partData = new Float32Array(N_PART * 8);
                o = 0;
                for (var pi = 0; pi < N_PART; pi++) {
                    var onStrand = rand() < 0.7;
                    var th = onStrand ? strandTheta[(rand() * N_STRANDS) | 0] : rand() * TAU;
                    var q = rand();
                    var size, bright;
                    if (q < 0.9) { size = 0.9 + rand() * 0.7; bright = 0.5 + rand() * 0.4; }
                    else if (q < 0.99) { size = 1.7 + rand() * 0.8; bright = 0.7 + rand() * 0.3; }
                    else { size = 2.3 + rand() * 0.8; bright = 0.9 + rand() * 0.1; }
                    partData[o++] = th;
                    partData[o++] = rand();                           // fase ao longo do fluxo
                    partData[o++] = (4 + Math.floor(rand() * 9)) / 8; // velocidade 0.5–1.5 em oitavos, pra o relógio do fluxo dar a volta limpo
                    partData[o++] = rand();                           // semente de cintilação
                    partData[o++] = size;
                    partData[o++] = onStrand ? gauss() * 0.008 : gauss() * 0.04;
                    partData[o++] = bright;
                    partData[o++] = rand() < NECK_SHARE ? 1 : 0;     // intercalado: qualquer prefixo de densidade mantém a mistura
                }

                var starData = new Float32Array(N_STARS * 5);
                o = 0;
                for (var sti = 0; sti < N_STARS; sti++) {
                    var z = rand() * 2 - 1, a = rand() * TAU, rr = Math.sqrt(1 - z * z), R = 45 + rand() * 60;
                    starData[o++] = rr * Math.cos(a) * R;
                    starData[o++] = z * R * 0.7 + 4;
                    starData[o++] = rr * Math.sin(a) * R;
                    starData[o++] = 0.7 + rand() * 0.9;
                    starData[o++] = rand();
                }

                // ── shaders ──
                var SURFACE = [
                    'uniform float uTa;',
                    'uniform float uTb;',
                    'uniform float uF;',
                    'uniform float uK;',
                    'uniform float uLTop;',
                    'uniform float uLBot;',
                    'uniform float uX0;',
                    'uniform float uXK;',
                    'uniform float uWTop;',
                    'uniform float uWBot;',
                    'uniform float uRot;',
                    'uniform float uCamAz;',
                    'uniform mat4 uProj;',
                    'uniform mat4 uView;',
                    'float ash(float x) { float ax = abs(x); return sign(x) * log(ax + sqrt(ax * ax + 1.0)); }',
                    'float radiusAt(float w) { return sqrt(1.0 + w * w); }',
                    'float heightAt(float w) {',
                    '  if (w >= 0.0) return uTa * ash(w) + uTb * w;',
                    '  float c = uF / (uTa + uTb);',
                    '  return uF * w / sqrt(c * c + w * w);',
                    '}',
                    'float apron(float w, vec3 pos) {',
                    '  float r = length(pos.xz);',
                    '  float front = dot(pos.xz, vec2(sin(uCamAz), cos(uCamAz))) / max(r, 0.001);',
                    '  float low = 1.0 - smoothstep(-2.0, -1.25, w);',
                    '  return 1.0 - 0.8 * low * smoothstep(0.15, 0.85, front) * (1.0 - smoothstep(3.8, 7.0, r));',
                    '}',
                    'float outerDisk(float w) {',
                    '  return smoothstep(-uWBot, -uWBot + 1.8, w) * mix(0.4, 1.0, smoothstep(-uWBot + 1.8, -6.5, w));',
                    '}',
                    'float twistAt(float w) {',
                    '  float x = -ash(w);',
                    '  return uK * atan(w) + uLTop * ash(w) - (uLBot - uLTop) * uXK * log(1.0 + exp((x - uX0) / uXK));',
                    '}'
                ].join('\n');

                var PART_VS = [
                    'attribute vec4 aA;',
                    'attribute vec3 aB;',
                    'attribute float aC;',
                    SURFACE,
                    'uniform float uFlow;',
                    'uniform float uTime;',
                    'uniform float uPR;',
                    'uniform float uSizeK;',
                    'uniform float uGain;',
                    'uniform float uUTop;',
                    'uniform float uUBot;',
                    'uniform float uBeta;',
                    'uniform float uNeckLo;',
                    'uniform float uNeckSpan;',
                    'varying float vAlpha;',
                    'void main() {',
                    '  float span = mix(uUTop + uUBot, uNeckSpan, aC);',
                    '  float p = fract(aA.y + uFlow * aA.z / span);',
                    '  float u = mix(-uUBot, uNeckLo, aC) + p * span;',
                    '  float w = u + uBeta * atan(u);',
                    '  float r = radiusAt(w) * (1.0 + aB.y);',
                    '  float th = aA.x + twistAt(w) + uRot;',
                    '  vec3 pos = vec3(r * cos(th), heightAt(w) + aB.y * 1.5, r * sin(th));',
                    '  vec4 mv = uView * vec4(pos, 1.0);',
                    '  gl_Position = uProj * mv;',
                    '  float depth = max(-mv.z, 0.01);',
                    '  float px = aB.x * uPR * clamp(uSizeK / depth, 0.45, 1.35);',
                    '  float ends = outerDisk(w) * (1.0 - smoothstep(uWTop - 3.5, uWTop, w));',
                    '  ends *= mix(1.0, smoothstep(-2.6, -1.4, w) * (1.0 - smoothstep(1.0, 4.6, w)), aC);',
                    '  float nearFade = smoothstep(1.0, 4.0, depth) * apron(w, pos);',
                    '  float tw = 0.6 + 0.4 * sin(uTime * (0.7 + aA.w * 2.6) + aA.w * 60.0);',
                    '  gl_PointSize = clamp(px, 1.25, 5.0 * uPR);',
                    '  vAlpha = ends * nearFade * tw * aB.z * min(1.0, px / 1.25) * uGain;',
                    '}'
                ].join('\n');

                var LINE_VS = [
                    'attribute vec4 aL;',
                    SURFACE,
                    'uniform float uPulse;',
                    'uniform float uRing;',
                    'uniform float uGain;',
                    'varying float vAlpha;',
                    'void main() {',
                    '  vec3 pos;',
                    '  float a;',
                    '  if (aL.w < 0.5) {',
                    '    float w = aL.x;',
                    '    float r = radiusAt(w);',
                    '    float th = aL.y + twistAt(w) + uRot;',
                    '    pos = vec3(r * cos(th), heightAt(w), r * sin(th));',
                    '    float ends = outerDisk(w) * (1.0 - smoothstep(uWTop - 4.5, uWTop, w));',
                    '    float wave = max(0.0, 0.5 + 0.5 * sin(w * (0.45 + aL.z * 0.5) - uPulse + aL.z * 6.2831853));',
                    '    a = ends * (0.075 + 0.32 * pow(wave, 16.0)) * mix(0.85, 1.0, smoothstep(0.0, 2.5, abs(w))) * mix(0.75 * clamp(inversesqrt(max(uLBot / ' + SHAPE.LBOT.toFixed(2) + ', 0.01)), 0.7, 1.3), 1.0, smoothstep(-2.6, -1.3, w));',
                    '  } else {',
                    '    float p = fract(aL.y + uRing);',
                    '    float w = -9.0 + p * 7.8;',
                    '    float r = radiusAt(w);',
                    '    float th = aL.x + uRot;',
                    '    pos = vec3(r * cos(th), heightAt(w), r * sin(th));',
                    '    float fade = smoothstep(0.0, 0.3, p) * (1.0 - smoothstep(0.72, 1.0, p));',
                    '    a = fade * (0.07 + 0.05 * sin(aL.x * 3.0 + aL.z * 6.2831853));',
                    '  }',
                    '  vec4 mv = uView * vec4(pos, 1.0);',
                    '  gl_Position = uProj * mv;',
                    '  float wl = aL.w < 0.5 ? aL.x : -9.0 + fract(aL.y + uRing) * 7.8;',
                    '  vAlpha = a * smoothstep(1.0, 4.5, -mv.z) * apron(wl, pos) * uGain;',
                    '}'
                ].join('\n');

                var STAR_VS = [
                    'attribute vec3 aP;',
                    'attribute vec2 aS;',
                    'uniform mat4 uProj;',
                    'uniform mat4 uView;',
                    'uniform float uTime;',
                    'uniform float uPR;',
                    'uniform float uGain;',
                    'varying float vAlpha;',
                    'void main() {',
                    '  vec4 mv = uView * vec4(aP, 1.0);',
                    '  gl_Position = uProj * mv;',
                    '  gl_PointSize = max(aS.x * uPR, 1.0);',
                    '  vAlpha = (0.14 + 0.12 * sin(uTime * (0.25 + aS.y * 0.9) + aS.y * 40.0)) * uGain;',
                    '}'
                ].join('\n');

                var POINT_FS = [
                    'precision mediump float;',
                    'uniform vec3 uColor;',
                    'varying float vAlpha;',
                    'void main() {',
                    '  vec2 c = gl_PointCoord - 0.5;',
                    '  float d = 1.0 - dot(c, c) * 4.0;',
                    '  if (d <= 0.0) discard;',
                    '  gl_FragColor = vec4(uColor * (vAlpha * d), 1.0);',
                    '}'
                ].join('\n');

                var LINE_FS = [
                    'precision mediump float;',
                    'uniform vec3 uColor;',
                    'varying float vAlpha;',
                    'void main() {',
                    '  gl_FragColor = vec4(uColor * vAlpha, 1.0);',
                    '}'
                ].join('\n');

                function compile(type, src) {
                    var sh = gl.createShader(type);
                    gl.shaderSource(sh, src);
                    gl.compileShader(sh);
                    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
                    return sh;
                }
                function makeProgram(vs, fs, attribs) {
                    var p = gl.createProgram();
                    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
                    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
                    for (var i = 0; i < attribs.length; i++) gl.bindAttribLocation(p, i, attribs[i]);
                    gl.linkProgram(p);
                    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program link failed');
                    var u = {};
                    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
                    for (var k = 0; k < n; k++) {
                        var info = gl.getActiveUniform(p, k);
                        u[info.name] = gl.getUniformLocation(p, info.name);
                    }
                    return { p: p, u: u };
                }
                function makeBuffer(data) {
                    var b = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, b);
                    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
                    return b;
                }

                var progParts = makeProgram(PART_VS, POINT_FS, ['aA', 'aB', 'aC']);
                var progLines = makeProgram(LINE_VS, LINE_FS, ['aL']);
                var progStars = makeProgram(STAR_VS, POINT_FS, ['aP', 'aS']);

                var bufParts = makeBuffer(partData);
                var bufLines = makeBuffer(lineData);
                var bufStars = makeBuffer(starData);
                var LAYOUT_PARTS = { stride: 8, attrs: [[4, 0], [3, 4], [1, 7]] };
                var LAYOUT_LINES = { stride: 4, attrs: [[4, 0]] };
                var LAYOUT_STARS = { stride: 5, attrs: [[3, 0], [2, 3]] };

                function bindLayout(buf, layout) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                    var stride = layout.stride * 4;
                    for (var i = 0; i < 3; i++) {
                        var at = layout.attrs[i];
                        if (at) {
                            gl.enableVertexAttribArray(i);
                            gl.vertexAttribPointer(i, at[0], gl.FLOAT, false, stride, at[1] * 4);
                        } else {
                            gl.disableVertexAttribArray(i);
                        }
                    }
                }
                var u1 = function (prog, name, v) { var l = prog.u[name]; if (l) gl.uniform1f(l, v); };
                var u3 = function (prog, name, v) { var l = prog.u[name]; if (l) gl.uniform3f(l, v[0], v[1], v[2]); };
                var uM = function (prog, name, m) { var l = prog.u[name]; if (l) gl.uniformMatrix4fv(l, false, m); };

                // ── câmera ──
                var proj = new Float32Array(16), view = new Float32Array(16);
                function perspective(out, fovy, aspect, near, far) {
                    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
                    for (var i = 0; i < 16; i++) out[i] = 0;
                    out[0] = f / aspect;
                    out[5] = f;
                    out[10] = (far + near) * nf;
                    out[11] = -1;
                    out[14] = 2 * far * near * nf;
                }
                function lookAt(out, e, tg, up) {
                    var zx = e[0] - tg[0], zy = e[1] - tg[1], zz = e[2] - tg[2];
                    var len = Math.sqrt(zx * zx + zy * zy + zz * zz); zx /= len; zy /= len; zz /= len;
                    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
                    len = Math.sqrt(xx * xx + xy * xy + xz * xz); xx /= len; xy /= len; xz /= len;
                    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
                    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
                    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
                    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
                    out[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
                    out[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
                    out[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
                    out[15] = 1;
                }

                // Paisagem: perto, à altura da garganta, rasante ao disco.
                // Retrato: afastada e um pouco acima.
                var EL_BASE = -0.025;
                var elBase = EL_BASE;
                var cam = { az: 0, el: EL_BASE, tAz: 0, tEl: EL_BASE };
                var sizeK = 13;
                var clock = 0;

                function updateCamera(dt) {
                    var aspect = W / H;
                    var tall = Math.min(1, Math.max(0, (1.25 - aspect) / 0.75));
                    var fov = (38 + 14 * tall) * Math.PI / 180;
                    var halfH = Math.max(4.7, 5.3 / aspect);
                    var D = halfH / Math.tan(fov / 2);
                    var ty = (0.34 - 0.12 * tall) * halfH;
                    elBase = EL_BASE + 0.2 * tall;
                    var sway = reduceMotion ? 0 : Math.sin(clock * 0.09) * 0.05;
                    var k = 1 - Math.exp(-dt * 2.5);

                    // Ponteiro mira a câmera; sem ponteiro, ela volta ao repouso.
                    var aimed = pointer.x > -999;
                    cam.tAz = aimed ? ((pointer.x / W) * 2 - 1) * 0.22 * force : 0;
                    cam.tEl = aimed ? elBase + ((pointer.y / H) * 2 - 1) * 0.07 * force : elBase;

                    cam.az += (cam.tAz + sway - cam.az) * k;
                    cam.el += (cam.tEl - cam.el) * k;
                    var ce = Math.cos(cam.el);
                    lookAt(view, [Math.sin(cam.az) * ce * D, ty + Math.sin(cam.el) * D, Math.cos(cam.az) * ce * D], [0, ty, 0], [0, 1, 0]);
                    perspective(proj, fov, aspect, 0.1, 500);
                    sizeK = D;
                }

                gl.disable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.clearColor(0, 0, 0, 1);

                var mod = function (x, n) { return ((x % n) + n) % n; };
                var flow = 0, rot = 0, pulse = 0, ring = 0;
                var quality = 1, perfFrames = 0, perfTime = 0, perfDone = !!navigator.webdriver;
                var maxDpr = 2;

                function setSurface(prog) {
                    uM(prog, 'uProj', proj);
                    uM(prog, 'uView', view);
                    u1(prog, 'uTa', SHAPE.TA);
                    u1(prog, 'uTb', SHAPE.TB);
                    u1(prog, 'uF', SHAPE.F);
                    u1(prog, 'uK', SHAPE.K * TWIST);
                    u1(prog, 'uLTop', SHAPE.LTOP * TWIST);
                    u1(prog, 'uLBot', SHAPE.LBOT * TWIST);
                    u1(prog, 'uX0', SHAPE.X0);
                    u1(prog, 'uXK', SHAPE.XK);
                    u1(prog, 'uWTop', SHAPE.WTOP);
                    u1(prog, 'uWBot', SHAPE.WBOT);
                    u1(prog, 'uRot', rot);
                    u1(prog, 'uCamAz', cam.az);
                }

                function draw(gain) {
                    var PR = Math.min(DPR, maxDpr);
                    gl.clear(gl.COLOR_BUFFER_BIT);

                    gl.useProgram(progStars.p);
                    bindLayout(bufStars, LAYOUT_STARS);
                    uM(progStars, 'uProj', proj);
                    uM(progStars, 'uView', view);
                    u1(progStars, 'uTime', clock);
                    u1(progStars, 'uPR', PR);
                    u1(progStars, 'uGain', gain);
                    u3(progStars, 'uColor', COLOR);
                    gl.drawArrays(gl.POINTS, 0, N_STARS);

                    gl.useProgram(progLines.p);
                    bindLayout(bufLines, LAYOUT_LINES);
                    setSurface(progLines);
                    u1(progLines, 'uPulse', pulse);
                    u1(progLines, 'uRing', ring);
                    u1(progLines, 'uGain', gain * (0.6 + 0.4 * PR));
                    u3(progLines, 'uColor', COLOR);
                    var strands = Math.max(40, Math.round(N_STRANDS * (0.35 + 0.65 * DENSITY)));
                    gl.drawArrays(gl.LINES, 0, strands * N_SEG * 2);
                    gl.drawArrays(gl.LINES, STRAND_VERTS, RING_VERTS);

                    gl.useProgram(progParts.p);
                    bindLayout(bufParts, LAYOUT_PARTS);
                    setSurface(progParts);
                    u1(progParts, 'uFlow', flow);
                    u1(progParts, 'uTime', clock);
                    u1(progParts, 'uPR', PR);
                    u1(progParts, 'uSizeK', sizeK);
                    u1(progParts, 'uGain', gain);
                    u1(progParts, 'uUTop', U_TOP);
                    u1(progParts, 'uUBot', U_BOT);
                    u1(progParts, 'uBeta', SHAPE.BETA);
                    u1(progParts, 'uNeckLo', NECK_LO);
                    u1(progParts, 'uNeckSpan', NECK_SPAN);
                    u3(progParts, 'uColor', COLOR);
                    gl.drawArrays(gl.POINTS, 0, Math.max(1, Math.round(N_PART * DENSITY * quality)));
                }

                return {
                    // O buffer de desenho em WebGL segue o dpr limitado pela
                    // auto-qualidade; a viewport acompanha o tamanho do canvas.
                    dpr: function () { return Math.min(DPR, maxDpr); },
                    resize: function () { gl.viewport(0, 0, canvas.width, canvas.height); },
                    step: function (dt) {
                        if (!perfDone) {
                            perfFrames++;
                            if (perfFrames > 30) perfTime += dt;
                            if (perfFrames === 150) {
                                var avg = perfTime / 120;
                                if (avg > 1 / 38) { quality = 0.6; maxDpr = 1.5; }
                                if (avg > 1 / 24) { quality = 0.4; maxDpr = 1.25; }
                                perfDone = true;
                                if (maxDpr < DPR) resize();
                            }
                        }

                        // Cliques viram um sopro: acelera o fluxo e acende o túnel.
                        var kick = 0;
                        for (var q = 0; q < pulses.length; q++) kick = Math.max(kick, 1 - pulses[q].t / 90);
                        kick = kick * kick * force;

                        var m = (reduceMotion ? 0.25 : 1) * SPEED * (1 + kick * 1.6);
                        flow = mod(flow + dt * 0.36 * m * DIR, SPAN_U * 8);
                        rot = mod(rot + dt * 0.06 * m, TAU);
                        pulse = mod(pulse + dt * 1.4 * m * DIR, TAU);
                        ring = mod(ring + dt * 0.03 * m * DIR, 1);
                        clock = (clock + dt) % 3600;

                        updateCamera(dt);
                        draw(BRIGHT * (1 + kick * 0.35));
                    },
                    dispose: function () {
                        var ext = gl.getExtension('WEBGL_lose_context');
                        if (ext) ext.loseContext();
                    }
                };
            }

            function makeEngine() {
                if (fx === 'wormhole') {
                    try { return makeWormhole(); } catch (err) {
                        // Shader recusado (driver antigo): cai para o 2D.
                        if (window.console && console.warn) console.warn('wormhole indisponível', err);
                        return null;
                    }
                }
                if (fx === 'profundidade') return makeProfundidade();
                if (fx === 'terreno') return makeTerreno();
                return makeCorrentes();
            }

            function resize() {
                var w = host.clientWidth;
                var hh = host.clientHeight;
                if (!w || !hh) return;

                // Só reconstrói o engine quando a largura (ou o breakpoint) muda.
                // Na vertical, o que muda é a barra de endereço do mobile — e
                // reiniciar ali faria as partículas piscarem a cada scroll.
                // O wormhole nunca reconstrói: as partículas vivem na GPU e a
                // câmera se refaz a cada frame a partir de W/H.
                var rebuild = !engine || (!gl && (w !== W || (w < 768) !== (W < 768)));

                W = w; H = hh;
                DPR = Math.min(2, window.devicePixelRatio || 1);
                var dpr = engine && engine.dpr ? engine.dpr() : DPR;
                var bw = Math.round(W * dpr), bh = Math.round(H * dpr);
                if (canvas.width !== bw || canvas.height !== bh) {
                    canvas.width = bw;
                    canvas.height = bh;
                }

                if (rebuild) {
                    engine = makeEngine();
                    if (!engine) {
                        // O WebGL abriu mas o shader não compilou: reinicia em 2D.
                        alive = false;
                        boot('correntes');
                        return;
                    }
                }

                if (gl) {
                    engine.resize();
                } else {
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, W, H);
                }
            }

            // ── Ponteiro ──────────────────────────────────────
            // Escuta na janela, não só no host: a nav fixa cobre o topo do
            // hero e os botões/texto ficam por cima do canvas — com o listener
            // preso ao host, o ponteiro "sumia" nessas regiões e o campo
            // ficava parado nas bordas. Aqui ele só é considerado fora quando
            // realmente sai do retângulo do hero.
            var dragging = false;

            function localPoint(e) {
                var r = host.getBoundingClientRect();
                return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
            }
            function inside(p) {
                return p.x >= 0 && p.y >= 0 && p.x <= p.w && p.y <= p.h;
            }
            function setPointer(p) { pointer.x = p.x; pointer.y = p.y; }
            function onLeave() { pointer.x = -9999; pointer.y = -9999; }

            function onMove(e) {
                if (e.pointerType === 'mouse') {
                    var p = localPoint(e);
                    if (inside(p)) setPointer(p); else onLeave();
                } else if (dragging) {
                    setPointer(localPoint(e));
                }
            }
            function onDown(e) {
                var p = localPoint(e);
                pulses.push({ x: p.x, y: p.y, t: 0 });
                if (pulses.length > 6) pulses.shift();
                if (e.pointerType !== 'mouse') { dragging = true; setPointer(p); }
            }
            function onUp(e) {
                // No toque não existe "hover": solta o ponteiro para o campo voltar ao repouso.
                if (e.pointerType !== 'mouse') { dragging = false; onLeave(); }
            }
            function onWindowLeave() { onLeave(); }

            host.addEventListener('pointerdown', onDown);
            window.addEventListener('pointermove', onMove, { passive: true });
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
            document.documentElement.addEventListener('mouseleave', onWindowLeave);

            var ro = null;
            if ('ResizeObserver' in window) {
                ro = new ResizeObserver(function () {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(resize, 120);
                });
                ro.observe(host);
            } else {
                window.addEventListener('resize', resize);
            }

            var vio = null;
            if ('IntersectionObserver' in window) {
                vio = new IntersectionObserver(function (en) {
                    visible = en[0].isIntersecting;
                    // `raf === null` garante que nunca existam dois loops (o efeito
                    // "acelerado" clássico de re-inicializar sem cancelar o anterior).
                    if (visible && alive && raf === null) { lastNow = 0; loop(); }
                }, { threshold: 0 });
                vio.observe(host);
            }

            function loop(now) {
                if (!alive) { raf = null; return; }
                if (!visible) { raf = null; return; }

                var dt = lastNow && now ? Math.min((now - lastNow) / 1000, 0.05) : 1 / 60;
                if (now) lastNow = now;

                pointer.vx = pointer.x - (pointer.px < -999 ? pointer.x : pointer.px);
                pointer.vy = pointer.y - (pointer.py < -999 ? pointer.y : pointer.py);
                pointer.px = pointer.x;
                pointer.py = pointer.y;

                for (var q = pulses.length - 1; q >= 0; q--) {
                    pulses[q].t += 1;
                    if (pulses[q].t > 90) pulses.splice(q, 1);
                }

                if (engine) engine.step(dt);
                frames++;

                // Com "reduzir movimento": compõe o campo e congela num quadro
                // parado, em vez de manter a animação rodando indefinidamente.
                if (reduceMotion && frames > 120) { alive = false; raf = null; return; }

                raf = requestAnimationFrame(loop);
            }

            teardown = function () {
                alive = false;
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                clearTimeout(resizeTimer);
                if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
                if (vio) vio.disconnect();
                host.removeEventListener('pointerdown', onDown);
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                document.documentElement.removeEventListener('mouseleave', onWindowLeave);
                if (engine && engine.dispose) engine.dispose();
            };

            resize();
            if (!alive) return; // o resize() já reiniciou em outro engine
            loop();
        }

        return {
            boot: boot,
            current: function () { return running; }
        };
    })();

     // ── Efeito do hero ──────────────────────────────────────
     var HERO_POOL = ['correntes', 'terreno', 'wormhole'];
     function initHero() {
         var canvas = document.getElementById('flow-canvas');
         if (!canvas) return;

         // "aleatorio" sorteia entre correntes, terreno e wormhole a cada carregamento.
         var initial = CONFIG.heroEffect;
         if (initial === 'aleatorio' || !initial) {
             initial = HERO_POOL[Math.floor(Math.random() * HERO_POOL.length)];
         }
         // ?hero=<nome> força um engine específico (útil para conferir cada um).
         var forced = (window.location.search.match(/[?&]hero=([a-z]+)/) || [])[1];
         if (forced && (HERO_POOL.indexOf(forced) >= 0 || forced === 'profundidade')) initial = forced;
         heroField.boot(initial);
     }

    ready(function () {
        initNav();
        initChrome();
        initReveals();
        initScramble();
        initCountups();
        initMagnetic();
        initHero();
    });
})();
