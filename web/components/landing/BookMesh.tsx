"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CarouselBook } from "@/lib/types";
import { createCoverTexture, createSpineTexture } from "./coverTexture";

type BookMeshProps = {
  book: CarouselBook;
  offset: number;
  onSelect: (book: CarouselBook) => void;
  dragMoved: MutableRefObject<boolean>;
};

const BOOK_W = 1.55;
const BOOK_H = 2.35;
const BOOK_D = 0.08;

export function BookMesh({ book, offset, onSelect, dragMoved }: BookMeshProps) {
  const group = useRef<THREE.Group>(null);
  const cover = useMemo(() => createCoverTexture(book), [book]);
  const spine = useMemo(() => createSpineTexture(book), [book]);
  const materials = useMemo(() => {
    const paper = new THREE.MeshStandardMaterial({
      color: "#f7f3ea",
      roughness: 0.9,
      metalness: 0.02,
    });
    const coverMat = new THREE.MeshStandardMaterial({
      map: cover,
      roughness: 0.45,
      metalness: 0.04,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      map: spine,
      roughness: 0.55,
      metalness: 0.04,
    });
    const back = new THREE.MeshStandardMaterial({
      color: book.accent,
      roughness: 0.65,
      metalness: 0.04,
    });

    return [paper, spineMat, paper, paper, coverMat, back];
  }, [book.accent, cover, spine]);

  useFrame((_, delta) => {
    if (!group.current) {
      return;
    }

    const abs = Math.abs(offset);
    const targetX = offset * 1.22;
    const targetZ = -abs * 0.72;
    const targetY = abs < 0.15 ? 0.08 : -abs * 0.04;
    const targetScale = THREE.MathUtils.lerp(1.28, 0.86, Math.min(abs / 2.2, 1));
    const targetRotY = offset * -0.12;

    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      targetX,
      8,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      targetY,
      8,
      delta,
    );
    group.current.position.z = THREE.MathUtils.damp(
      group.current.position.z,
      targetZ,
      8,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetRotY,
      8,
      delta,
    );

    const scale = THREE.MathUtils.damp(
      group.current.scale.x,
      targetScale,
      8,
      delta,
    );
    group.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={group}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (dragMoved.current) {
          return;
        }
        onSelect(book);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "grab";
      }}
    >
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
      </mesh>
    </group>
  );
}

export function wrappedOffset(index: number, active: number, count: number): number {
  let diff = index - active;
  const half = count / 2;
  if (diff > half) {
    diff -= count;
  }
  if (diff < -half) {
    diff += count;
  }
  return diff;
}
