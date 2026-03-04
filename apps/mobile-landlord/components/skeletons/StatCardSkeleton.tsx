import React from "react";
import { SkeletonLoader } from "../ui/SkeletonLoader";

export function StatCardSkeleton() {
  return (
    <>
      <SkeletonLoader width={32} height={32} borderRadius={8} />
      <SkeletonLoader width={60} height={28} style={{ marginTop: 4 }} />
      <SkeletonLoader width="80%" height={14} style={{ marginTop: 4 }} />
    </>
  );
}
