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
// GRADIENT MESH BLOB - State of the Art
// Inspired by Stripe, Vercel, Linear
// ============================================

(function() {
    'use strict';

    let scene, camera, renderer, blob, clock;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    const canvas = document.getElementById('heroCanvas');

    if (!canvas) return;

    // Simplex Noise 3D (GLSL implementation)
    const simplexNoise3D = `
        // Simplex 3D Noise by Ian McEwan, Ashima Arts
        vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);

            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);

            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;

            i = mod(i, 289.0);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

            float n_ = 1.0/7.0;
            vec3 ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);

            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);

            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        // Fractal Brownian Motion for richer noise
        float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 4; i++) {
                value += amplitude * snoise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            return value;
        }
    `;

    // Vertex Shader
    const vertexShader = `
        ${simplexNoise3D}

        uniform float uTime;
        uniform float uNoiseStrength;
        uniform float uNoiseScale;
        uniform vec2 uMouse;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        varying vec3 vWorldPosition;

        void main() {
            // Base position
            vec3 pos = position;

            // Calculate noise-based displacement
            float noiseFreq = uNoiseScale;
            float noiseAmp = uNoiseStrength;

            // Multiple noise layers for organic movement
            vec3 noisePos = pos * noiseFreq + uTime * 0.15;
            float noise1 = snoise(noisePos);
            float noise2 = snoise(noisePos * 2.0 + 100.0) * 0.5;
            float noise3 = snoise(noisePos * 4.0 + 200.0) * 0.25;

            float displacement = (noise1 + noise2 + noise3) * noiseAmp;

            // Mouse influence - subtle attraction
            vec3 mouseInfluence = vec3(uMouse.x * 0.3, uMouse.y * 0.3, 0.0);
            pos += normalize(pos) * displacement;
            pos += mouseInfluence * 0.15 * (1.0 + displacement * 0.5);

            // Breathing effect
            float breathe = sin(uTime * 0.5) * 0.05 + 1.0;
            pos *= breathe;

            vDisplacement = displacement;
            vNormal = normalize(normalMatrix * normal);
            vPosition = pos;
            vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    // Fragment Shader
    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        varying vec3 vWorldPosition;

        void main() {
            // Fresnel effect for edge glow
            vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);

            // Dynamic gradient based on position and time
            float gradientX = vPosition.x * 0.5 + 0.5;
            float gradientY = vPosition.y * 0.5 + 0.5;
            float gradientZ = vPosition.z * 0.5 + 0.5;

            // Animated gradient mixing
            float timeFactor = uTime * 0.1;
            float mixFactor1 = sin(gradientX * 3.14159 + timeFactor) * 0.5 + 0.5;
            float mixFactor2 = cos(gradientY * 3.14159 + timeFactor * 1.3) * 0.5 + 0.5;
            float mixFactor3 = sin(gradientZ * 3.14159 + timeFactor * 0.7) * 0.5 + 0.5;

            // Four-color gradient
            vec3 color12 = mix(uColor1, uColor2, mixFactor1);
            vec3 color34 = mix(uColor3, uColor4, mixFactor2);
            vec3 baseColor = mix(color12, color34, mixFactor3);

            // Add displacement influence to color
            baseColor = mix(baseColor, uColor2, vDisplacement * 0.3 + 0.15);

            // Fresnel glow
            vec3 fresnelColor = mix(uColor1, uColor4, fresnel);
            baseColor = mix(baseColor, fresnelColor, fresnel * 0.6);

            // Subtle inner glow
            float innerGlow = 1.0 - fresnel;
            baseColor += uColor3 * innerGlow * 0.1;

            // Soft alpha for ethereal effect
            float alpha = 0.85 + fresnel * 0.15;

            gl_FragColor = vec4(baseColor, alpha);
        }
    `;

    function init() {
        // Scene
        scene = new THREE.Scene();

        // Clock for animation
        clock = new THREE.Clock();

        // Camera
        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Create blob geometry - high detail icosahedron
        const geometry = new THREE.IcosahedronGeometry(1.5, 64);

        // Shader material
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uNoiseStrength: { value: 0.35 },
                uNoiseScale: { value: 1.2 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                // Elegant color palette - deep blues, teals, purples
                uColor1: { value: new THREE.Color('#4F46E5') }, // Indigo
                uColor2: { value: new THREE.Color('#0EA5E9') }, // Sky blue
                uColor3: { value: new THREE.Color('#14B8A6') }, // Teal
                uColor4: { value: new THREE.Color('#8B5CF6') }  // Purple
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        blob = new THREE.Mesh(geometry, material);

        // Position blob to the right side
        blob.position.x = 1.8;
        blob.position.y = 0.2;

        scene.add(blob);

        // Add subtle ambient particles
        addAmbientParticles();

        // Event listeners
        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        // Start animation
        animate();
    }

    function addAmbientParticles() {
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Distribute particles around the blob
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 2 + Math.random() * 3;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            sizes[i] = Math.random() * 3 + 1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#5B8DEE') }
            },
            vertexShader: `
                attribute float size;
                uniform float uTime;
                varying float vAlpha;

                void main() {
                    vec3 pos = position;

                    // Gentle floating motion
                    pos.x += sin(uTime * 0.3 + position.y) * 0.1;
                    pos.y += cos(uTime * 0.2 + position.x) * 0.1;
                    pos.z += sin(uTime * 0.25 + position.z) * 0.1;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (3.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    // Twinkle effect
                    vAlpha = 0.3 + sin(uTime + position.x * 10.0) * 0.2;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;

                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    if (dist > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        particles.position.copy(blob.position);
        scene.add(particles);

        // Store reference for animation
        blob.userData.particles = particles;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Adjust blob position based on screen size
        if (window.innerWidth < 992) {
            blob.position.x = 0;
            blob.position.y = 1.5;
            blob.scale.setScalar(0.8);
        } else {
            blob.position.x = 1.8;
            blob.position.y = 0.2;
            blob.scale.setScalar(1);
        }
    }

    function onMouseMove(event) {
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            targetMouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Smooth mouse following
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Update blob uniforms
        blob.material.uniforms.uTime.value = elapsed;
        blob.material.uniforms.uMouse.value.set(mouseX, mouseY);

        // Subtle rotation
        blob.rotation.x = elapsed * 0.05 + mouseY * 0.1;
        blob.rotation.y = elapsed * 0.08 + mouseX * 0.1;

        // Update particles
        if (blob.userData.particles) {
            blob.userData.particles.material.uniforms.uTime.value = elapsed;
            blob.userData.particles.rotation.y = elapsed * 0.02;
        }

        // Subtle camera movement
        camera.position.x = mouseX * 0.3;
        camera.position.y = mouseY * 0.2;
        camera.lookAt(blob.position);

        renderer.render(scene, camera);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,fr,it',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}
