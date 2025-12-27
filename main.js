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
// GRADIENT MESH BLOB - Elegant Edition
// Smooth, refined, and subtly interactive
// ============================================

(function() {
    'use strict';

    let scene, camera, renderer, blob, glowMesh, clock;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let isMobile = false;
    const canvas = document.getElementById('heroCanvas');

    if (!canvas) return;

    // Simplex Noise 3D
    const simplexNoise3D = `
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
    `;

    // Vertex Shader - More defined waves
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
        varying float vElevation;

        void main() {
            vec3 pos = position;

            // More defined layered noise
            vec3 noisePos = pos * uNoiseScale + uTime * 0.06;

            float noise1 = snoise(noisePos);
            float noise2 = snoise(noisePos * 1.8 + 30.0) * 0.6;
            float noise3 = snoise(noisePos * 3.5 + 60.0) * 0.3;

            float displacement = (noise1 + noise2 + noise3) * uNoiseStrength;

            // Store elevation for fragment shader
            vElevation = displacement;

            // Subtle mouse influence
            vec3 mouseDir = vec3(uMouse.x, uMouse.y, 0.0);
            float mouseInfluence = dot(normalize(pos), normalize(mouseDir + vec3(0.001)));
            mouseInfluence = mouseInfluence * 0.5 + 0.5;

            float finalDisplacement = displacement * (1.0 + mouseInfluence * 0.12);
            pos += normalize(pos) * finalDisplacement;

            // Gentle breathing
            float breathe = sin(uTime * 0.35) * 0.015 + 1.0;
            pos *= breathe;

            vDisplacement = displacement;
            vNormal = normalize(normalMatrix * normal);
            vPosition = pos;
            vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    // Fragment Shader - Deeper colors, more contrast
    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;
        uniform vec2 uMouse;
        uniform float uOpacity;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        varying vec3 vWorldPosition;
        varying float vElevation;

        void main() {
            vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

            // Fresnel for edge detection
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.5);

            // Position gradients
            float gradientX = vPosition.x * 0.5 + 0.5;
            float gradientY = vPosition.y * 0.5 + 0.5;

            // Slow color animation
            float t = uTime * 0.06;
            float mix1 = sin(gradientX * 3.14159 + t) * 0.5 + 0.5;
            float mix2 = cos(gradientY * 3.14159 + t * 0.8) * 0.5 + 0.5;

            // Use elevation to enhance wave visibility
            float elevationFactor = smoothstep(-0.3, 0.3, vElevation);

            // Four-color blend with elevation influence
            vec3 color12 = mix(uColor1, uColor2, mix1);
            vec3 color34 = mix(uColor3, uColor4, mix2);
            vec3 baseColor = mix(color12, color34, elevationFactor);

            // Darken valleys, lighten peaks for definition
            float contrast = vElevation * 0.4;
            baseColor = baseColor * (1.0 + contrast);

            // Subtle edge highlight
            vec3 edgeColor = mix(uColor2, uColor4, 0.5);
            baseColor = mix(baseColor, edgeColor, fresnel * 0.35);

            // Deeper core
            baseColor = mix(baseColor * 0.75, baseColor, fresnel * 0.4 + 0.6);

            float alpha = uOpacity * (0.85 + fresnel * 0.15);

            gl_FragColor = vec4(baseColor, alpha);
        }
    `;

    // Subtle outer glow
    const glowVertexShader = `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const glowFragmentShader = `
        uniform vec3 uGlowColor;
        uniform float uOpacity;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 5.0);
            float alpha = fresnel * 0.1 * uOpacity;
            gl_FragColor = vec4(uGlowColor, alpha);
        }
    `;

    function init() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();

        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Deeper, richer color palette
        const colors = {
            indigo: new THREE.Color('#3730A3'),   // Deeper indigo
            blue: new THREE.Color('#1E40AF'),      // Deep blue
            teal: new THREE.Color('#0F766E'),      // Deeper teal
            purple: new THREE.Color('#6D28D9')     // Deeper purple
        };

        // High-detail geometry
        const geometry = new THREE.IcosahedronGeometry(1.5, 80);

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uNoiseStrength: { value: 0.38 },  // Stronger waves
                uNoiseScale: { value: 0.9 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uColor1: { value: colors.indigo },
                uColor2: { value: colors.blue },
                uColor3: { value: colors.teal },
                uColor4: { value: colors.purple },
                uOpacity: { value: 1.0 }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        blob = new THREE.Mesh(geometry, material);
        blob.position.x = 1.8;
        blob.position.y = 0.2;
        scene.add(blob);

        // Subtle outer glow
        const glowGeometry = new THREE.IcosahedronGeometry(1.7, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            vertexShader: glowVertexShader,
            fragmentShader: glowFragmentShader,
            uniforms: {
                uGlowColor: { value: new THREE.Color('#4338CA') },
                uOpacity: { value: 1.0 }
            },
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(blob.position);
        scene.add(glowMesh);

        // Ambient particles
        addAmbientParticles();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        onResize();
        animate();
    }

    function addAmbientParticles() {
        const count = 50;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const randoms = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 2.2 + Math.random() * 2;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            sizes[i] = Math.random() * 2.5 + 0.8;
            randoms[i] = Math.random();
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#6366f1') },
                uOpacity: { value: 1.0 }
            },
            vertexShader: `
                attribute float size;
                attribute float aRandom;
                uniform float uTime;
                varying float vAlpha;

                void main() {
                    vec3 pos = position;

                    // Gentle orbit
                    float angle = uTime * 0.04 + aRandom * 6.28;
                    float radius = length(pos.xz);
                    pos.x = cos(angle + atan(position.z, position.x)) * radius;
                    pos.z = sin(angle + atan(position.z, position.x)) * radius;
                    pos.y += sin(uTime * 0.08 + aRandom * 6.28) * 0.12;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (3.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    vAlpha = 0.25 + sin(uTime * 0.4 + aRandom * 10.0) * 0.12;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                varying float vAlpha;

                void main() {
                    float dist = length(gl_PointCoord - 0.5);
                    if (dist > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha * uOpacity;
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
        blob.userData.particles = particles;
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        isMobile = window.innerWidth < 992;

        if (isMobile) {
            // Mobile: position behind text area, more transparent
            blob.position.set(0, -0.5, -1);
            blob.scale.setScalar(1.2);
            blob.material.uniforms.uOpacity.value = 0.4;

            // Hide glow and particles on mobile
            glowMesh.visible = false;
            if (blob.userData.particles) {
                blob.userData.particles.visible = false;
            }
        } else {
            // Desktop: normal position
            blob.position.set(1.8, 0.2, 0);
            blob.scale.setScalar(1);
            blob.material.uniforms.uOpacity.value = 1.0;

            // Show glow and particles on desktop
            glowMesh.visible = true;
            glowMesh.position.copy(blob.position);
            glowMesh.scale.setScalar(1);

            if (blob.userData.particles) {
                blob.userData.particles.visible = true;
                blob.userData.particles.position.copy(blob.position);
                blob.userData.particles.scale.setScalar(1);
            }
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

        // Smooth mouse interpolation
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        // Update uniforms
        blob.material.uniforms.uTime.value = elapsed;
        blob.material.uniforms.uMouse.value.set(mouseX, mouseY);

        // Elegant slow rotation
        blob.rotation.x = elapsed * 0.015 + mouseY * 0.06;
        blob.rotation.y = elapsed * 0.025 + mouseX * 0.06;

        glowMesh.rotation.copy(blob.rotation);

        // Particles
        if (blob.userData.particles) {
            blob.userData.particles.material.uniforms.uTime.value = elapsed;
        }

        // Camera parallax (reduced on mobile)
        const parallaxStrength = isMobile ? 0.08 : 0.2;
        camera.position.x = mouseX * parallaxStrength;
        camera.position.y = mouseY * parallaxStrength * 0.75;
        camera.lookAt(blob.position);

        renderer.render(scene, camera);
    }

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
