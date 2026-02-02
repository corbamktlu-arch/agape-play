export const siteConfig = {
  name: "ÁgapePlay",
  description: "Rádio Indoor Inteligente Para Lojas",
  whatsappNumber: "5588999999999",
  whatsappMessage: "Olá! Quero conhecer o ÁgapePlay para minha loja. Pode me explicar como funciona e como contratar?",
  loginUrl: "https://seusite.com/login",
  
  getWhatsAppUrl: () => {
    const message = encodeURIComponent(siteConfig.whatsappMessage);
    return `https://wa.me/${siteConfig.whatsappNumber}?text=${message}`;
  },
  
  getWhatsAppUrlWithMessage: (customMessage: string) => {
    const message = encodeURIComponent(customMessage);
    return `https://wa.me/${siteConfig.whatsappNumber}?text=${message}`;
  }
};
