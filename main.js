// Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-VL5JMCR888');

/* ============================================================
   brunokawakami.com — interações
   - Campo de dados do hero (canvas 2D, 3 engines + switcher)
   - Decode/scramble nos títulos
   - Reveals de scroll, contadores, botões magnéticos
   - Relógio ao vivo, barra de progresso, menu mobile
   ============================================================ */
(function () {
    'use strict';

    var CONFIG = {
        // 'aleatorio' | 'correntes' | 'profundidade' | 'terreno'
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
       Campo de dados do hero
       ======================================================== */
    var heroField = (function () {
        var teardown = null;
        var running = null;

        function boot(fx) {
            // Guarda contra loop duplicado: qualquer re-init encerra o anterior.
            if (teardown) { teardown(); teardown = null; }

            var canvas = document.getElementById('flow-canvas');
            if (!canvas) return;
            var host = canvas.parentElement;
            var ctx = canvas.getContext('2d');
            if (!ctx) return;

            running = fx;

            var density = CONFIG.density;
            var force = CONFIG.mouseForce;

            var W = 0, H = 0;
            var alive = true, visible = true, raf = null, resizeTimer = null, frames = 0;
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

                            // Wrap direcional: reforça o sentido do fluxo
                            if (p.x > W) { p.x = 0; p.y = H * (0.4 + Math.random() * 0.6); p.vx = 0; p.vy = 0; continue; }
                            if (p.y < 0) { p.y = H; p.x = W * Math.random() * 0.6; p.vx = 0; p.vy = 0; continue; }
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

                var zOf = function (i) { return 2.2 + (i / (rows - 1)) * 12.8; };
                var xOf = function (j) { return -9 + 18 * (j / (cols - 1)); };

                var base = function (X, Z, tt) {
                    return (Math.sin(X * 0.55 + tt * 0.9) * Math.cos(Z * 0.42 - tt * 0.6) * 0.45 +
                        Math.sin(X * 0.21 - tt * 0.5) * Math.sin(Z * 0.23 + tt * 0.8) * 0.85) * 0.62;
                };

                // Converte um ponto de tela na célula da malha mais próxima
                var gridFromScreen = function (mx, my) {
                    var fov = H * 0.95, cy = H * 0.30, camY = 2.0;
                    var bi = -1, bd = 1e9;
                    for (var i = 0; i < rows; i++) {
                        var dd = Math.abs((cy + camY * fov / zOf(i)) - my);
                        if (dd < bd) { bd = dd; bi = i; }
                    }
                    if (bd > 90) return null;
                    var Z = zOf(bi);
                    var X = (mx - W / 2) * Z / fov;
                    var j = Math.round((X + 9) / 18 * (cols - 1));
                    if (j < -4 || j > cols + 4) return null;
                    return { i: bi, j: j };
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
                                    if (dd < 9) {
                                        var k = Math.pow(1 - dd / 9, 2);
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
                            var depth = 1 - (rz - 2.2) / 12.8;
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

            function makeEngine() {
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
                var rebuild = !engine || w !== W || (w < 768) !== (W < 768);

                W = w; H = hh;
                var dpr = Math.min(2, window.devicePixelRatio || 1);
                canvas.width = Math.round(W * dpr);
                canvas.height = Math.round(H * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                if (rebuild) engine = makeEngine();
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, W, H);
            }

            function localPoint(e) {
                var r = host.getBoundingClientRect();
                return { x: e.clientX - r.left, y: e.clientY - r.top };
            }

            function onMove(e) {
                var p = localPoint(e);
                pointer.x = p.x; pointer.y = p.y;
            }
            function onLeave() { pointer.x = -9999; pointer.y = -9999; }
            function onDown(e) {
                var p = localPoint(e);
                pulses.push({ x: p.x, y: p.y, t: 0 });
                if (pulses.length > 6) pulses.shift();
                if (e.pointerType !== 'mouse') { pointer.x = p.x; pointer.y = p.y; }
            }
            function onUp(e) {
                // No toque não existe "hover": solta o ponteiro para o campo voltar ao repouso.
                if (e.pointerType !== 'mouse') onLeave();
            }

            host.addEventListener('pointermove', onMove);
            host.addEventListener('pointerleave', onLeave);
            host.addEventListener('pointerdown', onDown);
            host.addEventListener('pointerup', onUp);
            host.addEventListener('pointercancel', onUp);

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
                    if (visible && alive && raf === null) loop();
                }, { threshold: 0 });
                vio.observe(host);
            }

            function loop() {
                if (!alive) { raf = null; return; }
                if (!visible) { raf = null; return; }

                pointer.vx = pointer.x - (pointer.px < -999 ? pointer.x : pointer.px);
                pointer.vy = pointer.y - (pointer.py < -999 ? pointer.y : pointer.py);
                pointer.px = pointer.x;
                pointer.py = pointer.y;

                for (var q = pulses.length - 1; q >= 0; q--) {
                    pulses[q].t += 1;
                    if (pulses[q].t > 90) pulses.splice(q, 1);
                }

                if (engine) engine.step();
                frames++;

                // Com "reduzir movimento": compõe o campo e congela num quadro
                // parado, em vez de manter a animação rodando indefinidamente.
                if (reduceMotion && frames > 120) { alive = false; raf = null; return; }

                raf = requestAnimationFrame(loop);
            }

            resize();
            loop();

            teardown = function () {
                alive = false;
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                clearTimeout(resizeTimer);
                if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
                if (vio) vio.disconnect();
                host.removeEventListener('pointermove', onMove);
                host.removeEventListener('pointerleave', onLeave);
                host.removeEventListener('pointerdown', onDown);
                host.removeEventListener('pointerup', onUp);
                host.removeEventListener('pointercancel', onUp);
            };
        }

        return {
            boot: boot,
            current: function () { return running; }
        };
    })();

     // ── Efeito do hero ──────────────────────────────────────
     function initHero() {
         var canvas = document.getElementById('flow-canvas');
         if (!canvas) return;

         // "aleatorio" sorteia entre correntes e terreno a cada carregamento.
         var initial = CONFIG.heroEffect;
         if (initial === 'aleatorio' || !initial) {
             initial = Math.random() < 0.5 ? 'correntes' : 'terreno';
         }
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
