/**
 * 3D Product Showcase
 * Split-screen hero with two 3D product models and distinct accent lighting
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ProductShowcase {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('canvas');
    this.loadingEl = container.querySelector('[id^="loading-"]');

    // Parse panel configuration from data attribute
    this.panels = JSON.parse(container.dataset.panels || '[]');

    // Scene state
    this.scenes = [];
    this.models = [];
    this.isHovered = [false, false];
    this.rotationSpeed = 0.3;
    this.clock = new THREE.Clock();
    this.isMobile = window.innerWidth < 768;

    // Initialize
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScenes();
    this.setupCamera();
    this.loadModels();
    this.setupEventListeners();
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setScissorTest(true);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  setupScenes() {
    // Create two scenes with different lighting
    this.panels.forEach((panel, index) => {
      const scene = new THREE.Scene();

      // Parse accent color
      const accentColor = new THREE.Color(panel.accentColor);

      // Create gradient background
      const bgColor = accentColor.clone().multiplyScalar(0.15);
      scene.background = bgColor;

      // Ambient light (low intensity base)
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);

      // Hemisphere light for natural fill
      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
      hemi.position.set(0, 20, 0);
      scene.add(hemi);

      // Main accent spotlight
      const spotlight = new THREE.SpotLight(accentColor, 3);
      spotlight.position.set(5, 10, 7);
      spotlight.angle = Math.PI / 4;
      spotlight.penumbra = 0.5;
      spotlight.decay = 2;
      spotlight.distance = 50;
      spotlight.castShadow = false; // Disable for performance
      scene.add(spotlight);

      // Secondary accent light from opposite side
      const accentLight = new THREE.PointLight(accentColor, 1.5, 20);
      accentLight.position.set(-5, 3, -5);
      scene.add(accentLight);

      // Rim light for depth
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
      rimLight.position.set(-5, 5, -10);
      scene.add(rimLight);

      // Front fill light
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(0, 2, 10);
      scene.add(fillLight);

      this.scenes.push(scene);
    });
  }

  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 2, 6);
    this.camera.lookAt(0, 0, 0);
  }

  loadModels() {
    const loader = new GLTFLoader();
    let loadedCount = 0;

    this.panels.forEach((panel, index) => {
      // For now, create placeholder geometry
      // Replace with actual model loading when .glb files are available
      this.createPlaceholderModel(index, panel);
      loadedCount++;

      if (loadedCount === this.panels.length) {
        this.onModelsLoaded();
      }

      /*
      // Uncomment when real models are available:
      const modelUrl = panel.model === 'kosher'
        ? '/cdn/shop/files/board-kosher.glb'
        : '/cdn/shop/files/board-nonkosher.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;

          model.position.sub(center);
          model.scale.setScalar(scale);

          this.models[index] = model;
          this.scenes[index].add(model);

          loadedCount++;
          if (loadedCount === this.panels.length) {
            this.onModelsLoaded();
          }
        },
        (progress) => {
          console.log(`Loading model ${index}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        },
        (error) => {
          console.error(`Error loading model ${index}:`, error);
          this.createPlaceholderModel(index, panel);
          loadedCount++;
          if (loadedCount === this.panels.length) {
            this.onModelsLoaded();
          }
        }
      );
      */
    });
  }

  createPlaceholderModel(index, panel) {
    // Create a placeholder board-like shape
    const group = new THREE.Group();

    // Board base (rounded rectangle approximation)
    const boardGeometry = new THREE.BoxGeometry(3, 0.15, 2, 1, 1, 1);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.1
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    group.add(board);

    // Add some placeholder "food" items
    const itemColors = [0xFFD700, 0xFF6B6B, 0x98D8C8, 0xF7DC6F, 0xBB8FCE];
    const itemPositions = [
      [-0.8, 0.2, -0.5], [-0.3, 0.15, 0.3], [0.5, 0.2, -0.3],
      [0.9, 0.15, 0.4], [-0.5, 0.18, 0.6], [0.2, 0.22, -0.6]
    ];

    itemPositions.forEach((pos, i) => {
      const size = 0.15 + Math.random() * 0.15;
      const geometry = Math.random() > 0.5
        ? new THREE.SphereGeometry(size, 16, 16)
        : new THREE.CylinderGeometry(size, size, size * 0.5, 16);

      const material = new THREE.MeshStandardMaterial({
        color: itemColors[i % itemColors.length],
        roughness: 0.5,
        metalness: 0.1
      });

      const item = new THREE.Mesh(geometry, material);
      item.position.set(pos[0], pos[1], pos[2]);
      if (geometry.type === 'CylinderGeometry') {
        item.rotation.x = Math.PI / 2;
      }
      group.add(item);
    });

    // Add saran wrap effect (transparent plane)
    const wrapGeometry = new THREE.PlaneGeometry(3.2, 2.2);
    const wrapMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.1,
      side: THREE.DoubleSide
    });
    const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
    wrap.position.y = 0.35;
    wrap.rotation.x = -Math.PI / 2;
    group.add(wrap);

    // Position the group
    group.rotation.x = -0.2;

    this.models[index] = group;
    this.scenes[index].add(group);
  }

  onModelsLoaded() {
    // Hide loading indicator
    if (this.loadingEl) {
      this.loadingEl.style.opacity = '0';
      setTimeout(() => {
        this.loadingEl.style.display = 'none';
      }, 300);
    }
  }

  setupEventListeners() {
    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Hover detection for each panel
    const panels = this.container.querySelectorAll('.hero-3d-showcase__panel');
    panels.forEach((panel, index) => {
      panel.addEventListener('mouseenter', () => {
        this.isHovered[index] = true;
      });
      panel.addEventListener('mouseleave', () => {
        this.isHovered[index] = false;
      });
    });

    // Also detect hover on canvas regions
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.isHovered = [false, false];
    });
  }

  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isMobile) {
      // Vertical split
      const midY = rect.height / 2;
      this.isHovered[0] = y < midY;
      this.isHovered[1] = y >= midY;
    } else {
      // Horizontal split
      const midX = rect.width / 2;
      this.isHovered[0] = x < midX;
      this.isHovered[1] = x >= midX;
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.isMobile = window.innerWidth < 768;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Rotate models
    this.models.forEach((model, index) => {
      if (model && !this.isHovered[index]) {
        model.rotation.y += this.rotationSpeed * delta;
      }
    });

    // Render both viewports
    this.render();
  }

  render() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.setScissorTest(true);

    if (this.isMobile) {
      // Mobile: Top and bottom viewports
      const halfHeight = Math.floor(height / 2);

      // Top viewport (first panel)
      this.renderer.setViewport(0, halfHeight, width, halfHeight);
      this.renderer.setScissor(0, halfHeight, width, halfHeight);
      this.renderer.render(this.scenes[0], this.camera);

      // Bottom viewport (second panel)
      if (this.scenes[1]) {
        this.renderer.setViewport(0, 0, width, halfHeight);
        this.renderer.setScissor(0, 0, width, halfHeight);
        this.renderer.render(this.scenes[1], this.camera);
      }
    } else {
      // Desktop: Left and right viewports
      const halfWidth = Math.floor(width / 2);

      // Left viewport (first panel)
      this.renderer.setViewport(0, 0, halfWidth, height);
      this.renderer.setScissor(0, 0, halfWidth, height);
      this.renderer.render(this.scenes[0], this.camera);

      // Right viewport (second panel)
      if (this.scenes[1]) {
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.render(this.scenes[1], this.camera);
      }
    }
  }

  destroy() {
    // Cleanup
    this.renderer.dispose();
    this.scenes.forEach(scene => {
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    });
  }
}

// Initialize all showcase sections on the page
function initShowcases() {
  const containers = document.querySelectorAll('[data-section-type="hero-3d-showcase"]');

  containers.forEach(container => {
    // Check if already initialized
    if (!container.dataset.initialized) {
      new ProductShowcase(container);
      container.dataset.initialized = 'true';
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShowcases);
} else {
  initShowcases();
}

// Re-initialize on Shopify section events (for theme editor)
document.addEventListener('shopify:section:load', (event) => {
  const section = event.target;
  if (section.querySelector('[data-section-type="hero-3d-showcase"]')) {
    initShowcases();
  }
});
