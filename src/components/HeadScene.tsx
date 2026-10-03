import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useIsTouch, useReducedMotion, useTabVisible } from '../hooks'

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** slow, expensive-feeling ease (approximates cubic-bezier(.22,.61,.24,1)) */
function luxEase(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function makeAITexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, '#0a1430')
  g.addColorStop(1, '#101a3e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = 'rgba(32,228,255,0.8)'
  ctx.lineWidth = 8
  ctx.strokeRect(14, 14, 228, 228)
  // circuit ticks
  ctx.strokeStyle = 'rgba(35,183,255,0.5)'
  ctx.lineWidth = 4
  for (let i = 40; i < 230; i += 36) {
    ctx.beginPath()
    ctx.moveTo(i, 14)
    ctx.lineTo(i, 36)
    ctx.moveTo(i, 242)
    ctx.lineTo(i, 220)
    ctx.stroke()
  }
  ctx.font = '900 118px Heebo, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#23B7FF'
  ctx.shadowBlur = 28
  ctx.fillStyle = '#ffffff'
  ctx.fillText('AI', 128, 136)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const HEAD_SCALE: [number, number, number] = [0.92, 1.1, 1.18]

/* ------------------------------------------------------------------ */
/* inner AI brain                                                      */
/* ------------------------------------------------------------------ */

function Brain({ openRef, lowDetail }: { openRef: React.MutableRefObject<number>; lowDetail: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const ringA = useRef<THREE.Mesh>(null!)
  const ringB = useRef<THREE.Mesh>(null!)
  const ringC = useRef<THREE.Mesh>(null!)
  const core = useRef<THREE.Mesh>(null!)
  const chip = useRef<THREE.Mesh>(null!)
  const pulsesRef = useRef<THREE.Points>(null!)
  const glowLight = useRef<THREE.PointLight>(null!)

  const aiTex = useMemo(() => makeAITexture(), [])

  /* neural strands inside the skull + 3 curves escaping out the open back */
  const strands = useMemo(() => {
    const curves: THREE.CatmullRomCurve3[] = []
    const rng = (s: number) => () => {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
    const rand = rng(42)
    const n = lowDetail ? 7 : 13
    for (let i = 0; i < n; i++) {
      const pts: THREE.Vector3[] = []
      for (let j = 0; j < 5; j++) {
        pts.push(
          new THREE.Vector3((rand() - 0.5) * 1.3, (rand() - 0.5) * 1.3, (rand() - 0.5) * 1.3).setLength(
            0.25 + rand() * 0.55,
          ),
        )
      }
      curves.push(new THREE.CatmullRomCurve3(pts))
    }
    // outward data streams through the rear opening (-z)
    for (let i = 0; i < 3; i++) {
      curves.push(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.08, -0.1),
          new THREE.Vector3((i - 1) * 0.25, 0.15 - i * 0.1, -0.7),
          new THREE.Vector3((i - 1) * 0.55, 0.1 - i * 0.18, -1.5),
          new THREE.Vector3((i - 1) * 0.8, -i * 0.12, -2.3),
        ]),
      )
    }
    return curves
  }, [lowDetail])

  const strandGeos = useMemo(
    () => strands.map((c) => new THREE.TubeGeometry(c, 28, 0.008, 5, false)),
    [strands],
  )

  const pulseCount = lowDetail ? 20 : 48
  const pulseData = useMemo(() => {
    return Array.from({ length: pulseCount }, (_, i) => ({
      curve: strands[i % strands.length],
      offset: Math.random(),
      speed: 0.12 + Math.random() * 0.2,
    }))
  }, [strands, pulseCount])

  const pulsePositions = useMemo(() => new Float32Array(pulseCount * 3), [pulseCount])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const open = openRef.current
    if (!group.current) return
    group.current.visible = open > 0.015
    if (!group.current.visible) return

    const s = 0.8 + open * 0.2
    group.current.scale.setScalar(s)

    ringA.current.rotation.y += delta * 0.4
    ringB.current.rotation.x += delta * 0.3
    ringC.current.rotation.z += delta * 0.25

    const corePulse = 1.4 + Math.sin(t * 2.2) * 0.5
    ;(core.current.material as THREE.MeshStandardMaterial).emissiveIntensity = corePulse * open
    if (glowLight.current) glowLight.current.intensity = open * 14
    ;(chip.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (1.2 + Math.sin(t * 3) * 0.4) * open

    // data pulses flowing brain -> AI -> outward
    const pos = pulsePositions
    for (let i = 0; i < pulseData.length; i++) {
      const p = pulseData[i]
      const u = (t * p.speed + p.offset) % 1
      p.curve.getPointAt(u, tmp)
      pos[i * 3] = tmp.x
      pos[i * 3 + 1] = tmp.y
      pos[i * 3 + 2] = tmp.z
    }
    pulsesRef.current.geometry.attributes.position.needsUpdate = true
    ;(pulsesRef.current.material as THREE.PointsMaterial).opacity = open * 0.95
  })

  return (
    <group ref={group} position={[0, 0.08, -0.3]}>
      {/* interior glow light — makes the brain visible through the opening */}
      <pointLight ref={glowLight} color="#3678FF" intensity={0} distance={6} />
      {/* glowing neural core */}
      <mesh ref={core}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color="#10204a"
          emissive="#3678FF"
          emissiveIntensity={1.4}
          roughness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* layered translucent rings */}
      <mesh ref={ringA} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.62, 0.012, 8, 64]} />
        <meshBasicMaterial color="#20E4FF" transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringB} rotation={[0.4, 0.8, 0]}>
        <torusGeometry args={[0.72, 0.01, 8, 64]} />
        <meshBasicMaterial color="#7B4DFF" transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringC} rotation={[1.2, 0.2, 0.6]}>
        <torusGeometry args={[0.8, 0.008, 8, 64]} />
        <meshBasicMaterial color="#B245FF" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* central AI processor */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <mesh ref={chip}>
          <boxGeometry args={[0.36, 0.36, 0.1]} />
          <meshStandardMaterial
            map={aiTex}
            emissive="#23B7FF"
            emissiveMap={aiTex}
            emissiveIntensity={1.2}
            color="#dfe9ff"
            roughness={0.35}
            metalness={0.5}
          />
        </mesh>
        {/* chip pins */}
        {[-0.22, 0.22].map((x) =>
          [-0.1, 0, 0.1].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.02]} />
              <meshStandardMaterial color="#9fb6ff" metalness={0.9} roughness={0.25} />
            </mesh>
          )),
        )}
      </group>

      {/* small circuitry chips scattered in the brain */}
      {[
        [0.45, 0.35, 0.1, '#20E4FF'],
        [-0.4, 0.3, -0.2, '#7B4DFF'],
        [0.3, -0.35, -0.25, '#23B7FF'],
        [-0.35, -0.25, 0.25, '#B245FF'],
        [0.1, 0.5, -0.3, '#3678FF'],
        [-0.15, -0.5, 0.05, '#20E4FF'],
      ].map(([x, y, z, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} rotation={[i, i * 0.7, 0]}>
          <boxGeometry args={[0.09, 0.09, 0.03]} />
          <meshStandardMaterial color="#0d1630" emissive={c as string} emissiveIntensity={0.9} roughness={0.4} />
        </mesh>
      ))}

      {/* fiber-optic neural strands */}
      {strandGeos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial
            color={i % 3 === 0 ? '#20E4FF' : i % 3 === 1 ? '#3678FF' : '#B245FF'}
            transparent
            opacity={0.38}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* travelling data pulses */}
      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9fdcff"
          size={0.045}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* the head                                                            */
