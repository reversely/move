import * as THREE from "three";

import { buildJointTargets3D, stageRootOffset } from "@/lib/jointSpace3d";
import type { JointName, JointPoint } from "@/lib/types";

type BoneMap = Map<string, THREE.Bone>;

type RestAim = {
  child: THREE.Bone;
  bindDir: THREE.Vector3;
};

const CHAIN: { bone: string; child: string; joint: JointName }[] = [
  { bone: "mixamorig:Hips", child: "mixamorig:Spine", joint: "spine" },
  { bone: "mixamorig:Spine", child: "mixamorig:Spine1", joint: "chest" },
  { bone: "mixamorig:Spine1", child: "mixamorig:Spine2", joint: "chest" },
  { bone: "mixamorig:Spine2", child: "mixamorig:Neck", joint: "neck" },
  { bone: "mixamorig:Neck", child: "mixamorig:Head", joint: "head" },
  /** Collar bones aim toward the elbow so the upper arm reaches outward. */
  { bone: "mixamorig:LeftShoulder", child: "mixamorig:LeftArm", joint: "elbow_l" },
  { bone: "mixamorig:LeftArm", child: "mixamorig:LeftForeArm", joint: "elbow_l" },
  { bone: "mixamorig:LeftForeArm", child: "mixamorig:LeftHand", joint: "wrist_l" },
  { bone: "mixamorig:LeftHand", child: "mixamorig:LeftHandMiddle1", joint: "hand_l" },
  { bone: "mixamorig:RightShoulder", child: "mixamorig:RightArm", joint: "elbow_r" },
  { bone: "mixamorig:RightArm", child: "mixamorig:RightForeArm", joint: "elbow_r" },
  { bone: "mixamorig:RightForeArm", child: "mixamorig:RightHand", joint: "wrist_r" },
  { bone: "mixamorig:RightHand", child: "mixamorig:RightHandMiddle1", joint: "hand_r" },
  { bone: "mixamorig:LeftUpLeg", child: "mixamorig:LeftLeg", joint: "knee_l" },
  { bone: "mixamorig:LeftLeg", child: "mixamorig:LeftFoot", joint: "ankle_l" },
  { bone: "mixamorig:LeftFoot", child: "mixamorig:LeftToeBase", joint: "toe_l" },
  { bone: "mixamorig:RightUpLeg", child: "mixamorig:RightLeg", joint: "knee_r" },
  { bone: "mixamorig:RightLeg", child: "mixamorig:RightFoot", joint: "ankle_r" },
  { bone: "mixamorig:RightFoot", child: "mixamorig:RightToeBase", joint: "toe_r" },
];

const _bonePos = new THREE.Vector3();
const _childPos = new THREE.Vector3();
const _target = new THREE.Vector3();
const _currentDir = new THREE.Vector3();
const _wantDir = new THREE.Vector3();
const _delta = new THREE.Quaternion();
const _worldQuat = new THREE.Quaternion();
const _parentQuat = new THREE.Quaternion();

export class MixamoRetargeter {
  private readonly bones: BoneMap = new Map();
  private readonly restAim = new Map<string, RestAim>();
  private readonly bindPose = new Map<string, THREE.Quaternion>();
  private footOffsetY = 0;
  private ready = false;

  constructor(private readonly root: THREE.Object3D) {}

  init(skeleton: THREE.Skeleton) {
    this.bones.clear();
    this.restAim.clear();
    this.bindPose.clear();

    skeleton.pose();
    this.root.updateMatrixWorld(true);

    for (const bone of skeleton.bones) {
      this.bones.set(bone.name, bone);
      this.bindPose.set(bone.name, bone.quaternion.clone());
    }

    for (const { bone, child } of CHAIN) {
      const b = this.bones.get(bone);
      const c = this.bones.get(child);
      if (!b || !c) continue;
      b.getWorldPosition(_bonePos);
      c.getWorldPosition(_childPos);
      _childPos.sub(_bonePos);
      if (_childPos.lengthSq() < 1e-8) continue;
      this.restAim.set(bone, { child: c, bindDir: _childPos.normalize() });
    }

    const leftFoot = this.bones.get("mixamorig:LeftFoot");
    const rightFoot = this.bones.get("mixamorig:RightFoot");
    if (leftFoot && rightFoot) {
      leftFoot.getWorldPosition(_bonePos);
      rightFoot.getWorldPosition(_childPos);
      this.footOffsetY = -Math.min(_bonePos.y, _childPos.y) + 0.02;
    }

    this.ready = this.restAim.size > 8;
  }

  isReady() {
    return this.ready;
  }

  getFootOffset() {
    return this.footOffsetY;
  }

  private aimBoneWorld(bone: THREE.Bone, targetWorld: THREE.Vector3) {
    bone.updateWorldMatrix(true, false);
    bone.getWorldPosition(_bonePos);

    const rest = this.restAim.get(bone.name);
    if (!rest) return;

    rest.child.getWorldPosition(_childPos);
    _currentDir.subVectors(_childPos, _bonePos);
    if (_currentDir.lengthSq() < 1e-8) return;
    _currentDir.normalize();

    _wantDir.subVectors(targetWorld, _bonePos);
    if (_wantDir.lengthSq() < 1e-8) return;
    _wantDir.normalize();

    _delta.setFromUnitVectors(_currentDir, _wantDir);
    bone.getWorldQuaternion(_worldQuat);
    _worldQuat.premultiply(_delta);

    if (bone.parent) {
      bone.parent.getWorldQuaternion(_parentQuat);
      bone.quaternion.copy(_parentQuat.invert().multiply(_worldQuat));
    } else {
      bone.quaternion.copy(_worldQuat);
    }
    bone.updateWorldMatrix(true, false);
  }

  apply(
    skeleton: THREE.Skeleton,
    pose: Record<JointName, JointPoint>,
    stage: { x: number; y: number; rotation: number; facing: number },
  ) {
    if (!this.ready) return;

    skeleton.pose();
    for (const [name, q] of this.bindPose) {
      const bone = this.bones.get(name);
      if (bone) bone.quaternion.copy(q);
    }
    this.root.updateMatrixWorld(true);

    const facing = stage.facing >= 0 ? 1 : -1;
    const targets = buildJointTargets3D(pose, facing);
    const stageOff = stageRootOffset(stage);
    const hipMid = new THREE.Vector3()
      .addVectors(targets.hip_l, targets.hip_r)
      .multiplyScalar(0.5);

    this.root.position.set(stageOff.x, stageOff.y + this.footOffsetY, stageOff.z);
    this.root.rotation.y = (stage.rotation * Math.PI) / 180 * 0.35;
    this.root.updateMatrixWorld(true);

    for (const { bone, joint } of CHAIN) {
      const b = this.bones.get(bone);
      if (!b) continue;
      _target.copy(targets[joint]).sub(hipMid).applyMatrix4(this.root.matrixWorld);
      this.aimBoneWorld(b, _target);
    }

    skeleton.update();
  }
}
