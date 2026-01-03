/**
 * 3D Product Showcase - Scroll-Driven Version
 * Fixed canvas with scroll-responsive 3D content
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ProductShowcase {
  constructor(container) {
    this.container = container;
    this.canvasWrapper = container.querySelector('[id^="canvas-wrapper-"]');
    this.canvas = container.querySelector('canvas');
    this.loadingEl = container.querySelector('[id^="loading-"]');

    // Parse panel configuration from data attribute
    this.panels = JSON.parse(container.dataset.panels || '[]');

    // Scene state
    this.scenes = [];
    this.models = [];
    this.isMobile = window.innerWidth < 768;

    // Scroll state
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.isInView = true;

    // Initialize
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScenes();
    this.setupCamera();
    this.loadModels();
    this.setupEventListeners();
    this.setupScrollObserver();
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
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setScissorTest(true);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  setupScenes() {
    // Create two scenes with different lighting (optimized for top-down view)
    this.panels.forEach((panel, index) => {
      const scene = new THREE.Scene();

      // Parse accent color
      const accentColor = new THREE.Color(panel.accentColor);

      // Create darker background based on accent
      const bgColor = accentColor.clone().multiplyScalar(0.12);
      scene.background = bgColor;

      // Ambient light - increased for top-down view
      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambient);

      // Hemisphere light for natural fill (sky/ground)
      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
      hemi.position.set(0, 20, 0);
      scene.add(hemi);

      // Main light from above and slightly front
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(0, 10, 3);
      scene.add(mainLight);

      // Accent spotlight from above-right
      const spotlight = new THREE.SpotLight(accentColor, 3);
      spotlight.position.set(4, 8, 4);
      spotlight.angle = Math.PI / 4;
      spotlight.penumbra = 0.6;
      spotlight.decay = 2;
      spotlight.distance = 30;
      spotlight.castShadow = false;
      scene.add(spotlight);

      // Secondary accent light from above-left
      const accentLight = new THREE.SpotLight(accentColor, 2);
      accentLight.position.set(-4, 8, -2);
      accentLight.angle = Math.PI / 5;
      accentLight.penumbra = 0.5;
      scene.add(accentLight);

      // Rim light from behind/below for edge definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
      rimLight.position.set(0, -2, -5);
      scene.add(rimLight);

      // Subtle fill from front-bottom
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(0, -1, 6);
      scene.add(fillLight);

      this.scenes.push(scene);
    });
  }

  setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    // Angled view to see the scroll-driven tumble rotation around Z-axis
    // Camera positioned to show the board flipping/tumbling as user scrolls
    this.camera.position.set(0, 3.5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  loadModels() {
    let loadedCount = 0;

    this.panels.forEach((panel, index) => {
      // Create placeholder geometry for now
      this.createPlaceholderModel(index, panel);
      loadedCount++;

      if (loadedCount === this.panels.length) {
        this.onModelsLoaded();
      }

      /*
      // Uncomment when real models are available:
      const loader = new GLTFLoader();
      const modelUrl = panel.model === 'kosher'
        ? '/cdn/shop/files/board-kosher.glb'
        : '/cdn/shop/files/board-nonkosher.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.5 / maxDim;

          model.position.sub(center);
          model.scale.setScalar(scale);

          this.models[index] = model;
          this.scenes[index].add(model);

          loadedCount++;
          if (loadedCount === this.panels.length) {
            this.onModelsLoaded();
          }
        },
        undefined,
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
    const group = new THREE.Group();

    // Board base - slightly larger
    const boardGeometry = new THREE.BoxGeometry(3.5, 0.18, 2.3, 1, 1, 1);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.65,
      metalness: 0.05
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    group.add(board);

    // Add placeholder items - more variety
    const itemConfigs = [
      { pos: [-1.0, 0.22, -0.6], size: 0.22, color: 0xFFD700, type: 'sphere' },  // cheese
      { pos: [-0.4, 0.18, 0.4], size: 0.18, color: 0xFF6B6B, type: 'cylinder' }, // meat
      { pos: [0.6, 0.24, -0.4], size: 0.20, color: 0x98D8C8, type: 'sphere' },   // grape
      { pos: [1.1, 0.16, 0.5], size: 0.16, color: 0xF7DC6F, type: 'cylinder' },  // cracker
      { pos: [-0.6, 0.20, 0.7], size: 0.19, color: 0xBB8FCE, type: 'sphere' },   // fig
      { pos: [0.3, 0.25, -0.7], size: 0.23, color: 0xE74C3C, type: 'sphere' },   // cherry
      { pos: [0.9, 0.17, -0.2], size: 0.15, color: 0xF39C12, type: 'cylinder' }, // slice
      { pos: [-1.2, 0.19, 0.1], size: 0.17, color: 0x27AE60, type: 'sphere' },   // olive
    ];

    itemConfigs.forEach((config) => {
      let geometry;
      if (config.type === 'sphere') {
        geometry = new THREE.SphereGeometry(config.size, 20, 20);
      } else {
        geometry = new THREE.CylinderGeometry(config.size, config.size, config.size * 0.4, 20);
      }

      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.4,
        metalness: 0.1
      });

      const item = new THREE.Mesh(geometry, material);
      item.position.set(config.pos[0], config.pos[1], config.pos[2]);
      if (config.type === 'cylinder') {
        item.rotation.x = Math.PI / 2;
      }
      group.add(item);
    });

    // Saran wrap effect - subtle transparent overlay
    const wrapGeometry = new THREE.PlaneGeometry(3.7, 2.5);
    const wrapMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.95,
      thickness: 0.05,
      side: THREE.DoubleSide
    });
    const wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
    wrap.position.y = 0.4;
    wrap.rotation.x = -Math.PI / 2;
    group.add(wrap);

    // Board lies flat for top-down view - no initial rotation
    // The camera looks down from above
    group.rotation.x = 0;
    group.rotation.y = 0;
    group.rotation.z = 0;

    this.models[index] = group;
    this.scenes[index].add(group);
  }

  onModelsLoaded() {
    // Hide loading indicator
    if (this.loadingEl) {
      this.loadingEl.style.opacity = '0';
      setTimeout(() => {
        this.loadingEl.hidden = true;
      }, 400);
    }
  }

  setupEventListeners() {
    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Scroll handler for progress tracking
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Track when user has scrolled (for hiding scroll indicator)
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.container.classList.add('has-scrolled');
      }
    }, { passive: true, once: true });
  }

  setupScrollObserver() {
    // Use IntersectionObserver to pause rendering when not in view
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isInView = entry.isIntersecting;

          // Show/hide canvas wrapper based on visibility
          if (this.canvasWrapper) {
            this.canvasWrapper.style.visibility = entry.isIntersecting ? 'visible' : 'hidden';
          }
        });
      },
      { threshold: 0 }
    );

    this.observer.observe(this.container);
  }

  onScroll() {
    // Calculate scroll progress through the section
    const rect = this.container.getBoundingClientRect();
    const sectionHeight = this.container.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Progress from 0 (section at top of viewport) to 1 (section scrolled past)
    const scrolled = -rect.top;
    const totalScrollable = sectionHeight - viewportHeight;

    this.targetScrollProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.isMobile = window.innerWidth < 768;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Skip rendering when not in view for performance
    if (!this.isInView) return;

    // Smooth scroll progress interpolation for nice eased motion
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    // Scroll-driven rotation around the Z-axis (tumble/flip motion)
    // Board geometry is BoxGeometry(3.5, 0.18, 2.3) where X=length, Y=thickness, Z=width
    // Rotating around Z causes the board to tumble/flip, showing top and bottom
    // Full scroll (0 to 1) = one complete rotation (2 * PI radians)
    const targetRotationZ = this.scrollProgress * Math.PI * 2;

    this.models.forEach((model) => {
      if (model) {
        // Scroll-driven rotation around Z-axis
        // The smooth interpolation is already handled by scrollProgress
        model.rotation.z = targetRotationZ;
      }
    });

    this.render();
  }

  render() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setScissorTest(true);

    if (this.isMobile) {
      // Mobile: Top and bottom viewports
      const halfHeight = Math.floor(height / 2);

      // Top viewport (first panel)
      this.renderer.setViewport(0, halfHeight, width, halfHeight);
      this.renderer.setScissor(0, halfHeight, width, halfHeight);
      if (this.scenes[0]) {
        this.renderer.render(this.scenes[0], this.camera);
      }

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
      if (this.scenes[0]) {
        this.renderer.render(this.scenes[0], this.camera);
      }

      // Right viewport (second panel)
      if (this.scenes[1]) {
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.render(this.scenes[1], this.camera);
      }
    }
  }

  destroy() {
    // Cleanup observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // Cleanup renderer
    this.renderer.dispose();

    // Cleanup scenes
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

// Cleanup on section unload
document.addEventListener('shopify:section:unload', (event) => {
  const section = event.target;
  const container = section.querySelector('[data-section-type="hero-3d-showcase"]');
  if (container && container._showcase) {
    container._showcase.destroy();
  }
});
