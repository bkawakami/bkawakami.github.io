window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-VL5JMCR888');

AOS.init({
    duration: 1000,
    once: true,
    offset: 100
});

// ============================================
// LIQUID METAL SURFACE EFFECT
// Premium, elegant, and subtly interactive
// ============================================

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Surface settings
        resolution: 128, // Grid resolution (will be reduced on mobile)
        waveSpeed: 0.0004,
        waveAmplitude: 12,
        viscosity: 0.97, // High viscosity for mercury-like movement

        // Mouse interaction
        mouseInfluenceRadius: 0.25,
        mouseRippleStrength: 8,
        mouseRippleDecay: 0.94,

        // Visual
        metalness: 0.95,
        roughness: 0.08,
        envMapIntensity: 1.2,

        // Colors (matching site palette)
        colors: {
            primary: 0x5B8DEE,
            accent: 0x48C9B0,
            highlight: 0x8B5CF6,
            dark: 0x0A0B0F
        }
    };

    // State
    let scene, camera, renderer;
    let metalSurface, surfaceGeometry;
    let mousePos = new THREE.Vector2(9999, 9999);
    let targetMousePos = new THREE.Vector2(9999, 9999);
    let prevMousePos = new THREE.Vector2(9999, 9999);
    let mouseVelocity = new THREE.Vector2(0, 0);
    let time = 0;
    let ripples = [];
    let scrollY = 0;
    let targetScrollY = 0;
    let isMobile = false;

    // Simplex noise for organic waves
    const SimplexNoise = (function() {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const F3 = 1/3;
        const G3 = 1/6;
        const grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];

        let perm = new Array(512);
        let gradP = new Array(512);

        function seed(s) {
            if(s > 0 && s < 1) s *= 65536;
            s = Math.floor(s);
            if(s < 256) s |= s << 8;
            const p = [];
            for(let i = 0; i < 256; i++) {
                let v;
                if(i & 1) v = (i ^ (s & 255));
                else v = (i ^ ((s>>8) & 255));
                p[i] = v;
            }
            for(let i = 0; i < 512; i++) {
                perm[i] = p[i & 255];
                gradP[i] = grad3[perm[i] % 12];
            }
        }
        seed(Math.random() * 65536);

        function dot2(g, x, y) { return g[0]*x + g[1]*y; }
        function dot3(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }

        return {
            noise2D: function(x, y) {
                let s = (x + y) * F2;
                let i = Math.floor(x + s);
                let j = Math.floor(y + s);
                let t = (i + j) * G2;
                let X0 = i - t;
                let Y0 = j - t;
                let x0 = x - X0;
                let y0 = y - Y0;
                let i1, j1;
                if(x0 > y0) { i1 = 1; j1 = 0; }
                else { i1 = 0; j1 = 1; }
                let x1 = x0 - i1 + G2;
                let y1 = y0 - j1 + G2;
                let x2 = x0 - 1 + 2*G2;
                let y2 = y0 - 1 + 2*G2;
                i &= 255;
                j &= 255;
                let gi0 = gradP[i + perm[j]];
                let gi1 = gradP[i + i1 + perm[j + j1]];
                let gi2 = gradP[i + 1 + perm[j + 1]];
                let t0 = 0.5 - x0*x0 - y0*y0;
                let n0 = t0 < 0 ? 0 : Math.pow(t0, 4) * dot2(gi0, x0, y0);
                let t1 = 0.5 - x1*x1 - y1*y1;
                let n1 = t1 < 0 ? 0 : Math.pow(t1, 4) * dot2(gi1, x1, y1);
                let t2 = 0.5 - x2*x2 - y2*y2;
                let n2 = t2 < 0 ? 0 : Math.pow(t2, 4) * dot2(gi2, x2, y2);
                return 70 * (n0 + n1 + n2);
            },
            noise3D: function(x, y, z) {
                let s = (x + y + z) * F3;
                let i = Math.floor(x + s);
                let j = Math.floor(y + s);
                let k = Math.floor(z + s);
                let t = (i + j + k) * G3;
                let X0 = i - t;
                let Y0 = j - t;
                let Z0 = k - t;
                let x0 = x - X0;
                let y0 = y - Y0;
                let z0 = z - Z0;
                let i1, j1, k1, i2, j2, k2;
                if(x0 >= y0) {
                    if(y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
                    else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
                    else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
                } else {
                    if(y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
                    else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
                    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
                }
                let x1 = x0 - i1 + G3;
                let y1 = y0 - j1 + G3;
                let z1 = z0 - k1 + G3;
                let x2 = x0 - i2 + 2*G3;
                let y2 = y0 - j2 + 2*G3;
                let z2 = z0 - k2 + 2*G3;
                let x3 = x0 - 1 + 3*G3;
                let y3 = y0 - 1 + 3*G3;
                let z3 = z0 - 1 + 3*G3;
                i &= 255;
                j &= 255;
                k &= 255;
                let gi0 = gradP[i + perm[j + perm[k]]];
                let gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
                let gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
                let gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];
                let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
                let n0 = t0 < 0 ? 0 : Math.pow(t0, 4) * dot3(gi0, x0, y0, z0);
                let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
                let n1 = t1 < 0 ? 0 : Math.pow(t1, 4) * dot3(gi1, x1, y1, z1);
                let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
                let n2 = t2 < 0 ? 0 : Math.pow(t2, 4) * dot3(gi2, x2, y2, z2);
                let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
                let n3 = t3 < 0 ? 0 : Math.pow(t3, 4) * dot3(gi3, x3, y3, z3);
                return 32 * (n0 + n1 + n2 + n3);
            }
        };
    })();

    const noise = SimplexNoise;

    // Ripple class for mouse interactions
    class Ripple {
        constructor(x, y, strength) {
            this.x = x;
            this.y = y;
            this.strength = strength;
            this.radius = 0;
            this.maxRadius = 0.6;
            this.speed = 0.015;
            this.decay = CONFIG.mouseRippleDecay;
        }

        update() {
            this.radius += this.speed;
            this.strength *= this.decay;
            return this.strength > 0.01 && this.radius < this.maxRadius;
        }

        getDisplacement(x, y) {
            const dx = x - this.x;
            const dy = y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ringDist = Math.abs(dist - this.radius);
            const ringWidth = 0.08;

            if (ringDist < ringWidth) {
                const wave = Math.cos((ringDist / ringWidth) * Math.PI * 0.5);
                return wave * this.strength * (1 - this.radius / this.maxRadius);
            }
            return 0;
        }
    }

    function init() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        // Detect mobile
        isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Adjust resolution for mobile
        if (isMobile) {
            CONFIG.resolution = 64;
            CONFIG.waveAmplitude = 8;
        }

        // Scene setup
        scene = new THREE.Scene();

        // Camera - orthographic-like perspective for flat surface
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 80, 120);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        // Create environment map for reflections
        createEnvironmentMap();

        // Create metal surface
        createMetalSurface();

        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        // Add directional lights for reflections
        const light1 = new THREE.DirectionalLight(0x5B8DEE, 0.8);
        light1.position.set(5, 10, 5);
        scene.add(light1);

        const light2 = new THREE.DirectionalLight(0x48C9B0, 0.5);
        light2.position.set(-5, 8, -5);
        scene.add(light2);

        const light3 = new THREE.DirectionalLight(0x8B5CF6, 0.3);
        light3.position.set(0, 5, 10);
        scene.add(light3);

        // Events
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });

        // Start animation
        animate();
    }

    function createEnvironmentMap() {
        // Create a procedural environment map with site colors
        const size = 256;
        const data = new Uint8Array(size * size * 4);

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = (i * size + j) * 4;

                // Normalized coordinates
                const u = j / size;
                const v = i / size;

                // Create gradient with site colors
                const angle = Math.atan2(v - 0.5, u - 0.5);
                const dist = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2);

                // Mix colors based on position
                let r, g, b;

                // Dark base
                const baseR = 10, baseG = 11, baseB = 15;

                // Primary color (blue) #5B8DEE
                const primaryR = 91, primaryG = 141, primaryB = 238;

                // Accent color (teal) #48C9B0
                const accentR = 72, accentG = 201, accentB = 176;

                // Highlight (purple) #8B5CF6
                const highlightR = 139, highlightG = 92, highlightB = 246;

                // Create subtle color bands
                const band1 = Math.sin(angle * 2 + Math.PI) * 0.5 + 0.5;
                const band2 = Math.sin(angle * 3) * 0.5 + 0.5;
                const intensity = Math.pow(1 - dist, 2) * 0.4;

                r = baseR + (primaryR * band1 + accentR * band2) * intensity * 0.15;
                g = baseG + (primaryG * band1 + accentG * band2) * intensity * 0.15;
                b = baseB + (primaryB * band1 + accentB * band2) * intensity * 0.15;

                // Add highlights
                const highlight = Math.pow(Math.max(0, Math.sin(angle * 5 + v * 10)), 8) * intensity;
                r += highlightR * highlight * 0.1;
                g += highlightG * highlight * 0.1;
                b += highlightB * highlight * 0.1;

                data[idx] = Math.min(255, r);
                data[idx + 1] = Math.min(255, g);
                data[idx + 2] = Math.min(255, b);
                data[idx + 3] = 255;
            }
        }

        const envTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        envTexture.needsUpdate = true;

        scene.environment = envTexture;
    }

    function createMetalSurface() {
        // Create plane geometry with high subdivision
        const width = 300;
        const height = 200;
        const res = CONFIG.resolution;

        surfaceGeometry = new THREE.PlaneGeometry(width, height, res, res);
        surfaceGeometry.rotateX(-Math.PI / 2.2); // Slight angle for depth

        // Store original positions
        const positions = surfaceGeometry.attributes.position;
        surfaceGeometry.userData.originalPositions = new Float32Array(positions.array);

        // Create material with metallic properties
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1b23, // Dark gunmetal base
            metalness: CONFIG.metalness,
            roughness: CONFIG.roughness,
            envMapIntensity: CONFIG.envMapIntensity,
            side: THREE.DoubleSide,
        });

        // Custom shader modifications for enhanced reflections
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uMousePos = { value: new THREE.Vector2(0.5, 0.5) };
            shader.uniforms.uPrimaryColor = { value: new THREE.Color(CONFIG.colors.primary) };
            shader.uniforms.uAccentColor = { value: new THREE.Color(CONFIG.colors.accent) };
            shader.uniforms.uHighlightColor = { value: new THREE.Color(CONFIG.colors.highlight) };

            // Store reference for animation
            metalSurface.userData.shader = shader;

            // Modify fragment shader for color effects
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
                #include <common>
                uniform float uTime;
                uniform vec2 uMousePos;
                uniform vec3 uPrimaryColor;
                uniform vec3 uAccentColor;
                uniform vec3 uHighlightColor;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>

                // Add subtle color variation based on view angle and position
                vec3 viewDir = normalize(vViewPosition);
                float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), -viewDir)), 3.0);

                // Blend colors based on fresnel and position
                vec3 colorMix = mix(uPrimaryColor, uAccentColor, vUv.x * 0.5 + 0.25);
                colorMix = mix(colorMix, uHighlightColor, fresnel * 0.3);

                // Mouse proximity effect
                float mouseDist = distance(vUv, uMousePos);
                float mouseEffect = smoothstep(0.4, 0.0, mouseDist);
                colorMix = mix(colorMix, uHighlightColor, mouseEffect * 0.4);

                // Apply to diffuse
                diffuseColor.rgb += colorMix * fresnel * 0.15;
                diffuseColor.rgb += colorMix * mouseEffect * 0.1;
                `
            );
        };

        metalSurface = new THREE.Mesh(surfaceGeometry, material);
        metalSurface.position.y = -30;
        scene.add(metalSurface);
    }

    function updateSurface() {
        if (!surfaceGeometry) return;

        const positions = surfaceGeometry.attributes.position;
        const original = surfaceGeometry.userData.originalPositions;
        const count = positions.count;

        const width = 300;
        const height = 200;

        for (let i = 0; i < count; i++) {
            const ox = original[i * 3];
            const oy = original[i * 3 + 1];
            const oz = original[i * 3 + 2];

            // Normalized position (0 to 1)
            const nx = (ox + width / 2) / width;
            const ny = (oy + height / 2) / height;

            // Base organic waves using 3D noise
            let displacement = 0;

            // Large slow waves
            displacement += noise.noise3D(nx * 2, ny * 2, time * CONFIG.waveSpeed) * CONFIG.waveAmplitude;

            // Medium waves
            displacement += noise.noise3D(nx * 4 + 100, ny * 4, time * CONFIG.waveSpeed * 1.5) * CONFIG.waveAmplitude * 0.5;

            // Small detail waves
            displacement += noise.noise3D(nx * 8 + 200, ny * 8, time * CONFIG.waveSpeed * 2) * CONFIG.waveAmplitude * 0.2;

            // Mouse proximity effect - subtle depression
            const dx = nx - (mousePos.x * 0.5 + 0.5);
            const dy = ny - (mousePos.y * 0.5 + 0.5);
            const mouseDist = Math.sqrt(dx * dx + dy * dy);

            if (mouseDist < CONFIG.mouseInfluenceRadius) {
                const influence = 1 - (mouseDist / CONFIG.mouseInfluenceRadius);
                const smoothInfluence = influence * influence * (3 - 2 * influence); // Smoothstep
                displacement -= smoothInfluence * 8; // Subtle depression under cursor
            }

            // Apply ripples
            for (const ripple of ripples) {
                displacement += ripple.getDisplacement(nx, ny) * CONFIG.mouseRippleStrength;
            }

            // Scroll parallax - subtle tilt
            const scrollEffect = scrollY * 0.00005;
            displacement += (ny - 0.5) * scrollEffect * 20;

            // Apply displacement (z-axis in rotated geometry is up)
            positions.setZ(i, oz + displacement);
        }

        positions.needsUpdate = true;
        surfaceGeometry.computeVertexNormals();
    }

    function onMouseMove(event) {
        prevMousePos.copy(targetMousePos);
        targetMousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        targetMousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Calculate velocity for ripple strength
        mouseVelocity.x = targetMousePos.x - prevMousePos.x;
        mouseVelocity.y = targetMousePos.y - prevMousePos.y;

        // Create ripple on significant movement
        const velocity = mouseVelocity.length();
        if (velocity > 0.01) {
            const rippleStrength = Math.min(velocity * 3, 1);
            ripples.push(new Ripple(
                targetMousePos.x * 0.5 + 0.5,
                targetMousePos.y * 0.5 + 0.5,
                rippleStrength
            ));

            // Limit ripple count for performance
            if (ripples.length > 10) {
                ripples.shift();
            }
        }
    }

    function onTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            targetMousePos.x = (touch.clientX / window.innerWidth) * 2 - 1;
            targetMousePos.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            // Create ripple on touch
            ripples.push(new Ripple(
                targetMousePos.x * 0.5 + 0.5,
                targetMousePos.y * 0.5 + 0.5,
                0.8
            ));
        }
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            prevMousePos.copy(targetMousePos);
            const touch = event.touches[0];
            targetMousePos.x = (touch.clientX / window.innerWidth) * 2 - 1;
            targetMousePos.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            mouseVelocity.x = targetMousePos.x - prevMousePos.x;
            mouseVelocity.y = targetMousePos.y - prevMousePos.y;

            const velocity = mouseVelocity.length();
            if (velocity > 0.02) {
                ripples.push(new Ripple(
                    targetMousePos.x * 0.5 + 0.5,
                    targetMousePos.y * 0.5 + 0.5,
                    Math.min(velocity * 2, 0.6)
                ));

                if (ripples.length > 8) {
                    ripples.shift();
                }
            }
        }
    }

    function onScroll() {
        targetScrollY = window.scrollY;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        time++;

        // Smooth mouse following
        mousePos.x += (targetMousePos.x - mousePos.x) * 0.08;
        mousePos.y += (targetMousePos.y - mousePos.y) * 0.08;

        // Smooth scroll following
        scrollY += (targetScrollY - scrollY) * 0.1;

        // Update ripples
        ripples = ripples.filter(ripple => ripple.update());

        // Update surface displacement
        updateSurface();

        // Update shader uniforms
        if (metalSurface && metalSurface.userData.shader) {
            metalSurface.userData.shader.uniforms.uTime.value = time * 0.01;
            metalSurface.userData.shader.uniforms.uMousePos.value.set(
                mousePos.x * 0.5 + 0.5,
                mousePos.y * 0.5 + 0.5
            );
        }

        // Subtle camera movement following mouse
        camera.position.x += (mousePos.x * 15 - camera.position.x) * 0.02;
        camera.position.z = 120 + mousePos.y * 10;

        // Scroll-based camera tilt
        const scrollTilt = Math.min(scrollY * 0.0002, 0.15);
        camera.position.y = 80 - scrollY * 0.02;
        camera.lookAt(0, -10 + scrollTilt * 50, 0);

        renderer.render(scene, camera);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Google Translate initialization
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,fr,it',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}
