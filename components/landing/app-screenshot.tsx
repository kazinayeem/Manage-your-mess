import Image from "next/image";
import { cn } from "@/lib/utils";

type AppScreenshotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function AppScreenshot({
  src,
  alt,
  priority = false,
  className,
  imageClassName,
}: AppScreenshotProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-100 shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={750}
        priority={priority}
        className={cn("h-auto w-full object-cover object-top", imageClassName)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
      />
    </div>
  );
}
