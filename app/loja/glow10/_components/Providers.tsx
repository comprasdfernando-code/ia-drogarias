"use client";

import React from "react";
import { CartUIProvider } from "./CartProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CartUIProvider>{children}</CartUIProvider>;
}
