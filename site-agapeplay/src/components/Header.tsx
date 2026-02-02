import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "./WhatsAppButton";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Recursos", href: "/recursos" },
  { name: "Planos", href: "/planos" },
  { name: "FAQ", href: "/faq" },
  { name: "Contato", href: "/contato" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ÁgapePlay" className="h-10 w-auto" />
            <span className="text-xl font-bold gradient-neon-text md:text-2xl">
              ÁgapePlay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-primary neon-text"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <WhatsAppButton />
            <a href={siteConfig.loginUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="gap-2">
                <LogIn className="h-4 w-4" />
                App Ágape
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-border py-4 lg:hidden">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <WhatsAppButton className="w-full justify-center" />
                <a href={siteConfig.loginUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
