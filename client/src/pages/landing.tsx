import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Service } from "@shared/schema";
import { BarChart3, Users, DollarSign, Star, ArrowRight } from "lucide-react";

export default function Landing() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const isUzbek = language === 'uz';

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const categories = ['all', ...new Set(services.map((s: Service) => s.category).filter(Boolean))];
  
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter((s: Service) => s.category === selectedCategory);

  const stats = [
    {
      icon: Users,
      value: "500+",
      label: isUzbek ? "Mijozlar" : "Clients",
    },
    {
      icon: BarChart3,
      value: "98%",
      label: isUzbek ? "Mamnunlik" : "Satisfaction",
    },
    {
      icon: DollarSign,
      value: "24/7",
      label: isUzbek ? "Qo'llab-quvvatlash" : "Support",
    },
  ];

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleScrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleServiceDetails = (service: Service) => {
    setSelectedService(service);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="inline-flex items-center space-x-2 text-accent px-3 py-1">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                <span>{isUzbek ? "AI-asoslangan yechimlari" : "AI-powered solutions"}</span>
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight" data-testid="text-hero-title">
                {isUzbek ? "Biznesingizni " : "Transform your business with "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  {isUzbek ? "AI bilan" : "AI"}
                </span> 
                {isUzbek ? " rivojlantiring" : " innovation"}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-hero-description">
                {isUzbek 
                  ? "Sun'iy intellekt yordamida biznes jarayonlaringizni avtomatlashtiring, samaradorlikni oshiring va raqobatbardosh bo'ling."
                  : "Automate your business processes with artificial intelligence, increase efficiency and stay competitive."
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleScrollToServices}
                  data-testid="button-view-services"
                >
                  {isUzbek ? "Xizmatlarni ko'rish" : "View Services"}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleLogin}
                  data-testid="button-free-consultation"
                >
                  {isUzbek ? "Bepul maslahat" : "Free Consultation"}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="mr-4">
                      <div className="text-2xl font-bold text-foreground" data-testid={`text-stat-value-${index}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-stat-label-${index}`}>
                        {stat.label}
                      </div>
                    </div>
                    {index < stats.length - 1 && <div className="w-px h-8 bg-border"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* AI Illustration */}
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 backdrop-blur">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Card className="p-4 shadow-lg">
                      <CardContent className="p-0">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg mb-3"></div>
                        <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                    <Card className="p-4 shadow-lg">
                      <CardContent className="p-0">
                        <div className="w-8 h-8 bg-accent/20 rounded-lg mb-3"></div>
                        <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                        <div className="h-2 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-4 pt-8">
                    <Card className="p-4 shadow-lg">
                      <CardContent className="p-0">
                        <div className="w-8 h-8 bg-accent/20 rounded-lg mb-3"></div>
                        <div className="h-3 bg-muted rounded w-full mb-2"></div>
                        <div className="h-2 bg-muted rounded w-1/3"></div>
                      </CardContent>
                    </Card>
                    <Card className="p-4 shadow-lg">
                      <CardContent className="p-0">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg mb-3"></div>
                        <div className="h-3 bg-muted rounded w-4/5 mb-2"></div>
                        <div className="h-2 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-services-title">
              {isUzbek ? "AI Biznes Yechimlari" : "AI Business Solutions"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-services-subtitle">
              {isUzbek 
                ? "Biznes ehtiyojlaringizga moslashtirilgan AI xizmatlarimiz orqali raqamli transformatsiyani amalga oshiring"
                : "Achieve digital transformation through our AI services tailored to your business needs"
              }
            </p>
          </div>

          {/* Service Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-filter-${category}`}
              >
                {category === 'all' 
                  ? (isUzbek ? "Barchasi" : "All")
                  : category
                }
              </Button>
            ))}
          </div>

          {/* Services Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service: Service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  language={language}
                  onViewDetails={handleServiceDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-services">
                {isUzbek ? "Xizmatlar topilmadi" : "No services found"}
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleLogin}
              data-testid="button-view-all-services"
            >
              {isUzbek ? "Barcha xizmatlarni ko'rish" : "View All Services"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-foreground">Evolvo.uz</span>
              </div>
              <p className="text-muted-foreground">
                {isUzbek 
                  ? "AI asoslangan biznes yechimlari orqali kompaniyalarni raqamli transformatsiyaga olib boruvchi platforma."
                  : "A platform that leads companies to digital transformation through AI-based business solutions."
                }
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                {isUzbek ? "Xizmatlar" : "Services"}
              </h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "AI Chatbot" : "AI Chatbot"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Ma'lumotlar Tahlili" : "Data Analytics"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Marketing Avtomatizatsiyasi" : "Marketing Automation"}
                </a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                {isUzbek ? "Kompaniya" : "Company"}
              </h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Biz haqimizda" : "About Us"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Jamoa" : "Team"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Karyera" : "Careers"}
                </a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4">
                {isUzbek ? "Qo'llab-quvvatlash" : "Support"}
              </h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Yordam markazi" : "Help Center"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "Aloqa" : "Contact"}
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {isUzbek ? "API Hujjatlari" : "API Docs"}
                </a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-muted-foreground text-sm">
                © 2024 Evolvo.uz. {isUzbek ? "Barcha huquqlar himoyalangan." : "All rights reserved."}
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  {isUzbek ? "Maxfiylik siyosati" : "Privacy Policy"}
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  {isUzbek ? "Foydalanish shartlari" : "Terms of Service"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Service Details Modal */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {isUzbek 
                    ? selectedService.title 
                    : (selectedService.titleEn || selectedService.title)
                  }
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isUzbek 
                    ? selectedService.description 
                    : (selectedService.descriptionEn || selectedService.description)
                  }
                </p>
                
                {(selectedService.features || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {isUzbek ? "Xususiyatlar:" : "Features:"}
                    </h4>
                    <ul className="space-y-2">
                      {(isUzbek 
                        ? (selectedService.features || [])
                        : (selectedService.featuresEn || selectedService.features || [])
                      ).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <span className="text-2xl font-bold">
                    {selectedService.price || (isUzbek ? "Narx so'rang" : "Request Price")}
                  </span>
                  <Button onClick={handleLogin} data-testid="button-get-started">
                    {isUzbek ? "Boshlash" : "Get Started"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
