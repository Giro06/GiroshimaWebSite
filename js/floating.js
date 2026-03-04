// ========================================
// Floating 3D Game Elements – Scroll Parallax
// ========================================

(function () {
    const elements = document.querySelectorAll('.float-el');
    if (!elements.length) return;

    let scrollY = window.scrollY;
    let ticking = false;

    function applyParallax() {
        const scrollFactor = scrollY;

        elements.forEach((el) => {
            const speed = parseFloat(el.dataset.speed) || 0.3;
            const yOffset = -(scrollFactor * speed * 0.4);
            const rotateX = Math.sin(scrollFactor * speed * 0.003) * 25;
            const rotateY = Math.cos(scrollFactor * speed * 0.004) * 30;
            const rotateZ = Math.sin(scrollFactor * speed * 0.002) * 15;

            el.style.transform =
                `translateY(${yOffset}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        if (!ticking) {
            requestAnimationFrame(applyParallax);
            ticking = true;
        }
    }, { passive: true });

    // Mouse proximity glow
    let mouseX = -999, mouseY = -999;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function checkProximity() {
        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.hypot(mouseX - cx, mouseY - cy);
            el.classList.toggle('near-mouse', dist < 200);
        });
        requestAnimationFrame(checkProximity);
    }

    checkProximity();
})();
