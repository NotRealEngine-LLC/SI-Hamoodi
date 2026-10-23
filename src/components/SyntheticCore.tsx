// HAMOODI SyntheTech Intelligence — Synthetic Core Visualization
// Part 01: Three.js Interactive Intelligence Reactor

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface SyntheticCoreProps {
  className?: string;
  interactive?: boolean;
}

export function SyntheticCore({ className = '', interactive = true }: SyntheticCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported');
        return;
      }
    } catch (e) {
      console.warn('WebGL check failed:', e);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    
    // Clamp DPR for performance
    const dpr = Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Core nucleus
    const nucleusGeometry = new THREE.IcosahedronGeometry(0.8, 2);
    const nucleusMaterial = new THREE.MeshPhongMaterial({
      color: 0x9378ff,
      emissive: 0x9378ff,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    scene.add(nucleus);

    // Inner geometric mesh
    const innerGeometry = new THREE.OctahedronGeometry(0.6, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x52dad5,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    // Orbital rings
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.3, 0.02, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x9378ff : i === 1 ? 0x52dad5 : 0xc2f58d,
        transparent: true,
        opacity: 0.6 - i * 0.15,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * Math.PI) / 6;
      ring.rotation.y = (i * Math.PI) / 4;
      scene.add(ring);
      rings.push(ring);
    }

    // Point constellation
    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 100;
    const positions = new Float32Array(pointsCount * 3);
    
    for (let i = 0; i < pointsCount; i++) {
      const radius = 2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x52dad5,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // Connection lines
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x9378ff,
      transparent: true,
      opacity: 0.2,
    });

    for (let i = 0; i < 20; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      const startIdx = Math.floor(Math.random() * pointsCount);
      const endIdx = Math.floor(Math.random() * pointsCount);
      
      const linePositions = new Float32Array([
        positions[startIdx * 3],
        positions[startIdx * 3 + 1],
        positions[startIdx * 3 + 2],
        positions[endIdx * 3],
        positions[endIdx * 3 + 1],
        positions[endIdx * 3 + 2],
      ]);
      
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const line = new THREE.Line(lineGeometry, linesMaterial);
      scene.add(line);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x9378ff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x52dad5, 0.5, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      targetRotationRef.current.x = mouseRef.current.y * 0.3;
      targetRotationRef.current.y = mouseRef.current.x * 0.3;
    };

    const handleMouseLeave = () => {
      targetRotationRef.current.x = 0;
      targetRotationRef.current.y = 0;
    };

    if (interactive) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth rotation interpolation
      nucleus.rotation.x += (targetRotationRef.current.x - nucleus.rotation.x) * 0.05;
      nucleus.rotation.y += (targetRotationRef.current.y - nucleus.rotation.y) * 0.05;
      
      innerMesh.rotation.x = time * 0.5;
      innerMesh.rotation.y = time * 0.3;

      // Orbital ring rotation
      rings.forEach((ring, i) => {
        ring.rotation.z = time * (0.2 + i * 0.1);
      });

      // Point constellation rotation
      points.rotation.y = time * 0.1;
      points.rotation.x = time * 0.05;

      // Pulsing effect
      const scale = 1 + Math.sin(time * 2) * 0.05;
      nucleus.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Visibility API - pause when hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        if (!animationFrameRef.current) {
          animate();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (interactive && containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }

      // Dispose Three.js resources
      if (renderer) {
        renderer.dispose();
      }
      
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Fallback SVG for when WebGL is not available
export function SyntheticCoreFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Core nucleus */}
        <circle cx="200" cy="200" r="60" fill="url(#nucleusGradient)" opacity="0.9" />
        
        {/* Inner geometric mesh */}
        <polygon
          points="200,150 240,200 200,250 160,200"
          fill="none"
          stroke="#52dad5"
          strokeWidth="2"
          opacity="0.4"
        />
        
        {/* Orbital rings */}
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="120"
          fill="none"
          stroke="#9378ff"
          strokeWidth="2"
          opacity="0.6"
          transform="rotate(30 200 200)"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="140"
          ry="140"
          fill="none"
          stroke="#52dad5"
          strokeWidth="2"
          opacity="0.5"
          transform="rotate(60 200 200)"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="160"
          ry="160"
          fill="none"
          stroke="#c2f58d"
          strokeWidth="2"
          opacity="0.4"
          transform="rotate(90 200 200)"
        />
        
        {/* Point constellation */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const radius = 100 + Math.random() * 60;
          const x = 200 + Math.cos(angle) * radius;
          const y = 200 + Math.sin(angle) * radius;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="#52dad5"
              opacity="0.6"
            />
          );
        })}
        
        {/* Gradients */}
        <defs>
          <radialGradient id="nucleusGradient">
            <stop offset="0%" stopColor="#9378ff" />
            <stop offset="100%" stopColor="#52dad5" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
