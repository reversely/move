"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

/** Vertical center of the retargeted dancer (~mid-torso between feet and head). */
export const PREVIEW_BODY_CENTER_Y = 0.94;

type Props = {
  distance?: number;
  fov?: number;
};

/** Frames the full body in the 9:16 preview (feet near bottom, head in frame). */
export default function PreviewCamera({ distance = 6.1, fov = 30 }: Props) {
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = fov;
    camera.position.set(0, PREVIEW_BODY_CENTER_Y, distance);
    camera.lookAt(0, PREVIEW_BODY_CENTER_Y, 0);
    camera.near = 0.1;
    camera.far = 50;
    camera.updateProjectionMatrix();
  }, [camera, distance, fov]);

  return null;
}
