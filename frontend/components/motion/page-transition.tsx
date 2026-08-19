"use client";

import { motion } from "framer-motion";
import { usePathname } from "@/i18n/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-0 min-w-0 flex-1"
    >
      {children}
    </motion.div>
  );
}
