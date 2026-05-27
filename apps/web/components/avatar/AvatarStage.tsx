"use client";

import { Canvas } from "@react-three/fiber";

import type { DancePlan } from "@/types/dance";
import Mannequin from "./Mannequin";

export default function AvatarStage({ dancePlan }: { dancePlan: DancePlan | null }) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl bg-neutral-950">
      <Canvas camera={{ position: [0, 1.4, 4], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 4, 4]} intensity={1.5} />
        <gridHelper args={[6, 6]} />
        <Mannequin dancePlan={dancePlan} />
      </Canvas>
    </div>
  );
}
