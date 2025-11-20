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
        posArray[i] = (Math.random() - 0.5) * 25;
        targets.random.push(posArray[i]);
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
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 8;

    // Determine Target Shape based on URL
    const path = window.location.pathname;
    let currentTarget = targets.random;
    let isGA = false;

    if (path.includes('/ga')) {
        currentTarget = targets.dna;
        isGA = true;
    }
    else if (path.includes('/fuzzy') || path.includes('/sugeno')) currentTarget = targets.sphere;
    else if (path.includes('/nn')) currentTarget = targets.neuron;

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Morphing Logic
        const positions = particlesGeometry.attributes.position.array;
        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] += (currentTarget[i] - positions[i]) * 0.03;
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        // Rotation Logic
        if (isGA) {
            particlesMesh.rotation.x = elapsedTime * 0.2;
            particlesMesh.rotation.y = 0;
            particlesMesh.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
        } else {
            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.x += (mouseY * 0.5 - particlesMesh.rotation.x) * 0.05;
            particlesMesh.rotation.y += (mouseX * 0.5) * 0.05;
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
});
