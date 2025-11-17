// BAMS 3D Visualization
let scene, camera, renderer, controls, bamsData = {};

async function init3DView() {
    try {
        // Load BAMS data from explorer endpoint
        const response = await fetch(`${window.location.origin}/api/explorer`);
        if (!response.ok) {
            throw new Error(`Failed to load explorer data: ${response.status} ${response.statusText}`);
        }
        bamsData = await response.json();
        
        // Setup Three.js scene
        setupScene();
        
        // Create 3D visualization
        createBAMSStructure();
        
        // Start animation loop
        animate();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
        
        // Hide loading message
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error('Error initializing 3D view:', error);
        document.getElementById('loading').textContent = 'Error loading 3D visualization: ' + error.message;
    }
}

function setupScene() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Camera setup
    const container = document.getElementById('3d-container');
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 20, 30);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    scene.add(gridHelper);
}

function createBAMSStructure() {
    // Create department nodes
    const departments = Object.values(bamsData.departments || {});
    const deptSpacing = 15;
    
    departments.forEach((dept, index) => {
        // Get department name from transactions if available
        const deptName = dept.chain?.find(tx => tx.transactions?.type === 'CREATE_DEPARTMENT')?.transactions?.name || dept.id;
        
        // Department node
        const deptGeometry = new THREE.SphereGeometry(2, 32, 32);
        const deptMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3498db,
            transparent: true,
            opacity: 0.9
        });
        const deptNode = new THREE.Mesh(deptGeometry, deptMaterial);
        deptNode.position.x = (index - departments.length / 2) * deptSpacing;
        deptNode.position.y = 10;
        deptNode.castShadow = true;
        scene.add(deptNode);
        
        // Department label
        addText(deptName, deptNode.position.x, 10, deptNode.position.z - 2.5, 0.5);
        
        // Create class nodes for this department
        const classes = Object.values(bamsData.classes || {}).filter(cls => {
            const classData = cls.chain?.find(tx => tx.transactions?.type === 'CREATE_CLASS');
            return classData?.transactions.departmentId === dept.id;
        });
        
        const classSpacing = 8;
        classes.forEach((cls, clsIndex) => {
            const classData = cls.chain?.find(tx => tx.transactions?.type === 'CREATE_CLASS')?.transactions || {};
            
            // Class node
            const classGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const classMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x2ecc71,
                transparent: true,
                opacity: 0.9
            });
            const classNode = new THREE.Mesh(classGeometry, classMaterial);
            classNode.position.x = deptNode.position.x + (clsIndex - classes.length / 2) * classSpacing;
            classNode.position.y = 5;
            classNode.position.z = (clsIndex % 2 === 0 ? 1 : -1) * 5;
            classNode.castShadow = true;
            scene.add(classNode);
            
            // Connect department to class
            createConnection(
                deptNode.position.x, deptNode.position.y, deptNode.position.z,
                classNode.position.x, classNode.position.y, classNode.position.z,
                0x7f8c8d
            );
            
            // Class label
            addText(
                classData.name || cls.id, 
                classNode.position.x, 
                5, 
                classNode.position.z - 1.5, 
                0.3
            );
            
            // Create student nodes for this class
            const students = Object.values(bamsData.students || {}).filter(student => {
                const studentData = student.chain?.find(tx => tx.transactions?.type === 'CREATE_STUDENT');
                return studentData?.transactions.classId === cls.id;
            });
            
            students.forEach((student, studentIndex) => {
                const studentData = student.chain?.find(tx => tx.transactions?.type === 'CREATE_STUDENT')?.transactions || {};
                
                // Student node
                const studentGeometry = new THREE.ConeGeometry(0.8, 2, 4);
                const studentMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0xe74c3c,
                    transparent: true,
                    opacity: 0.9
                });
                const studentNode = new THREE.Mesh(studentGeometry, studentMaterial);
                studentNode.position.x = classNode.position.x + (studentIndex % 5 - 2) * 1.5;
                studentNode.position.y = 0.5;
                studentNode.position.z = classNode.position.z + (Math.floor(studentIndex / 5) - 1) * 2;
                studentNode.rotation.x = Math.PI / 2;
                studentNode.castShadow = true;
                scene.add(studentNode);
                
                // Connect class to student
                createConnection(
                    classNode.position.x, classNode.position.y, classNode.position.z,
                    studentNode.position.x, studentNode.position.y + 1, studentNode.position.z,
                    0x95a5a6
                );
                
                // Student label
                if (studentIndex < 5) { // Only show labels for first few students to avoid clutter
                    addText(
                        studentData.name || student.id, 
                        studentNode.position.x, 
                        0.5, 
                        studentNode.position.z - 0.5, 
                        0.2
                    );
                }
            });
        });
    });
}

function createConnection(x1, y1, z1, x2, y2, z2, color) {
    const material = new THREE.LineBasicMaterial({ color: color, opacity: 0.5, transparent: true });
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x2, y2, z2)
    ]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}

function addText(text, x, y, z, size = 1) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = '#000000';
    context.font = 'Bold ' + (20 * size) + 'px Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(5 * size, 2.5 * size, 1);
    scene.add(sprite);
}

function onWindowResize() {
    const container = document.getElementById('3d-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Export for HTML usage
window.init3DView = init3DView;
