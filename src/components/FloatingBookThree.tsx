/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    Float,
    PerspectiveCamera,
    Environment,
    ContactShadows,
    useTexture,
    PresentationControls
} from '@react-three/drei'
import * as THREE from 'three'

function BookModel() {
    const meshRef = useRef<THREE.Group>(null)

    // 텍스처 로딩
    const coverTexture = useTexture('/book_cover_leaf_final.jpg')

    // 책 규격 설정 (20% 축소)
    const width = 2.7
    const height = 4.0
    const depth = 0.6

    // 매테리얼 구성
    const coverMaterial = useMemo(() => {
        // 텍스처 정렬 조정 (이미지 중심을 책 표지 중심으로)
        coverTexture.center.set(0.5, 0.5)
        coverTexture.repeat.set(1, 1) // 반복 없이 한 번만

        const mat = new THREE.MeshStandardMaterial({
            map: coverTexture,
            bumpMap: coverTexture,
            bumpScale: 0.02,
            roughness: 0.8,
            metalness: 0.1,
        })
        return mat
    }, [coverTexture])

    const pageMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#fffcf5',
        roughness: 1,
        metalness: 0,
    }), [])

    const spineMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#e3ddd0',
        roughness: 0.5,
        metalness: 0.2,
    }), [])

    useFrame((state) => {
        if (!meshRef.current) return
        const t = state.clock.getElapsedTime()
        // 부드러운 유영 효과 및 높이 조절
        meshRef.current.position.y = 0.6 + Math.sin(t * 0.5) * 0.1
        meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.05
    })

    return (
        <group ref={meshRef}>
            {/* Front Cover */}
            <mesh position={[0, 0, depth / 2]}>
                <boxGeometry args={[width, height, 0.05]} />
                <primitive object={coverMaterial} attach="material" />
            </mesh>

            {/* Back Cover */}
            <mesh position={[0, 0, -depth / 2]}>
                <boxGeometry args={[width, height, 0.05]} />
                <meshStandardMaterial color="#fcfaf7" roughness={0.8} />
            </mesh>

            {/* Spine (Rounded) */}
            <mesh position={[-width / 2, 0, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[depth / 2, depth / 2, height, 32, 1, false, Math.PI / 2, Math.PI]} />
                <primitive object={spineMaterial} attach="material" />
            </mesh>

            {/* Inner Pages */}
            <mesh position={[0.02, 0, 0]}>
                <boxGeometry args={[width - 0.1, height - 0.1, depth - 0.06]} />
                <primitive object={pageMaterial} attach="material" />
            </mesh>
        </group>
    )
}

export default function FloatingBookThree() {
    return (
        <div className="w-full h-full min-h-[900px] cursor-grab active:cursor-grabbing bg-cream">
            <Canvas shadows dpr={[1, 2]}>
                {/* 카메라를 조금 뒤로 밀어서 하단 그림자 여유 확보 */}
                <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={30} />

                <ambientLight intensity={0.7} />
                <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <PresentationControls
                    global
                    config={{ mass: 2, tension: 500 }}
                    snap={{ mass: 4, tension: 1500 }}
                    rotation={[0.1, -0.4, 0]}
                    polar={[-Math.PI / 3, Math.PI / 3]}
                    azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                >
                    <Float
                        speed={1.5}
                        rotationIntensity={1}
                        floatIntensity={2}
                    >
                        <Suspense fallback={null}>
                            <BookModel />
                        </Suspense>
                    </Float>
                </PresentationControls>

                <ContactShadows
                    position={[0, -2.5, 0]} // 바닥 위치 재조정 (모델 축소 반영)
                    opacity={0.35}
                    scale={12}
                    blur={3}
                    far={8}
                />

                <Environment preset="city" />
            </Canvas>
        </div>
    )
}
