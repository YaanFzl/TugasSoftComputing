console.log("Soft Computing Web3 Loaded");

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Particles
    const particlesCount = 1500;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);

    // Target Positions for Morphing
    const targets = {
        random: [],
        dna: [],
        sphere: [],
        neuron: []
    };

    // 1. Random (Home)
    for (let i = 0; i < particlesCount * 3; i++) {
        const val = (Math.random() - 0.5) * 25;
        targets.random.push(val);
        // Start particles condensed at center for "Big Bang" effect
        posArray[i] = (Math.random() - 0.5) * 0.2;
    }

    // 2. DNA Double Helix (GA) - HORIZONTAL
    for (let i = 0; i < particlesCount; i++) {
        const t = i * 0.1;
        const helixRadius = 2;
        const lengthScale = 0.03;
        const xPos = (i * lengthScale) - 20;

        if (i % 2 === 0) {
            targets.dna.push(xPos);
            targets.dna.push(Math.cos(t) * helixRadius);
            targets.dna.push(Math.sin(t) * helixRadius);
        } else {
            targets.dna.push(xPos);
            targets.dna.push(Math.cos(t + Math.PI) * helixRadius);
            targets.dna.push(Math.sin(t + Math.PI) * helixRadius);
        }
    }
    while (targets.dna.length < particlesCount * 3) targets.dna.push((Math.random() - 0.5) * 20);

    // 3. Sphere/Cloud (Fuzzy)
    for (let i = 0; i < particlesCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / particlesCount);
        const theta = Math.sqrt(particlesCount * Math.PI) * phi;
        const r = 4;

        targets.sphere.push(r * Math.cos(theta) * Math.sin(phi));
        targets.sphere.push(r * Math.sin(theta) * Math.sin(phi));
        targets.sphere.push(r * Math.cos(phi));
    }
    while (targets.sphere.length < particlesCount * 3) targets.sphere.push((Math.random() - 0.5) * 20);

    // 4. Neuron (NN)
    for (let i = 0; i < particlesCount; i++) {
        if (i < 500) {
            const r = 1.5 * Math.random();
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            targets.neuron.push(r * Math.sin(phi) * Math.cos(theta));
            targets.neuron.push(r * Math.sin(phi) * Math.sin(theta));
            targets.neuron.push(r * Math.cos(phi));
        } else {
            const branch = Math.floor(i / 100);
            const dist = (i % 100) * 0.1 + 1.5;
            const angle = branch * (Math.PI * 2 / 10);
            const spread = (Math.random() - 0.5) * 0.5;

            targets.neuron.push(dist * Math.cos(angle + spread));
            targets.neuron.push(dist * Math.sin(angle + spread));
            targets.neuron.push((Math.random() - 0.5) * 2);
        }
    }
    while (targets.neuron.length < particlesCount * 3) targets.neuron.push((Math.random() - 0.5) * 20);

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material
    const material = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x00f2ea,
        transparent: true,
        opacity: 0, // Start invisible for fade-in
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 8;

    // State for Animation
    let currentTarget = targets.random;
    let isGA = false;
    const transitionState = { progress: 0 };
    let startPositions = new Float32Array(posArray);
    let targetPositions = targets.random;

    // Highlight State
    let activeHighlightElement = null;
    const highlightOffsets = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        highlightOffsets[i] = (Math.random() - 0.5) * 0.5;
    }

    // Transition Function
    function transitionTo(newTarget, newIsGA, duration = 2) {
        // Snapshot current positions as start
        startPositions.set(particlesGeometry.attributes.position.array);
        targetPositions = newTarget;
        isGA = newIsGA;
        transitionState.progress = 0;

        // Reset Highlight Tracking by default
        activeHighlightElement = null;

        // GSAP Tween
        gsap.to(transitionState, {
            duration: duration,
            progress: 1,
            ease: "power3.inOut"
        });
    }

    // Default State
    let defaultTarget = targets.random;
    let defaultIsGA = false;

    function updateDefaultTarget() {
        const path = window.location.pathname;
        if (path.includes('/ga')) {
            defaultTarget = targets.dna;
            defaultIsGA = true;
        } else if (path.includes('/fuzzy') || path.includes('/sugeno')) {
            defaultTarget = targets.sphere;
            defaultIsGA = false;
        } else if (path.includes('/nn')) {
            defaultTarget = targets.neuron;
            defaultIsGA = false;
        } else {
            defaultTarget = targets.random;
            defaultIsGA = false;
        }
    }

    // Determine Target Shape based on URL
    updateDefaultTarget();
    const introDuration = 3.5; // Slower for intro
    transitionTo(defaultTarget, defaultIsGA, introDuration);

    // Scroll Interaction: Revert to default on scroll with delay
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (activeHighlightElement) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (activeHighlightElement) {
                    transitionTo(defaultTarget, defaultIsGA, 2);
                }
            }, 50); // 1 second delay before reverting
        }
    });

    // Intro Animation Sequence (The "Wow" Factor)
    // 1. Fade In
    gsap.to(material, { opacity: 0.8, duration: 2.5, ease: "power2.inOut" });

    // 2. Camera Zoom Out (Big Bang feel)
    gsap.from(camera.position, { z: 1, duration: 4, ease: "expo.out" });

    // 3. Spin the Universe
    gsap.from(particlesMesh.rotation, {
        y: Math.PI * 2,
        z: Math.PI / 2,
        duration: 4,
        ease: "expo.out"
    });

    // Helper to get 3D pos from screen coords
    const get3DPos = (x, y, zDepth = 0) => {
        const vec = new THREE.Vector3();
        const pos = new THREE.Vector3();

        vec.set(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1,
            0.5
        );

        vec.unproject(camera);
        vec.sub(camera.position).normalize();

        const distance = (zDepth - camera.position.z) / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));
        return pos;
    };

    // Highlight Element Logic
    window.highlightElement = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return;

        // Create a new array for the target positions
        // We will populate this initially, and then update it in the tick loop
        const highlightTarget = [];

        // Initial population (same logic as update, but we need to fill the array for transitionTo)
        // We can just fill with zeros or current positions, the tick loop will fix it immediately
        // But to be safe for the transition start, let's calculate once.

        // Actually, let's just use the update logic.
        // We need to set activeHighlightElement AFTER transitionTo, 
        // but we need the array FOR transitionTo.

        // Initialize with current random/sphere positions to avoid glitch? 
        // No, let's calculate the initial frame.

        const rect = element.getBoundingClientRect();
        const tl = get3DPos(rect.left, rect.top);
        const tr = get3DPos(rect.right, rect.top);
        const bl = get3DPos(rect.left, rect.bottom);
        const br = get3DPos(rect.right, rect.bottom);
        const perimeter = (rect.width + rect.height) * 2;

        for (let i = 0; i < particlesCount; i++) {
            const t = i / particlesCount;
            const p = t * perimeter;
            let x, y, z;

            if (p < rect.width) { // Top
                const ratio = p / rect.width;
                x = THREE.MathUtils.lerp(tl.x, tr.x, ratio);
                y = THREE.MathUtils.lerp(tl.y, tr.y, ratio);
                z = THREE.MathUtils.lerp(tl.z, tr.z, ratio);
            } else if (p < rect.width + rect.height) { // Right
                const ratio = (p - rect.width) / rect.height;
                x = THREE.MathUtils.lerp(tr.x, br.x, ratio);
                y = THREE.MathUtils.lerp(tr.y, br.y, ratio);
                z = THREE.MathUtils.lerp(tr.z, br.z, ratio);
            } else if (p < rect.width * 2 + rect.height) { // Bottom
                const ratio = (p - (rect.width + rect.height)) / rect.width;
                x = THREE.MathUtils.lerp(br.x, bl.x, ratio);
                y = THREE.MathUtils.lerp(br.y, bl.y, ratio);
                z = THREE.MathUtils.lerp(br.z, bl.z, ratio);
            } else { // Left
                const ratio = (p - (rect.width * 2 + rect.height)) / rect.height;
                x = THREE.MathUtils.lerp(bl.x, tl.x, ratio);
                y = THREE.MathUtils.lerp(bl.y, tl.y, ratio);
                z = THREE.MathUtils.lerp(bl.z, tl.z, ratio);
            }

            highlightTarget.push(x + highlightOffsets[i * 3]);
            highlightTarget.push(y + highlightOffsets[i * 3 + 1]);
            highlightTarget.push(z + highlightOffsets[i * 3 + 2]);
        }

        // Fill remaining
        while (highlightTarget.length < particlesCount * 3) {
            highlightTarget.push((Math.random() - 0.5) * 20);
        }

        // Trigger transition
        transitionTo(highlightTarget, false, 1.5);

        // Enable Tracking
        activeHighlightElement = element;
    };

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    // Physics State for Antigravity Effect
    const particleVelocities = new Float32Array(particlesCount * 3);

    // Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Calculate Mouse World Position
        const dist = camera.position.z;
        const vHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;
        const vWidth = vHeight * camera.aspect;
        const mouseWorldX = mouseX * vWidth;
        const mouseWorldY = -mouseY * vHeight;

        // Update Highlight Targets if Active (Tracking)
        if (activeHighlightElement) {
            const rect = activeHighlightElement.getBoundingClientRect();
            const tl = get3DPos(rect.left, rect.top);
            const tr = get3DPos(rect.right, rect.top);
            const bl = get3DPos(rect.left, rect.bottom);
            const br = get3DPos(rect.right, rect.bottom);
            const perimeter = (rect.width + rect.height) * 2;

            // Animation: particles move around the border
            // Offset increases with time, making particles "walk" around the border
            const animationSpeed = 0.05; // Speed of movement (adjust for faster/slower)
            const animationOffset = (elapsedTime * animationSpeed * perimeter) % perimeter;

            // We update targetPositions in place
            // targetPositions is the array passed to transitionTo, so it's the one we want to update

            for (let i = 0; i < particlesCount; i++) {
                const t = i / particlesCount;
                // Add animation offset to create movement
                let p = (t * perimeter + animationOffset) % perimeter;
                let x, y, z;

                if (p < rect.width) { // Top
                    const ratio = p / rect.width;
                    x = THREE.MathUtils.lerp(tl.x, tr.x, ratio);
                    y = THREE.MathUtils.lerp(tl.y, tr.y, ratio);
                    z = THREE.MathUtils.lerp(tl.z, tr.z, ratio);
                } else if (p < rect.width + rect.height) { // Right
                    const ratio = (p - rect.width) / rect.height;
                    x = THREE.MathUtils.lerp(tr.x, br.x, ratio);
                    y = THREE.MathUtils.lerp(tr.y, br.y, ratio);
                    z = THREE.MathUtils.lerp(tr.z, br.z, ratio);
                } else if (p < rect.width * 2 + rect.height) { // Bottom
                    const ratio = (p - (rect.width + rect.height)) / rect.width;
                    x = THREE.MathUtils.lerp(br.x, bl.x, ratio);
                    y = THREE.MathUtils.lerp(br.y, bl.y, ratio);
                    z = THREE.MathUtils.lerp(br.z, bl.z, ratio);
                } else { // Left
                    const ratio = (p - (rect.width * 2 + rect.height)) / rect.height;
                    x = THREE.MathUtils.lerp(bl.x, tl.x, ratio);
                    y = THREE.MathUtils.lerp(bl.y, tl.y, ratio);
                    z = THREE.MathUtils.lerp(bl.z, tl.z, ratio);
                }

                // Update target position
                targetPositions[i * 3] = x + highlightOffsets[i * 3];
                targetPositions[i * 3 + 1] = y + highlightOffsets[i * 3 + 1];
                targetPositions[i * 3 + 2] = z + highlightOffsets[i * 3 + 2];
            }
        }

        // Update Particles
        const positions = particlesGeometry.attributes.position.array;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;

            // 1. Base Interpolation (Morphing)
            let targetX = THREE.MathUtils.lerp(startPositions[i3], targetPositions[i3], transitionState.progress);
            let targetY = THREE.MathUtils.lerp(startPositions[i3 + 1], targetPositions[i3 + 1], transitionState.progress);
            let targetZ = THREE.MathUtils.lerp(startPositions[i3 + 2], targetPositions[i3 + 2], transitionState.progress);

            // 2. Antigravity / Repulsion Logic
            // Calculate distance from mouse to particle's target position
            const dx = mouseWorldX - targetX;
            const dy = mouseWorldY - targetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const repulsionRadius = 2;

            if (distance < repulsionRadius) {
                const force = (repulsionRadius - distance) / repulsionRadius;
                const angle = Math.atan2(dy, dx);

                // Push away
                particleVelocities[i3] -= Math.cos(angle) * force * 0.5;
                particleVelocities[i3 + 1] -= Math.sin(angle) * force * 0.5;
                particleVelocities[i3 + 2] += force * 0.5; // Also push in Z for 3D feel
            }

            // 3. Apply Velocity & Damping (Spring-like return to target)
            // Pull back to target
            const currentX = positions[i3];
            const currentY = positions[i3 + 1];
            const currentZ = positions[i3 + 2];

            // Adjust spring strength based on mode
            // Stiffer spring for highlight mode to "stick" better
            const springStrength = activeHighlightElement ? 0.1 : 0.02;

            // Spring force towards target
            particleVelocities[i3] += (targetX - currentX) * springStrength;
            particleVelocities[i3 + 1] += (targetY - currentY) * springStrength;
            particleVelocities[i3 + 2] += (targetZ - currentZ) * springStrength;

            // Damping (friction)
            particleVelocities[i3] *= 0.85;
            particleVelocities[i3 + 1] *= 0.85;
            particleVelocities[i3 + 2] *= 0.85;

            // Apply velocity
            positions[i3] += particleVelocities[i3];
            positions[i3 + 1] += particleVelocities[i3 + 1];
            positions[i3 + 2] += particleVelocities[i3 + 2];
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        // Rotation Logic
        if (isGA) {
            // Continuous rotation for DNA
            particlesMesh.rotation.x = elapsedTime * 0.2;
            particlesMesh.rotation.y = 0;
            particlesMesh.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
        } else {
            // Interactive rotation for others
            targetRotationY = mouseX * 0.2;
            targetRotationX = mouseY * 0.2;

            particlesMesh.rotation.y += (targetRotationY - particlesMesh.rotation.y) * 0.05;
            particlesMesh.rotation.x += (targetRotationX - particlesMesh.rotation.x) * 0.05;
        }

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    }

    tick();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Hamburger Menu Toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking nav link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Card Glow Effect
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // SPA Navigation Logic
    async function loadPage(url, pushState = true) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const html = await response.text();

            // Parse the fetched HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Update Title
            document.title = doc.title;

            // Replace Container Content
            const newContent = doc.querySelector('.container').innerHTML;
            document.querySelector('.container').innerHTML = newContent;

            // Execute Scripts from the new page
            // We look for scripts in the fetched document that are not in the current document
            // Or simply re-execute scripts found in the container or specifically marked blocks
            // For this project, scripts are usually in {% block scripts %} which ends up at the bottom of body
            // We will look for scripts that are NOT main.js or libraries
            const newScripts = doc.querySelectorAll('script');
            const oldScripts = document.querySelectorAll('script');

            newScripts.forEach(newScript => {
                // Skip if it's an external library we already have (naive check)
                if (newScript.src && (newScript.src.includes('three.min.js') || newScript.src.includes('main.js') || newScript.src.includes('gsap.min.js'))) return;

                const script = document.createElement('script');
                if (newScript.src) {
                    script.src = newScript.src;
                } else {
                    script.textContent = newScript.textContent;
                }
                document.body.appendChild(script);
            });

            // Update URL
            if (pushState) {
                window.history.pushState({}, '', url);
            }

            // Trigger 3D Transition
            const path = new URL(url, window.location.origin).pathname;
            if (path.includes('/ga')) {
                transitionTo(targets.dna, true);
            } else if (path.includes('/fuzzy') || path.includes('/sugeno')) {
                transitionTo(targets.sphere, false);
            } else if (path.includes('/nn')) {
                transitionTo(targets.neuron, false);
            } else {
                transitionTo(targets.random, false);
            }

            // Re-attach Card Glow Effects for new content
            const newCards = document.querySelectorAll('.glass-card');
            newCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);
                });
            });

            // Re-render MathJax if present
            if (window.MathJax) {
                MathJax.typesetPromise();
            }

        } catch (error) {
            console.error('Error loading page:', error);
            window.location.href = url; // Fallback to normal load
        }
    }

    // Intercept Nav Links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href.startsWith(window.location.origin) && !link.hash) {
            e.preventDefault();
            loadPage(link.href);
        }
    });

    // Handle Back/Forward Button
    window.addEventListener('popstate', () => {
        loadPage(window.location.href, false);
    });

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check Local Storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        updateParticleColor(savedTheme);
        if (themeToggleBtn) themeToggleBtn.textContent = savedTheme === 'light' ? '☀️' : '🌙';
    }

    function updateParticleColor(theme) {
        if (theme === 'light') {
            material.color.setHex(0x00a8a8); // Darker Cyan for Light Mode
        } else {
            material.color.setHex(0x00f2ea); // Bright Cyan for Dark Mode
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggleBtn.textContent = newTheme === 'light' ? '☀️' : '🌙';

            updateParticleColor(newTheme);
        });
    }
});
