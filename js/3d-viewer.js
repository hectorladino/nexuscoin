let scene, camera, renderer, cube, controls;

function init3DViewer() {
    const container = document.getElementById('3d-viewer-container');
    if (!container || container.childElementCount > 0) return; // No re-inicializar

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Cámara
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Geometría del bloque (dimensiones aproximadas)
    const geometry = new THREE.BoxGeometry(4, 2, 1.8); // Largo: 40cm, Alto: 20cm, Ancho: 18cm (más realista para un ladrillo)

    // Textura de ladrillo
    const textureLoader = new THREE.TextureLoader();
    const brickTexture = textureLoader.load('assets/ladrillo.jpg');

    // Material con textura
    const material = new THREE.MeshStandardMaterial({ map: brickTexture });

    // Cubo
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Controles
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Animación
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Redimensionar
    window.addEventListener('resize', () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}
