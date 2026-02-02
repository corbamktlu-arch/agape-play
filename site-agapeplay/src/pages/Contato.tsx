import { useState } from "react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Mensagem recebida!",
      description: "Entraremos em contato em breve.",
    });

    setFormData({ name: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Entre em <span className="gradient-neon-text">Contato</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Estamos prontos para ajudar você a transformar sua loja
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* WhatsApp Card */}
              <Card className="glass-card border-primary/50 neon-glow">
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/20">
                    <Phone className="h-10 w-10 text-[#25D366]" />
                  </div>
                  <h2 className="mb-4 text-2xl font-bold">WhatsApp</h2>
                  <p className="mb-6 text-muted-foreground">
                    A forma mais rápida de falar conosco. Resposta imediata!
                  </p>
                  <WhatsAppButton variant="hero">
                    Chamar no WhatsApp
                  </WhatsAppButton>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-8">
                  <h2 className="mb-6 text-2xl font-bold">Envie uma mensagem</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-secondary/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="bg-secondary/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Como podemos ajudar?"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="bg-secondary/50 border-border/50 resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full gap-2 gradient-neon text-primary-foreground"
                      disabled={isSubmitting}
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="glass-card rounded-xl p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Telefone</h3>
                <p className="text-sm text-muted-foreground">(88) 99999-9999</p>
              </div>

              <div className="glass-card rounded-xl p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">contato@agapeplay.com.br</p>
              </div>

              <div className="glass-card rounded-xl p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Localização</h3>
                <p className="text-sm text-muted-foreground">Brasil</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contato;
