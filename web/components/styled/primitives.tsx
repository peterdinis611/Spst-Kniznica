"use client";

import styled from "styled-components";

export const AccentFill = styled.span<{ $color: string }>`
  background: ${(p) => p.$color};
`;

export const AccentFillDiv = styled.div<{ $color: string }>`
  background: ${(p) => p.$color};
`;

export const AccentGradient = styled.div<{ $from: string; $to: string }>`
  background: linear-gradient(160deg, ${(p) => p.$from} 0%, ${(p) => p.$to} 100%);
`;

export const AccentGradient165 = styled.div<{ $from: string; $to: string }>`
  background: linear-gradient(165deg, ${(p) => p.$from} 0%, ${(p) => p.$to} 100%);
`;

export const AnimationDelayed = styled.div<{ $delay: string }>`
  animation-delay: ${(p) => p.$delay};
`;

export const AnimationDelayedLi = styled.li<{ $delay: string }>`
  animation-delay: ${(p) => p.$delay};
`;

export const AnimationDelayedDetails = styled.details<{ $delay: string }>`
  animation-delay: ${(p) => p.$delay};
`;

export const AnimationDelayedArticle = styled.article<{ $delay: string }>`
  animation-delay: ${(p) => p.$delay};
`;

export const DotGridOverlay = styled.div<{ $size?: string; $color?: string }>`
  background-image: radial-gradient(
    circle at 1px 1px,
    ${(p) => p.$color ?? "currentColor"} 1px,
    transparent 0
  );
  background-size: ${(p) => p.$size ?? "18px 18px"};
  color: var(--ink);
`;

export const RuleDotGrid = styled.div`
  background-image: radial-gradient(
    circle at 1px 1px,
    color-mix(in srgb, var(--rule) 55%, transparent) 1px,
    transparent 0
  );
  background-size: 22px 22px;
`;

export const VirtualList = styled.ul<{ $height: number }>`
  height: ${(p) => p.$height}px;
`;

export const VirtualOrderedList = styled.ol<{ $height: number }>`
  height: ${(p) => p.$height}px;
`;

export const VirtualRow = styled.li<{
  $start: number;
  $widthPct?: number;
  $leftPct?: number;
}>`
  transform: translateY(${(p) => p.$start}px);
  ${(p) =>
    p.$widthPct != null
      ? `width: ${p.$widthPct}%;`
      : ""}
  ${(p) =>
    p.$leftPct != null
      ? `left: ${p.$leftPct}%;`
      : ""}
`;

export const ShadeOverlay = styled.span`
  background-image: linear-gradient(
    160deg,
    transparent 30%,
    rgba(0, 0, 0, 0.35)
  );
`;

export const TransparentCanvasRoot = styled.div`
  width: 100%;
  height: 100%;

  & > div,
  & canvas {
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
  }
`;
