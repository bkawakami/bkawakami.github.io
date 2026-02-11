// Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-VL5JMCR888');

// AOS
AOS.init({
    duration: 800,
    once: true,
    offset: 80,
    easing: 'ease-out-cubic'
});

// ============================================
// TOPOGRAPHIC CONTOUR FIELD
// Domain-warped noise with contour extraction
// Organic flowing terrain lines in white on black
// ============================================
(function() {
    'use strict';

    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision highp float;

        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                f.y
            );
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            mat2 rot = mat2(0.866, 0.5, -0.5, 0.866);
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p = rot * p * 2.0 + vec2(100.0);
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float aspect = u_resolution.x / u_resolution.y;
            vec2 p = vec2(uv.x * aspect, uv.y);

            float t = u_time * 0.06;

            // Mouse
            vec2 m = u_mouse / u_resolution.xy;
            m.x *= aspect;
            vec2 dm = p - m;
            float md = length(dm);

            vec2 st = p * 2.5;

            // Domain warping - layer 1
            vec2 q = vec2(
                fbm(st + t),
                fbm(st + vec2(5.2, 1.3) + t * 0.7)
            );

            // Domain warping - layer 2
            vec2 r = vec2(
                fbm(st + 3.5 * q + vec2(1.7, 9.2) + t * 0.4),
                fbm(st + 3.5 * q + vec2(8.3, 2.8) + t * 0.25)
            );

            // Mouse warps the field
            float mi = 0.3 * exp(-md * 2.5);
            r += dm / (md + 0.1) * mi;

            // Final warped noise
            float f = fbm(st + 3.5 * r);

            // Contour extraction
            float band = fract(f * 18.0);
            float line = smoothstep(0.45, 0.5, abs(band - 0.5));

            // Brightness variation
            float brightness = 0.25 + 0.65 * f;

            // Ambient fill
            float fill = f * f * 0.05;

            float c = line * brightness + fill;

            // Subtle mouse glow
            c += 0.008 / (md + 0.06);

            // Vignette
            vec2 vc = uv - 0.5;
            c *= max(1.0 - dot(vc, vc) * 0.8, 0.0);

            gl_FragColor = vec4(vec3(c), 1.0);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    // Fullscreen quad
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    var u_time = gl.getUniformLocation(program, 'u_time');
    var u_resolution = gl.getUniformLocation(program, 'u_resolution');
    var u_mouse = gl.getUniformLocation(program, 'u_mouse');

    var dpr = 1;
    var mouseX = window.innerWidth * 0.7;
    var mouseY = window.innerHeight * 0.3;
    var targetMX = mouseX;
    var targetMY = mouseY;

    function resize() {
        dpr = Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1 : 1.25);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', function(e) {
        targetMX = e.clientX;
        targetMY = window.innerHeight - e.clientY;
    });
    window.addEventListener('touchmove', function(e) {
        if (e.touches.length > 0) {
            targetMX = e.touches[0].clientX;
            targetMY = window.innerHeight - e.touches[0].clientY;
        }
    }, { passive: true });

    function render(t) {
        mouseX += (targetMX - mouseX) * 0.03;
        mouseY += (targetMY - mouseY) * 0.03;

        gl.uniform1f(u_time, t * 0.001);
        gl.uniform2f(u_resolution, canvas.width, canvas.height);
        gl.uniform2f(u_mouse, mouseX * dpr, mouseY * dpr);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();

// Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,fr,it',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}
