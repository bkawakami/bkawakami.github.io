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
// Directional particle flow with motion blur
// B&W palette — organic current, bottom-left → upper-right
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
    let lastWidth = 0;
    let resizeTimer;
    let isVisible = true;

    function resizeCanvas() {
        var oldW = lastWidth;
        var oldH = canvas.style.height ? parseInt(canvas.style.height) : 0;
        var newW = window.innerWidth;
        var newH = window.innerHeight;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = newW * dpr;
        canvas.height = newH * dpr;
        canvas.style.width = newW + 'px';
        canvas.style.height = newH + 'px';
        // Reset transform before scaling to prevent accumulation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        var wasMobile = isMobile;
        isMobile = newW < 768;
        numParticles = isMobile ? 800 : 2500;

        if (particles.length === 0 || wasMobile !== isMobile) {
            // First boot or crossed mobile/desktop threshold — full init
            initParticles();
        } else if (oldW > 0 && newW !== oldW) {
            // Width changed (real resize, not just address bar) — rescale positions
            var scaleX = newW / oldW;
            var scaleY = newH / oldH;
            for (var i = 0; i < particles.length; i++) {
                particles[i].x *= scaleX;
                particles[i].y *= scaleY;
            }
        }
        // Height-only change (mobile address bar) — do nothing to particles

        lastWidth = newW;
    }

    // Pointer interaction (mouse / touch)
    let pointer = { x: -1000, y: -1000 };
    function handleMove(e) {
        pointer.x = e.touches ? e.touches[0].clientX : e.clientX;
        pointer.y = e.touches ? e.touches[0].clientY : e.clientY;
    }
    function handleLeave() { pointer.x = -1000; pointer.y = -1000; }

    // Debounced resize to avoid flicker from rapid viewport changes
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 150);
    });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('mouseleave', handleLeave);
    window.addEventListener('touchend', handleLeave);

    // Pause animation when hero is not visible (performance)
    var heroSection = canvas.closest('.hero-section') || canvas.parentElement;
    if (heroSection && window.IntersectionObserver) {
        var observer = new IntersectionObserver(function(entries) {
            isVisible = entries[0].isIntersecting;
            if (isVisible && !animationFrameId) {
                draw();
            }
        }, { threshold: 0 });
        observer.observe(heroSection);
    }

    function initParticles() {
        particles = [];
        var w = window.innerWidth;
        var h = window.innerHeight;
        for (let i = 0; i < numParticles; i++) {
            // Density gradient: bias toward bottom-left (where text sits)
            var rawX = Math.random();
            var rawY = Math.random();
            var biasedX = Math.pow(rawX, 1.3);         // clusters toward left
            var biasedY = 1 - Math.pow(rawY, 1.3);     // clusters toward bottom

            particles.push({
                x: biasedX * w,
                y: biasedY * h,
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
        // Pause when hero is off-screen
        if (!isVisible) {
            animationFrameId = null;
            return;
        }

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

            // Dominant flow direction: bottom-left → upper-right (~-45°)
            var baseAngle = -Math.PI * 0.25;

            // Organic variation: layered sine waves for natural undulation
            var variation = Math.sin(p.x * 0.003 + p.y * 0.001 + time) * 0.8
                          + Math.sin(p.x * 0.001 - p.y * 0.002 + time * 0.7) * 0.5;

            // Subtle spiral influence near center for visual interest
            var cx = p.x - w * 0.5;
            var cy = p.y - h * 0.5;
            var distFromCenter = Math.sqrt(cx * cx + cy * cy);
            var maxDist = Math.sqrt(w * w + h * h) * 0.5;
            var spiralInfluence = Math.max(0, 1 - distFromCenter / maxDist) * 0.3;
            var spiralAngle = Math.atan2(cy, cx) + Math.PI * 0.5;

            var angle = baseAngle + variation + spiralInfluence * (spiralAngle - baseAngle);

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

            // Directional edge wrapping — reinforces the flow direction
            // Particles exiting right re-enter left (bottom half)
            if (p.x > w)  { p.x = 0; p.y = h * (0.5 + Math.random() * 0.5); p.vx = 0; p.vy = 0; }
            // Particles exiting top re-enter bottom (left half)
            if (p.y < 0)  { p.y = h; p.x = w * Math.random() * 0.5; p.vx = 0; p.vy = 0; }
            // Particles exiting left — nudge back in
            if (p.x < 0)  { p.x = 0; p.vx = Math.abs(p.vx) * 0.5; }
            // Particles exiting bottom — nudge back in
            if (p.y > h)  { p.y = h; p.vy = -Math.abs(p.vy) * 0.5; }

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
