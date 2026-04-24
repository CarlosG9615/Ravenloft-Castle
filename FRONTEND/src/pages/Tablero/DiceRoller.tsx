import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import './DiceRoller.css';

interface Props {
  dado: string | null;
  resultado: number | null;
  onAnimacionFin: () => void;
}

interface DiceState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export function DiceRoller({ dado, resultado, onAnimacionFin }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diceRef = useRef<THREE.Mesh | null>(null);
  const diceStateRef = useRef<DiceState>({
    position: { x: 0, y: 2, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });
  const animationIdRef = useRef<number | null>(null);
  const [animando, setAnimando] = useState(false);
  const callbackRef = useRef(onAnimacionFin);
  const isSettledRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onAnimacionFin;
  }, [onAnimacionFin]);

  // Inicializar Three.js (se ejecuta una sola vez)
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;

    try {
      // 1. Escena
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a1a);

      // 2. Cámara
      const width = 600;
      const height = 600;
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(3, 4, 5);
      camera.lookAt(0, 0, 0);

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. Iluminación
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);

      // 5. Mesa
      const floorGeometry = new THREE.PlaneGeometry(10, 10);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2e7d32,
        metalness: 0.1,
        roughness: 0.8,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      scene.add(floor);

      // 6. Dado
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        metalness: 0.4,
        roughness: 0.3,
      });
      const dice = new THREE.Mesh(geometry, material);
      dice.castShadow = true;
      dice.receiveShadow = true;
      dice.position.set(0, 2, 0);
      scene.add(dice);
      diceRef.current = dice;

      // 7. Loop de animación
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);

        if (diceRef.current && !isSettledRef.current) {
          const state = diceStateRef.current;

          // Gravedad
          state.velocity.y -= 0.015;

          // Aplicar velocidad
          state.position.x += state.velocity.x;
          state.position.y += state.velocity.y;
          state.position.z += state.velocity.z;

          // Fricción
          state.velocity.x *= 0.98;
          state.velocity.z *= 0.98;

          // Colisión con mesa
          if (state.position.y <= 0.5) {
            state.position.y = 0.5;
            state.velocity.y *= -0.5;
            state.velocity.x *= 0.7;
            state.velocity.z *= 0.7;
          }

          // Rotación
          state.rotation.x += state.angularVelocity.x;
          state.rotation.y += state.angularVelocity.y;
          state.rotation.z += state.angularVelocity.z;

          // Desaceleración angular
          state.angularVelocity.x *= 0.99;
          state.angularVelocity.y *= 0.99;
          state.angularVelocity.z *= 0.99;

          // Aplicar al mesh
          diceRef.current.position.set(state.position.x, state.position.y, state.position.z);
          diceRef.current.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z);

          // Detectar estabilización
          const speed = Math.sqrt(
            state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
          );
          const angularSpeed = Math.sqrt(
            state.angularVelocity.x ** 2 + state.angularVelocity.y ** 2 + state.angularVelocity.z ** 2
          );

          if (speed < 0.01 && angularSpeed < 0.01 && state.position.y <= 0.55) {
            isSettledRef.current = true;
            state.velocity = { x: 0, y: 0, z: 0 };
            state.angularVelocity = { x: 0, y: 0, z: 0 };
          }
        }

        renderer.render(scene, camera);
      };

      animate();
      console.log('✅ Three.js inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Three.js:', error);
    }

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // Lanzar dado
  useEffect(() => {
    if (!dado || !diceRef.current) return;

    console.log(`🎲 Lanzando ${dado}`);
    setAnimando(true);
    isSettledRef.current = false;

    // Resetear
    const state = diceStateRef.current;
    state.position = { x: 0, y: 2, z: 0 };
    state.velocity = {
      x: (Math.random() - 0.5) * 0.3,
      y: 0,
      z: (Math.random() - 0.5) * 0.3,
    };
    state.angularVelocity = {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2,
    };
    state.rotation = { x: 0, y: 0, z: 0 };

    diceRef.current.position.set(state.position.x, state.position.y, state.position.z);

    // Esperar a estabilización
    const checkSettled = () => {
      if (isSettledRef.current) {
        setTimeout(() => {
          console.log(`✅ Dado estabilizado: ${resultado}`);
          setAnimando(false);
          callbackRef.current();
        }, 500);
      } else {
        requestAnimationFrame(checkSettled);
      }
    };

    checkSettled();
  }, [dado, resultado]);

  // Renderizar siempre (oculto cuando no se usa)
  return createPortal(
    <div className={`dr-overlay ${animando ? 'active' : 'hidden'}`}>
      <div className="dr-content">
        <div ref={containerRef} className="dr-canvas-container" />
        {resultado !== null && (
          <div className="dr-resultado">
            <h2 className="dr-resultado-num">{resultado}</h2>
            <p className="dr-resultado-dado">{dado}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}