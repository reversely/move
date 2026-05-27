"use client";

import { ContactShadows, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import PreviewCamera from "@/components/PreviewCamera";
import { MixamoRetargeter } from "@/lib/mixamoRetarget";
import type { JointName, JointPoint, StageTransform } from "@/lib/types";

useGLTF.preload("/models/dancer.glb");

export type DanceAvatarAnimRef = {
  pose: Record<JointName, JointPoint>;
  stage: StageTransform;
  isPlaying: boolean;
};

type Props = {
  animRef: RefObject<DanceAvatarAnimRef>;
};

function HumanoidDancer({ animRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const retargeterRef = useRef<MixamoRetargeter | null>(null);
  const skeletonRef = useRef<THREE.Skeleton | null>(null);
  const { scene } = useGLTF("/models/dancer.glb");

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = 0.55;
            mat.metalness = 0.08;
          }
        }
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    if (!groupRef.current) return;

    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    model.traverse((obj) => {
      if (obj instanceof THREE.SkinnedMesh) skinnedMeshes.push(obj);
    });
    const skeleton = skinnedMeshes[0]?.skeleton;
    if (!skeleton) return;

    skeletonRef.current = skeleton;
    const retargeter = new MixamoRetargeter(groupRef.current);
    retargeter.init(skeleton);
    retargeterRef.current = retargeter;

    model.rotation.y = Math.PI;
    model.scale.setScalar(1.05);
  }, [model]);

  useFrame(() => {
    const skeleton = skeletonRef.current;
    const retargeter = retargeterRef.current;
    const anim = animRef.current;
    if (!skeleton || !retargeter?.isReady() || !anim) return;
    retargeter.apply(skeleton, anim.pose, anim.stage);
  }, 0);

  const accent = animRef.current?.isPlaying ?? false;

  return (
    <group ref={groupRef}>
      <primitive object={model} />
      {accent && (
        <pointLight position={[0, 1.4, 1.2]} intensity={0.35} color="#f57c20" distance={4} />
      )}
    </group>
  );
}

export default function DanceAvatarScene({ animRef }: Props) {
  return (
    <>
      <PreviewCamera />
      <color attach="background" args={["#1a1917"]} />
      <fog attach="fog" args={["#1a1917", 4, 14]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 5, 3]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.38} color="#f5e6d8" />
      <hemisphereLight args={["#f5e6d8", "#1a1917", 0.45]} />
      <HumanoidDancer animRef={animRef} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.42}
        scale={8}
        blur={2.2}
        far={2.8}
        color="#f57c20"
      />
    </>
  );
}
