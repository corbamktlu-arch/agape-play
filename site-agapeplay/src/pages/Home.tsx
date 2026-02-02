import { Link } from "react-router-dom";
import { 
  Music, 
  Radio, 
  Volume2, 
  Settings, 
  Upload, 
  Clock, 
  Users, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Store,
  Megaphone,
  Headphones
} from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroBanner from "@/assets/hero-banner.jpg";

const steps = [
  {
    icon: Store,
    title: "Cadastre sua loja",
    description: "Configure sua loja em poucos minutos no painel administrativo."
  },
  {
    icon: Upload,
    title: "Envie músicas e avisos",
    description: "Faça upload das suas músicas e grave avisos promocionais."
  },
  {
    icon: Headphones,
    title: "O player toca automaticamente",
    description: "Sua rádio indoor começa a funcionar 24/7 sem interrupções."
  }
];

const benefits = [
  {
    icon: Music,
    title: "Ambiente Profissional",
    description: "Música de qualidade que encanta clientes e melhora a experiência de compra."
  },
  {
    icon: Megaphone,
    title: "Promoções Automáticas",
    description: "Avisos de promoções que tocam automaticamente no horário programado."
  },
  {
    icon: Users,
    title: "Padronização no Atendimento",
    description: "Todas as lojas da rede com a mesma identidade sonora."
  },
  {
    icon: Settings,
    title: "Controle Total Remoto",
    description: "Gerencie tudo de qualquer lugar pelo painel web."
  },
  {
    icon: Radio,
    title: "Rádio Exclusiva da Loja",
    description: "Uma programação única, feita especialmente para sua marca."
  },
  {
    icon: Shield,
    title: "Segurança por Permissões",
    description: "Controle quem acessa o quê com níveis de permissão."
  }
];

const features = [
  "Upload de músicas",
  "Playlists organizadas",
  "Avisos programados por tempo",
  "Player automático online",
  "Painel Admin/Gerente/Operador",
  "Segurança por permissões"
];

const testimonials = [
  {
    name: "Maria Silva",
    company: "Boutique Fashion Store",
    text: "O ÁgapePlay transformou o ambiente da minha loja. Os clientes comentam sobre a música!"
  },
  {
    name: "Carlos Santos",
    company: "Rede SuperMercado Total",
    text: "Gerenciar 15 lojas com programações diferentes nunca foi tão fácil."
  },
  {
    name: "Ana Oliveira",
    company: "Ótica Central",
    text: "Os avisos automáticos aumentaram nossas vendas de promoções em 30%."
  }
];

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBanner} 
            alt="ÁgapePlay Banner" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="container relative z-10 px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl animate-fade-up">
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              <span className="gradient-neon-text">Rádio Indoor Inteligente</span>
              <br />
              <span className="text-foreground">Para Lojas</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Músicas + avisos automáticos + controle total por loja
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <WhatsAppButton variant="hero" />
              <Link to="/planos">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 border-primary/50 px-8 py-6 text-lg hover:bg-primary/10"
                >
                  Ver Planos
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-12 w-6 rounded-full border-2 border-primary/50 p-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Como <span className="gradient-neon-text">Funciona</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Em apenas 3 passos simples, sua loja terá uma rádio indoor profissional
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={index} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50 hover:neon-glow">
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-card/30 py-20 md:py-32">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Por que escolher o <span className="gradient-neon-text">ÁgapePlay</span>?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Benefícios que transformam a experiência da sua loja
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="group border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50"
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Recursos <span className="gradient-neon-text">Principais</span>
              </h2>
              <p className="mb-8 text-muted-foreground">
                Tudo que você precisa para criar a rádio perfeita para sua loja
              </p>

              <ul className="mb-8 space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/recursos">
                <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
                  Ver tudo em Recursos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex-1">
              <div className="relative">
                <div className="glass-card rounded-2xl p-6 neon-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div className="h-3 w-3 rounded-full bg-neon" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 rounded bg-primary/20 animate-pulse" />
                    <div className="h-24 rounded bg-secondary/50" />
                    <div className="flex gap-2">
                      <div className="h-10 flex-1 rounded bg-primary/30" />
                      <div className="h-10 w-20 rounded bg-secondary" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 rounded bg-secondary/50" />
                      <div className="h-16 rounded bg-secondary/50" />
                      <div className="h-16 rounded bg-secondary/50" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-primary/20 blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card/30 py-20 md:py-32">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              O que dizem <span className="gradient-neon-text">nossos clientes</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl text-primary/50">"</div>
                  <p className="mb-6 text-muted-foreground">{testimonial.text}</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-3xl glass-card p-8 text-center md:p-16">
            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
                Quer sua loja tocando <span className="gradient-neon-text">hoje mesmo</span>?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                Entre em contato agora e transforme a experiência sonora da sua loja
              </p>
              <WhatsAppButton variant="hero">
                Chamar no WhatsApp Agora
              </WhatsAppButton>
            </div>
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
