import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider />
      <AuthProvider>
        {children}
      </AuthProvider>
    </HeroUIProvider>
  );
}
