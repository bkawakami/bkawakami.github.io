        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-VL5JMCR888');
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
        // Advanced particle flow system
        let scene, camera, renderer;
        let particles, particleSystem;
        let mouseX = 0, mouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;

        init();
        animate();

        function init() {
            // Scene setup
            scene = new THREE.Scene();
            
            // Camera setup - Closer position for zoom effect
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.z = 600; // Moved closer (was 1000)

            // Renderer setup
            renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('heroCanvas'),
                antialias: true,
                alpha: true
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);

            // Create particle system
            const particleCount = 3000; // Increased particle count for density
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);

            const color1 = new THREE.Color(0x5B8DEE);
            const color2 = new THREE.Color(0x48C9B0);

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                
                // Position - wider spread for better coverage when zoomed
                positions[i3] = (Math.random() - 0.5) * 2000;
                positions[i3 + 1] = (Math.random() - 0.5) * 2000;
                positions[i3 + 2] = (Math.random() - 0.5) * 2000;

                // Color (gradient between two colors)
                const mixRatio = Math.random();
                const mixedColor = color1.clone().lerp(color2, mixRatio);
                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;

                // Size - larger particles for zoomed effect
                sizes[i] = Math.random() * 12 + 5;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            // Shader material for particles with faster motion
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    pixelRatio: { value: renderer.getPixelRatio() }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    uniform float time;
                    uniform float pixelRatio;
                    
                    void main() {
                        vColor = color;
                        vec3 pos = position;
                        
                        // Add faster wave motion
                        pos.x += sin(time * 0.003 + position.y * 0.01) * 30.0;
                        pos.y += cos(time * 0.003 + position.x * 0.01) * 30.0;
                        pos.z += sin(time * 0.002 + position.x * 0.01) * 40.0;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        gl_PointSize = size * (400.0 / -mvPosition.z) * pixelRatio;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    
                    void main() {
                        vec2 xy = gl_PointCoord.xy - vec2(0.5);
                        float ll = length(xy);
                        
                        if (ll > 0.5) {
                            discard;
                        }
                        
                        float alpha = 1.0 - smoothstep(0.0, 0.5, ll);
                        gl_FragColor = vec4(vColor, alpha * 0.9);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            particleSystem = new THREE.Points(geometry, material);
            scene.add(particleSystem);

            // Add larger floating geometry
            const torusGeometry = new THREE.TorusKnotGeometry(150, 40, 100, 16);
            const torusMaterial = new THREE.MeshBasicMaterial({
                color: 0x5B8DEE,
                wireframe: true,
                opacity: 0.15,
                transparent: true
            });
            const torus = new THREE.Mesh(torusGeometry, torusMaterial);
            scene.add(torus);

            // Events
            document.addEventListener('mousemove', onDocumentMouseMove);
            document.addEventListener('touchmove', onDocumentTouchMove);
            window.addEventListener('resize', onWindowResize);
        }

        function onWindowResize() {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function onDocumentMouseMove(event) {
            mouseX = (event.clientX - windowHalfX) * 0.08; // More responsive
            mouseY = (event.clientY - windowHalfY) * 0.08;
        }

        function onDocumentTouchMove(event) {
            if (event.touches.length === 1) {
                mouseX = (event.touches[0].pageX - windowHalfX) * 0.08;
                mouseY = (event.touches[0].pageY - windowHalfY) * 0.08;
            }
        }

        function animate() {
            requestAnimationFrame(animate);

            const time = Date.now();

            // Update shader time
            particleSystem.material.uniforms.time.value = time;

            // Faster rotation of particle system
            particleSystem.rotation.x += 0.0005; // 5x faster
            particleSystem.rotation.y += 0.001;  // 5x faster

            // More responsive camera movement
            camera.position.x += (mouseX - camera.position.x) * 0.08;
            camera.position.y += (-mouseY - camera.position.y) * 0.08;
            camera.lookAt(scene.position);

            // Faster torus rotation
            if (scene.children[1]) {
                scene.children[1].rotation.x += 0.005; // 5x faster
                scene.children[1].rotation.y += 0.01;  // 5x faster
            }

            renderer.render(scene, camera);
        }
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({
                pageLanguage: 'pt',
                includedLanguages: 'en,es,fr,it',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
        }
