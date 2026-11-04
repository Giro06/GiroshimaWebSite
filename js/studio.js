// ========================================
// GIROSHIMA - Studio page: cover forge. Each pipeline step drops a layer onto the SLOTDOWN cover stack.
// ========================================

(function () {
    'use strict';

    const LAYERS = ['Composition guides', 'Blueprint sketch', 'Flat background', 'Flat colour', 'Ink lines', 'Game logo', 'Shading', 'Effects'];

    const forge = document.getElementById('forge');
    const stack = document.getElementById('stack');
    const nodes = [...document.querySelectorAll('.node')];
    const layers = [...stack.querySelectorAll('.layer')].filter(l => !l.classList.contains('layer-final'));
    const feed = document.getElementById('feed');
    const pulse = document.getElementById('pulse');
    const feedLayer = document.querySelector('.feed-layer');
    const spineFill = document.getElementById('spine-fill');
    const bars = [...document.querySelectorAll('#readout-bar span')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let active = -1;
    let pressed = false;

    // ---- Feed wire from the active node's pin to the stack ----
    function aimFeed() {
        const visible = active >= 0 && !pressed && getComputedStyle(feedLayer).display !== 'none';
        const f = forge.getBoundingClientRect();
        if (!visible || f.bottom < 0 || f.top > window.innerHeight) { feed.style.display = 'none'; return; }
        const n = nodes[active].getBoundingClientRect();
        const s = stack.getBoundingClientRect();
        const a = { x: n.right, y: n.top + 31 };
        const b = { x: s.left + s.width * 0.42, y: s.top + s.height * 0.45 };
        feed.setAttribute('d', `M ${a.x} ${a.y} C ${a.x + 120} ${a.y}, ${b.x - 160} ${b.y - 80}, ${b.x} ${b.y}`);
        feed.style.display = '';
    }

    // Send a spark along the feed, then drop the layer
    function firePulse(onArrive) {
        if (reducedMotion || feed.style.display === 'none') { onArrive(); return; }
        const len = feed.getTotalLength();
        const start = performance.now();
        pulse.style.opacity = '1';
        (function frame(now) {
            const t = Math.min((now - start) / 480, 1);
            const p = feed.getPointAtLength(t * t * (3 - 2 * t) * len);
            pulse.setAttribute('cx', p.x);
            pulse.setAttribute('cy', p.y);
            if (t < 1) requestAnimationFrame(frame);
            else { pulse.style.opacity = '0'; onArrive(); }
        })(start);
    }

    // ---- State ----
    function setActive(index) {
        const prev = active;
        active = index;

        nodes.forEach((n, i) => {
            n.classList.toggle('done', i < index);
            n.classList.toggle('active', i === index);
        });
        bars.forEach((b, i) => b.classList.toggle('on', i <= index));
        document.getElementById('readout-meta').textContent =
            index < 0 ? 'LAYER 00 / 08' : `LAYER ${String(index + 1).padStart(2, '0')} / 08`;
        document.getElementById('readout-layer').textContent =
            index < 0 ? 'Scroll to build the cover' : '+ ' + LAYERS[index];

        // Going back: lift layers above the new step straight away
        layers.forEach((l, i) => {
            if (i > index) l.classList.remove('in');
            l.classList.toggle('current', i === index);
        });
        aimFeed();
        const drop = () => layers.forEach((l, i) => { if (i <= index) l.classList.add('in'); });
        if (index > prev) firePulse(drop); else drop();
    }

    function setPressed(on) {
        if (on === pressed) return;
        pressed = on;
        stack.classList.toggle('pressed', on);
        if (on) layers.forEach(l => l.classList.add('in'));
        document.getElementById('readout-meta').textContent = on ? 'BUILD COMPLETE' : `LAYER ${String(active + 1).padStart(2, '0')} / 08`;
        document.getElementById('readout-layer').textContent = on ? 'SLOTDOWN · on Steam' : '+ ' + LAYERS[active];
        aimFeed();
    }

    // Active node = the last one whose top has passed the trigger line
    function update() {
        const line = window.innerHeight * (window.innerWidth <= 860 ? 0.72 : 0.55);
        let index = -1;
        nodes.forEach((n, i) => { if (n.getBoundingClientRect().top < line) index = i; });
        if (index !== active) setActive(index);

        const last = nodes[nodes.length - 1].getBoundingClientRect();
        setPressed(last.bottom < line - 40);

        // Spine fills down to the trigger line
        const spine = spineFill.parentElement.getBoundingClientRect();
        spineFill.style.height = Math.min(Math.max(line - spine.top, 0), spine.height) + 'px';
        aimFeed();
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
