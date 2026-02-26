'use client'

export default function LightingSetup() {
  return (
    <>
      {/* Main Directional Light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Accent Lights */}
      <pointLight position={[-20, 10, -10]} intensity={0.8} color="#8338ec" distance={50} />
      <pointLight position={[20, 10, -10]} intensity={0.8} color="#3a86ff" distance={50} />
      <pointLight position={[0, 5, 20]} intensity={1} color="#fb5607" distance={60} />

      {/* Ambient Light */}
      <ambientLight intensity={0.5} color="#ffffff" />

      {/* Hemisphere Light for soft lighting */}
      <hemisphereLight
        position={[0, 20, 0]}
        intensity={0.6}
        color="#8338ec"
        groundColor="#ff006e"
      />
    </>
  )
}