/* ------------------------------------------------------------------ */

function Head() {
  const group = useRef<THREE.Group>(null!)
  const door = useRef<THREE.Group>(null!)

  const isTouch = useIsTouch()
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  const openRef = useRef(0) // raw progress 0..1
  const easedRef = useRef(0)

  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#eef2fb',
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#aab4cc', metalness: 0.95, roughness: 0.2 }),
    [],
  )
  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0f1e', metalness: 0.75, roughness: 0.38 }),
    [],
  )

  useFrame((state, delta) => {
    // open/close progress — ~1.2s each way, slow luxurious ease
    let target: number
    if (isTouch) {
      target = state.clock.elapsedTime % 6 < 3 ? 1 : 0 // gentle 6s auto loop
    } else {
      target = hovered ? 1 : 0
    }
    if (reduced) target = 0
    const dir = Math.sign(target - openRef.current)
    if (dir !== 0) {
      openRef.current = THREE.MathUtils.clamp(openRef.current + (dir * delta) / 1.2, 0, 1)
    }
    const e = luxEase(openRef.current)
    easedRef.current = e

    // the rear shell swings open HORIZONTALLY like a door (hinged at the far
    // side seam, rotating around Y) — never upward — away from the viewer so
    // the exposed brain stays visible
    if (door.current) {
      door.current.rotation.y = -e * 1.35
    }

    // the head turns slightly while opening so the exposed brain faces the viewer
    // + subtle mouse parallax (desktop only): max ~3-4deg tilt toward cursor
    if (group.current) {
      const baseY = 1.12 + e * 0.62
      const px = isTouch || reduced ? 0 : state.pointer.x
      const py = isTouch || reduced ? 0 : state.pointer.y
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, baseY + px * 0.065, 3, delta)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -py * 0.055, 3, delta)
    }
  })

  return (
    <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.25} floatingRange={[-0.06, 0.06]}>
      <group ref={group} rotation={[0, 1.12, 0]} position={[0, -0.1, 0]}>
        {/* hover hit-zone */}
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={HEAD_SCALE}
        >
          <sphereGeometry args={[1.55, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* dark inner skull — FRONT half only, so the rear opening exposes the brain */}
        <mesh scale={HEAD_SCALE}>
          <sphereGeometry args={[1.06, 48, 48, 0, Math.PI]} />
          <meshStandardMaterial color="#070b18" metalness={0.7} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* AI brain inside */}
        <Brain openRef={easedRef} lowDetail={isTouch} />

        {/* front ceramic shell (face half) */}
        <mesh scale={HEAD_SCALE} material={shellMat}>
          <sphereGeometry args={[1.18, 64, 48, 0, Math.PI]} />
        </mesh>

        {/* rear shell — a single door hinged at the far-side seam; swings
            outward horizontally and genuinely reveals the interior */}
        <group ref={door} position={[1.086, 0, 0]}>
          <mesh position={[-1.086, 0, 0]} scale={HEAD_SCALE} material={shellMat}>
            <sphereGeometry args={[1.18, 64, 48, Math.PI, Math.PI]} />
          </mesh>
          {/* glowing rim on the door edge */}
          <mesh position={[-1.086, 0, 0]} scale={HEAD_SCALE}>
            <torusGeometry args={[1.18, 0.016, 8, 96]} />
            <meshBasicMaterial color="#20E4FF" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>

        {/* face-plate + jaw to break the sphere silhouette */}
        <mesh position={[0, -0.48, 0.6]} scale={[0.56, 0.74, 0.74]} material={shellMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        {/* brow / forehead ridge */}
        <mesh position={[0, 0.22, 0.86]} scale={[0.44, 0.4, 0.52]} material={shellMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        {/* subtle nose ridge */}
        <mesh position={[0, -0.26, 1.32]} rotation={[Math.PI / 2.5, 0, 0]} scale={[0.09, 0.28, 0.13]} material={shellMat}>
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>
        {/* closed-eye line (calm, not scary) */}
        <mesh position={[-0.42, -0.08, 1.18]} rotation={[0, -0.5, 0.08]}>
          <capsuleGeometry args={[0.012, 0.16, 4, 8]} />
          <meshBasicMaterial color="#23B7FF" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* glowing seam ring between front & rear shells */}
        <mesh scale={HEAD_SCALE}>
          <torusGeometry args={[1.185, 0.014, 8, 96]} />
          <meshBasicMaterial color="#23B7FF" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* ear audio disc on the camera-facing side */}
        <group position={[-1.08, -0.05, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
            <cylinderGeometry args={[0.28, 0.32, 0.12, 40]} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} position={[-0.07, 0, 0]}>
            <torusGeometry args={[0.2, 0.016, 8, 48]} />
            <meshBasicMaterial color="#7B4DFF" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[0, -Math.PI / 2, 0]} position={[-0.075, 0, 0]}>
            <circleGeometry args={[0.09, 32]} />
            <meshBasicMaterial color="#B245FF" transparent opacity={0.9} />
          </mesh>
        </group>

        {/* edge light strips on the cheek/jaw */}
        <mesh position={[-0.62, -0.68, 0.62]} rotation={[0.3, 0.5, 1]} material={darkMat}>
          <capsuleGeometry args={[0.025, 0.5, 4, 12]} />
        </mesh>
        <mesh position={[-0.6, -0.66, 0.64]} rotation={[0.3, 0.5, 1]}>
          <capsuleGeometry args={[0.012, 0.5, 4, 8]} />
          <meshBasicMaterial color="#20E4FF" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* neck — dark metallic with glowing data rings */}
        <group position={[0, -1.42, -0.12]} rotation={[0.18, 0, 0]}>
          <mesh material={darkMat}>
            <cylinderGeometry args={[0.34, 0.46, 0.9, 32]} />
          </mesh>
          {[0.12, -0.12].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.37 + i * 0.03, 0.012, 8, 48]} />
              <meshBasicMaterial
                color={i ? '#7B4DFF' : '#23B7FF'}
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>

        {/* shoulder hint */}
        <mesh position={[0, -2.15, -0.1]} rotation={[0, 0, Math.PI / 2]} material={shellMat}>
          <capsuleGeometry args={[0.42, 1.5, 8, 24]} />
        </mesh>
      </group>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/* canvas wrapper                                                      */
/* ------------------------------------------------------------------ */

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-3, 2, 4]} intensity={0.7} color="#cfe0ff" />
      {/* rim lights — blue / violet edge lighting */}
      <pointLight position={[-5, 2, -4]} intensity={60} color="#7B4DFF" />
      <pointLight position={[5, -1, -3]} intensity={45} color="#23B7FF" />
      <pointLight position={[0, 3, -5]} intensity={30} color="#20E4FF" />
    </>
  )
}

export default function HeadScene({ active }: { active: boolean }) {
  const tabVisible = useTabVisible()
  const reduced = useReducedMotion()
  const frameloop: 'always' | 'never' | 'demand' = !tabVisible || !active ? 'never' : reduced ? 'demand' : 'always'

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={frameloop}
      camera={{ position: [0, 0.15, 6.4], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <SceneLights />
      <Head />
    </Canvas>
  )
}
