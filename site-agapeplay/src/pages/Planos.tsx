import { Check, MessageCircle } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const plans = [
  {
    name: "Essencial",
    description: "Ideal para lojas pequenas",
    features: [
      "1 loja",
      "Playlists Global",
      "Avisos automáticos",
      "Suporte por email"
    ],
    message: "Olá! Tenho interesse no Plano Essencial do ÁgapePlay. Pode me enviar mais informações?"
  },
  {
    name: "Profissional",
    description: "Para redes com várias lojas",
    featured: true,
    features: [
      "Até 03 lojas",
      "Tudo do Essencial",
      "Controle por gerente",
      "Suporte prioritário"
    ],
    message: "Olá! Tenho interesse no Plano Profissional do ÁgapePlay. Pode me enviar mais informações?"
  },
  {
    name: "Empresarial",
    description: "Para grandes redes + suporte dedicado",
    features: [
      "Lojas ilimitadas",
      "Tudo do Profissional",
      "API de integração",
      "Gerente de conta dedicado",
      "SLA garantido"
    ],
    message: "Olá! Tenho interesse no Plano Empresarial do ÁgapePlay. Pode me enviar mais informações?"
  }
];

const Planos = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Escolha o plano <span className="gradient-neon-text">ideal</span> para você
            </h1>
            <p className="text-lg text-muted-foreground">
              Temos opções para todos os tamanhos de negócio
            </p>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-border/50 bg-card/50 backdrop-blur transition-all duration-300 ${
                  plan.featured 
                    ? 'border-primary/50 neon-glow scale-105 md:scale-110' 
                    : 'hover:border-primary/30'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-neon rounded-full px-4 py-1 text-xs font-semibold text-primary-foreground">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a 
                    href={siteConfig.getWhatsAppUrlWithMessage(plan.message)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      className={`w-full gap-2 ${
                        plan.featured 
                          ? 'gradient-neon text-primary-foreground neon-glow' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Quero esse plano
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Text */}
          <div className="mt-16 mx-auto max-w-2xl text-center">
            <div className="glass-card rounded-2xl p-8">
              <p className="text-muted-foreground">
                Os valores variam conforme quantidade de lojas e necessidades específicas. 
                <br />
                <strong className="text-foreground">Fale conosco no WhatsApp para receber uma proposta personalizada.</strong>
              </p>
              <div className="mt-6">
                <WhatsAppButton variant="hero" customMessage="Olá! Quero receber uma proposta personalizada do ÁgapePlay para minha rede de lojas.">
                  Solicitar Proposta
                </WhatsAppButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Planos;
