"use client";

import dynamic from "next/dynamic";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import type { MyLibraryProps } from "@/components/catalog/MyLibrary";

const MyLibraryDynamic = dynamic(
  () =>
    import("@/components/catalog/MyLibrary").then((mod) => ({
      default: mod.MyLibrary,
    })),
  {
    loading: () => <CatalogSkeleton rows={4} variant="library" />,
  },
);

export function MyLibraryLazy(props: MyLibraryProps) {
  return <MyLibraryDynamic {...props} />;
}
