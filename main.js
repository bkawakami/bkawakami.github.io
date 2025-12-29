// Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-VL5JMCR888');

// AOS Animation
AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// ============================================
// CAUSTICS LIGHT EFFECT - Royal Blue
// Deep underwater light refraction
// ============================================

(function() {
    'use strict';

    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Vertex Shader
    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment Shader - Royal Blue Caustics
    const fsSource = `
        precision highp float;

        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_intensity;
        uniform float u_speed;
        uniform float u_chroma;
        uniform float u_opacity;
        uniform float u_scale;

        #define MAX_ITER 6

        float getCaustic(vec2 uv, float time, float offset) {
            vec2 p = mod(uv * u_scale, 10.0) - 20.0;
            vec2 i = vec2(p);
            float c = 1.0;
            float inten = .005 * u_intensity;

            for (int n = 0; n < MAX_ITER; n++) {
                float t = (time + offset) * (1.1 - (3.0 / float(n + 1)));
                i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
                c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
            }

            c /= float(MAX_ITER);
            c = 1.17 - pow(c, 1.4);
            return pow(abs(c), 8.0);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float aspect = u_resolution.x / u_resolution.y;
            vec2 centerUv = uv;
            uv.x *= aspect;

            // Mouse interaction
            vec2 mousePos = u_mouse / u_resolution.xy;
            mousePos.x *= aspect;
            float distToMouse = distance(uv, mousePos);
            uv += (uv - mousePos) * (0.06 / (distToMouse + 0.9));

            float time = u_time * u_speed;

            // Color channels - Royal Blue variations
            float r = getCaustic(uv, time, 0.0) * 0.25;
            float g = getCaustic(uv, time, u_chroma) * 0.5;
            float b = getCaustic(uv, time, u_chroma * 2.0) * 1.0;

            // Deep navy background
            vec3 background = vec3(0.004, 0.008, 0.03);

            // Vignette
            float vignette = 1.0 - length(centerUv - 0.5) * 1.0;
            vignette = max(vignette, 0.0);
            background *= vignette;

            // Light color
            vec3 lightColor = vec3(r, g, b) * u_intensity;

            // Blue glow around caustics
            float glow = (r + g + b) * 0.12;
            vec3 finalColor = background + lightColor + vec3(0.0, 0.15, 0.4) * glow;

            // Apply opacity for text readability
            float alpha = u_opacity * (0.3 + (r + g + b) * 0.4);

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vsSource, fsSource) {
        const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    gl.useProgram(program);

    // Fullscreen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uniforms = {
        time: gl.getUniformLocation(program, 'u_time'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        mouse: gl.getUniformLocation(program, 'u_mouse'),
        intensity: gl.getUniformLocation(program, 'u_intensity'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        chroma: gl.getUniformLocation(program, 'u_chroma'),
        opacity: gl.getUniformLocation(program, 'u_opacity'),
        scale: gl.getUniformLocation(program, 'u_scale')
    };

    // Settings
    const settings = {
        intensity: 3.0,    // Brilho máximo
        speed: 0.1,        // Agitação mínima
        chroma: 0.0,       // Difração mínima
        opacity: 1.0
    };

    // Mouse position
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
        // Use window size + extra to ensure full coverage
        const width = window.innerWidth + 40;
        const height = window.innerHeight + 40;
        const dpr = Math.min(window.devicePixelRatio, 2);

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function onMouseMove(e) {
        targetMouseX = e.clientX;
        targetMouseY = window.innerHeight - e.clientY;
    }

    function onTouchMove(e) {
        if (e.touches.length > 0) {
            targetMouseX = e.touches[0].clientX;
            targetMouseY = window.innerHeight - e.touches[0].clientY;
        }
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    resize();

    function render(time) {
        // Smooth mouse interpolation
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        // Update uniforms
        gl.uniform1f(uniforms.time, time * 0.001);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.mouse, mouseX * window.devicePixelRatio, mouseY * window.devicePixelRatio);
        gl.uniform1f(uniforms.intensity, settings.intensity);
        gl.uniform1f(uniforms.speed, settings.speed);
        gl.uniform1f(uniforms.chroma, settings.chroma);
        gl.uniform1f(uniforms.opacity, settings.opacity);

        // Scale based on screen size - smaller screens get slightly higher scale (smaller caustics)
        const screenWidth = window.innerWidth;
        const scale = screenWidth < 768 ? 7.0 : 5.0;
        gl.uniform1f(uniforms.scale, scale);

        // Clear and draw
        gl.clearColor(0, 0, 0, 0);
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
