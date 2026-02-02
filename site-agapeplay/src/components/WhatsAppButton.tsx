import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  variant?: "floating" | "inline" | "hero";
  customMessage?: string;
  children?: React.ReactNode;
  className?: string;
}

export const WhatsAppButton = ({ 
  variant = "inline", 
  customMessage,
  children,
  className 
}: WhatsAppButtonProps) => {
  const whatsappUrl = customMessage 
    ? siteConfig.getWhatsAppUrlWithMessage(customMessage)
    : siteConfig.getWhatsAppUrl();

  if (variant === "floating") {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl animate-pulse-glow",
          "md:h-16 md:w-16",
          className
        )}
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="h-7 w-7 text-white md:h-8 md:w-8" fill="white" />
      </a>
    );
  }

  if (variant === "hero") {
    return (
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <Button
          size="lg"
          className={cn(
            "gap-2 gradient-neon text-primary-foreground font-semibold px-8 py-6 text-lg neon-glow transition-all duration-300 hover:scale-105",
            className
          )}
        >
          <MessageCircle className="h-5 w-5" />
          {children || "Falar no WhatsApp"}
        </Button>
      </a>
    );
  }

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button
        variant="outline"
        className={cn(
          "gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300",
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {children || "WhatsApp"}
      </Button>
    </a>
  );
};
