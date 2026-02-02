import { Link } from "react-router-dom";
import { siteConfig } from "@/config/site";
import logo from "@/assets/logo.png";

const footerLinks = [
  { name: "Recursos", href: "/recursos" },
  { name: "Planos", href: "/planos" },
  { name: "FAQ", href: "/faq" },
  { name: "Contato", href: "/contato" },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ÁgapePlay" className="h-10 w-10" />
            <span className="text-xl font-bold gradient-neon-text">
              ÁgapePlay
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
            <a
              href={siteConfig.loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </a>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} ÁgapePlay. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
