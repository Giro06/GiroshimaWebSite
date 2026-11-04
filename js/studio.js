// ========================================
// GIROSHIMA - Studio page: winding road the developer walks down on scroll
// ========================================

(function () {
    'use strict';

    const road = document.getElementById('road');
    if (!road) return;

    const svg = road.querySelector('.road-svg');
    const paths = [...svg.querySelectorAll('path')];
    const progressPath = svg.querySelector('.road-progress');
    const walker = document.getElementById('walker');
    const steps = [...road.querySelectorAll('.road-step')];

    let length = 0;
    let stepAt = [];   // path length at which each step's dot sits
    let lastX = null;

    // Smooth S-curves through every dot, starting a little above the first one
    function build() {
        const box = road.getBoundingClientRect();
        const points = steps.map(step => {
            const r = step.querySelector('.road-dot').getBoundingClientRect();
            return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
        });

        svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);

        let d = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
        const segEnds = [];
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const k = (b.y - a.y) * 0.55;
            d += ` C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
            segEnds.push(d);
        }
        paths.forEach(p => p.setAttribute('d', d));

        // Measure where each dot falls along the full path
        const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.appendChild(probe);
        stepAt = [0];
        probe.setAttribute('d', `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`);
        stepAt[0] = probe.getTotalLength();
        segEnds.forEach(sd => {
            probe.setAttribute('d', sd);
            stepAt.push(probe.getTotalLength());
        });
        probe.remove();

        length = progressPath.getTotalLength();
        progressPath.style.strokeDasharray = `${length}`;
        update();
    }

    // Walker sits where the viewport's middle crosses the road
    function update() {
        if (!length) return;
        const box = road.getBoundingClientRect();
        const target = window.innerHeight * 0.55 - box.top;
        const t = Math.min(Math.max(target / box.height, 0), 1);

        // Walk by height, then map to path length so the walker never outruns the road
        const lastDot = stepAt[stepAt.length - 1];
        let lo = 0, hi = length;
        for (let i = 0; i < 18; i++) {
            const mid = (lo + hi) / 2;
            if (progressPath.getPointAtLength(mid).y < t * box.height) lo = mid; else hi = mid;
        }
        const at = Math.min(lo, lastDot);

        const p = progressPath.getPointAtLength(at);
        progressPath.style.strokeDashoffset = `${length - at}`;
        walker.style.transform = `translate(${p.x}px, ${p.y}px)`;
        if (lastX !== null && Math.abs(p.x - lastX) > 0.5) {
            walker.classList.toggle('facing-left', p.x < lastX);
        }
        lastX = p.x;
        walker.classList.toggle('arrived', at >= lastDot - 1);

        steps.forEach((step, i) => step.classList.toggle('reached', at >= stepAt[i] - 2));
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    build();
})();
