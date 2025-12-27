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
// INTERACTIVE NEURAL NETWORK EFFECT
// Elegant, innovative, and highly interactive
// ============================================

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        particleCount: 120,
        connectionDistance: 150,
        mouseInfluenceRadius: 200,
        mouseRepelStrength: 0.15,
        returnSpeed: 0.03,
        baseSpeed: 0.3,
        colors: {
            primary: new THREE.Color(0x5B8DEE),
            accent: new THREE.Color(0x48C9B0),
            highlight: new THREE.Color(0x8B5CF6),
            white: new THREE.Color(0xFFFFFF)
        }
    };

    // State
    let scene, camera, renderer;
    let particles = [];
    let connections;
    let mousePos = new THREE.Vector2(9999, 9999);
    let mousePos3D = new THREE.Vector3(9999, 9999, 0);
    let targetMousePos = new THREE.Vector2(9999, 9999);
    let time = 0;
    let animationId;

    // Simplex noise implementation for organic movement
    const SimplexNoise = (function() {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
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
            }
        };
    })();

    const noise = SimplexNoise;

    // Particle class
    class Particle {
        constructor(index) {
            this.index = index;

            // Random position in a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 200 + Math.random() * 300;

            this.baseX = radius * Math.sin(phi) * Math.cos(theta);
            this.baseY = radius * Math.sin(phi) * Math.sin(theta);
            this.baseZ = (Math.random() - 0.5) * 400;

            this.x = this.baseX;
            this.y = this.baseY;
            this.z = this.baseZ;

            this.vx = 0;
            this.vy = 0;
            this.vz = 0;

            // Noise offsets for organic movement
            this.noiseOffsetX = Math.random() * 1000;
            this.noiseOffsetY = Math.random() * 1000;
            this.noiseOffsetZ = Math.random() * 1000;

            // Visual properties
            this.size = 2 + Math.random() * 3;
            this.baseSize = this.size;
            this.colorMix = Math.random();
            this.pulseOffset = Math.random() * Math.PI * 2;
        }

        update(time, mousePos3D) {
            // Organic movement with noise
            const noiseScale = 0.002;
            const noiseStrength = 30;

            const targetX = this.baseX + noise.noise2D(this.noiseOffsetX + time * noiseScale, 0) * noiseStrength;
            const targetY = this.baseY + noise.noise2D(this.noiseOffsetY + time * noiseScale, 100) * noiseStrength;
            const targetZ = this.baseZ + noise.noise2D(this.noiseOffsetZ + time * noiseScale, 200) * noiseStrength * 0.5;

            // Mouse repulsion
            const dx = this.x - mousePos3D.x;
            const dy = this.y - mousePos3D.y;
            const dz = this.z - mousePos3D.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < CONFIG.mouseInfluenceRadius && dist > 0) {
                const force = (1 - dist / CONFIG.mouseInfluenceRadius) * CONFIG.mouseRepelStrength;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 50;
                this.vy += Math.sin(angle) * force * 50;
                this.vz += (dz / dist) * force * 20;

                // Increase size when near mouse
                this.size = this.baseSize * (1 + (1 - dist / CONFIG.mouseInfluenceRadius) * 1.5);
            } else {
                this.size += (this.baseSize - this.size) * 0.1;
            }

            // Return to organic target position
            this.vx += (targetX - this.x) * CONFIG.returnSpeed;
            this.vy += (targetY - this.y) * CONFIG.returnSpeed;
            this.vz += (targetZ - this.z) * CONFIG.returnSpeed;

            // Apply velocity with damping
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;

            this.vx *= 0.92;
            this.vy *= 0.92;
            this.vz *= 0.92;

            // Subtle pulse
            this.size *= 1 + Math.sin(time * 0.003 + this.pulseOffset) * 0.1;
        }
    }

    function init() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        // Scene setup
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = 600;

        // Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Create particles
        createParticles();

        // Create connection lines
        createConnections();

        // Events
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchstart', onTouchMove, { passive: true });
        window.addEventListener('resize', onResize);

        // Start animation
        animate();
    }

    function createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(CONFIG.particleCount * 3);
        const colors = new Float32Array(CONFIG.particleCount * 3);
        const sizes = new Float32Array(CONFIG.particleCount);

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const particle = new Particle(i);
            particles.push(particle);

            positions[i * 3] = particle.x;
            positions[i * 3 + 1] = particle.y;
            positions[i * 3 + 2] = particle.z;

            const color = CONFIG.colors.primary.clone().lerp(CONFIG.colors.accent, particle.colorMix);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = particle.size;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float pixelRatio;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

                    // Depth-based alpha
                    float depth = -mvPosition.z;
                    vAlpha = smoothstep(800.0, 200.0, depth);

                    gl_PointSize = size * (300.0 / -mvPosition.z) * pixelRatio;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);

                    if (dist > 0.5) discard;

                    // Soft glow effect
                    float alpha = smoothstep(0.5, 0.0, dist);
                    float glow = exp(-dist * 3.0) * 0.5;

                    vec3 finalColor = vColor + glow * 0.3;
                    gl_FragColor = vec4(finalColor, (alpha + glow) * vAlpha * 0.9);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);
    }

    function createConnections() {
        // Maximum possible connections
        const maxConnections = CONFIG.particleCount * CONFIG.particleCount;
        const positions = new Float32Array(maxConnections * 6);
        const colors = new Float32Array(maxConnections * 6);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        connections = new THREE.LineSegments(geometry, material);
        scene.add(connections);
    }

    function updateConnections() {
        const positions = connections.geometry.attributes.position.array;
        const colors = connections.geometry.attributes.color.array;
        let connectionCount = 0;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONFIG.connectionDistance) {
                    const alpha = 1 - dist / CONFIG.connectionDistance;

                    // Check if near mouse for color effect
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const mouseDist = Math.sqrt(
                        Math.pow(midX - mousePos3D.x, 2) +
                        Math.pow(midY - mousePos3D.y, 2)
                    );

                    let color1, color2;
                    if (mouseDist < CONFIG.mouseInfluenceRadius) {
                        const mouseInfluence = 1 - mouseDist / CONFIG.mouseInfluenceRadius;
                        color1 = CONFIG.colors.primary.clone().lerp(CONFIG.colors.highlight, mouseInfluence);
                        color2 = CONFIG.colors.accent.clone().lerp(CONFIG.colors.highlight, mouseInfluence);
                    } else {
                        color1 = CONFIG.colors.primary;
                        color2 = CONFIG.colors.accent;
                    }

                    const idx = connectionCount * 6;

                    positions[idx] = p1.x;
                    positions[idx + 1] = p1.y;
                    positions[idx + 2] = p1.z;
                    positions[idx + 3] = p2.x;
                    positions[idx + 4] = p2.y;
                    positions[idx + 5] = p2.z;

                    colors[idx] = color1.r * alpha;
                    colors[idx + 1] = color1.g * alpha;
                    colors[idx + 2] = color1.b * alpha;
                    colors[idx + 3] = color2.r * alpha;
                    colors[idx + 4] = color2.g * alpha;
                    colors[idx + 5] = color2.b * alpha;

                    connectionCount++;
                }
            }
        }

        connections.geometry.setDrawRange(0, connectionCount * 2);
        connections.geometry.attributes.position.needsUpdate = true;
        connections.geometry.attributes.color.needsUpdate = true;
    }

    function onMouseMove(event) {
        targetMousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        targetMousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            targetMousePos.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMousePos.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        time++;

        // Smooth mouse following
        mousePos.x += (targetMousePos.x - mousePos.x) * 0.1;
        mousePos.y += (targetMousePos.y - mousePos.y) * 0.1;

        // Convert mouse to 3D space
        mousePos3D.x = mousePos.x * 400;
        mousePos3D.y = mousePos.y * 300;
        mousePos3D.z = 0;

        // Update particles
        const pointsGeometry = scene.children[0].geometry;
        const positions = pointsGeometry.attributes.position.array;
        const sizes = pointsGeometry.attributes.size.array;
        const colors = pointsGeometry.attributes.color.array;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update(time, mousePos3D);

            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
            sizes[i] = p.size;

            // Dynamic color based on mouse proximity
            const dx = p.x - mousePos3D.x;
            const dy = p.y - mousePos3D.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let color;
            if (dist < CONFIG.mouseInfluenceRadius) {
                const influence = 1 - dist / CONFIG.mouseInfluenceRadius;
                color = CONFIG.colors.primary.clone()
                    .lerp(CONFIG.colors.accent, p.colorMix)
                    .lerp(CONFIG.colors.highlight, influence * 0.7);
            } else {
                color = CONFIG.colors.primary.clone().lerp(CONFIG.colors.accent, p.colorMix);
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        pointsGeometry.attributes.position.needsUpdate = true;
        pointsGeometry.attributes.size.needsUpdate = true;
        pointsGeometry.attributes.color.needsUpdate = true;

        // Update connections
        updateConnections();

        // Subtle camera movement
        camera.position.x += (mousePos.x * 30 - camera.position.x) * 0.02;
        camera.position.y += (mousePos.y * 20 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Slow scene rotation for life
        scene.rotation.y = Math.sin(time * 0.0005) * 0.1;
        scene.rotation.x = Math.cos(time * 0.0003) * 0.05;

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
