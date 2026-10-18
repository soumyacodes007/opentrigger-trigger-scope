"use client";

import type { ReactNode } from "react";
import { NetworkProvider } from "./NetworkProvider";
import MotionSync from "./MotionSync";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <NetworkProvider>
      <MotionSync />
      {children}
    </NetworkProvider>
  );
}
