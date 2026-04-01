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
// DATA FLOW FIELD
// Particle-based vector field with motion blur
// B&W palette — no neon, no color
// ============================================
(function() {
    'use strict';

    const canvas = document.getElementById('flow-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let isMobile = window.innerWidth < 768;
    let numParticles = isMobile ? 800 : 2500;
    let particles = [];
    let time = 0;
    let animationFrameId;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);
        isMobile = window.innerWidth < 768;
        numParticles = isMobile ? 800 : 2500;
        initParticles();
    }

    // Pointer interaction (mouse / touch)
    let pointer = { x: -1000, y: -1000 };
    function handleMove(e) {
        pointer.x = e.touches ? e.touches[0].clientX : e.clientX;
        pointer.y = e.touches ? e.touches[0].clientY : e.clientY;
    }
    function handleLeave() { pointer.x = -1000; pointer.y = -1000; }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('mouseleave', handleLeave);
    window.addEventListener('touchend', handleLeave);

    function initParticles() {
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: 0,
                vy: 0,
                speed: Math.random() * 1.5 + 0.5,
                color: Math.random() > 0.7
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'rgba(150, 150, 150, 0.2)'
            });
        }
    }

    function draw() {
        // Motion blur — semi-transparent black overlay instead of clearRect
        ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        time += 0.005;

        var w = window.innerWidth;
        var h = window.innerHeight;
        var interactionRadius = isMobile ? 120 : 200;
        var lineWidth = isMobile ? 0.8 : 1.2;

        for (var i = 0, len = particles.length; i < len; i++) {
            var p = particles[i];

            // Vector field angle (trigonometric flow)
            var angle = Math.sin(p.x * 0.002 + time) * Math.cos(p.y * 0.002 + time) * Math.PI * 2;

            // Pointer repulsion
            var dx = pointer.x - p.x;
            var dy = pointer.y - p.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < interactionRadius) {
                var force = (interactionRadius - dist) / interactionRadius;
                angle -= force * Math.PI * 0.5;
            }

            // Apply vectors to velocity
            p.vx += Math.cos(angle) * 0.1;
            p.vy += Math.sin(angle) * 0.1;

            // Clamp max speed
            var currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (currentSpeed > p.speed) {
                p.vx = (p.vx / currentSpeed) * p.speed;
                p.vy = (p.vy / currentSpeed) * p.speed;
            }

            var prevX = p.x;
            var prevY = p.y;

            p.x += p.vx;
            p.y += p.vy;

            // Edge teleport
            if (p.x < 0) { p.x = w; p.vx = 0; }
            if (p.x > w) { p.x = 0; p.vx = 0; }
            if (p.y < 0) { p.y = h; p.vy = 0; }
            if (p.y > h) { p.y = 0; p.vy = 0; }

            // Render short trail line (skip if teleported)
            if (Math.abs(p.x - prevX) < 50 && Math.abs(p.y - prevY) < 50) {
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(p.x, p.y);
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = p.color;
                ctx.stroke();
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    // Boot
    resizeCanvas();
    draw();
})();

// Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,fr,it',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}
