import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function WavygoLogo({ className, forceVariant, mark = false }) {
  const { theme } = useTheme();
  const variant = forceVariant || (theme === "dark" ? "white" : "green");
  const src = variant === "white" ? "/logos/wavygo-white.png" : "/logos/wavygo-green.png";
  return (
    <img
      src={src}
      alt="WavyGo"
      className={cn("select-none", mark ? "h-8 w-auto" : "h-9 w-auto", className)}
      draggable={false}
    />
  );
}

export default WavygoLogo;
