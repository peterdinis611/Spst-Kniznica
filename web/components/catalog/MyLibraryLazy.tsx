"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

const MyLibraryDynamic = dynamic(
  () =>
    import("@/components/catalog/MyLibrary").then((mod) => ({
      default: mod.MyLibrary,
    })),
  {
    loading: () => <CatalogSkeleton rows={4} variant="library" />,
  },
);

type MyLibraryProps = ComponentProps<
  typeof import("@/components/catalog/MyLibrary").MyLibrary
>;

export function MyLibraryLazy(props: MyLibraryProps) {
  return <MyLibraryDynamic {...props} />;
}
