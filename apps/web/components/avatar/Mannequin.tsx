"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { DancePlan } from "@/types/dance";

export default function Mannequin({ dancePlan }: { dancePlan: DancePlan | null }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const bounce = Math.sin(t * 4) * 0.04;

    groupRef.current.position.y = bounce;
    groupRef.current.rotation.y = dancePlan ? Math.sin(t * 1.5) * 0.3 : 0;
  });

  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.28, 0.8, 8, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[-0.42, 0.8, 0]} rotation={[0, 0, 0.45]}>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[0.42, 0.8, 0]} rotation={[0, 0, -0.45]}>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[-0.16, 0.1, 0]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[0.16, 0.1, 0]}>
        <capsuleGeometry args={[0.08, 0.7, 8, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}
