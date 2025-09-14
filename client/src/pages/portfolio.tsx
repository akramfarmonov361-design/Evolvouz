import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import type { Client } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink,
  Star,
  Calendar,
  Globe,
  Smartphone,
  Briefcase,
  TrendingUp
} from "lucide-react";

export default function Portfolio() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const isUzbek = language === 'uz';

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const categories = [
    { id: 'Technology', icon: Globe, label: isUzbek ? 'Texnologiya' : 'Technology' },
    { id: 'E-commerce', icon: Smartphone, label: isUzbek ? 'Elektron tijorat' : 'E-commerce' },
    { id: 'Finance', icon: Briefcase, label: isUzbek ? 'Moliya' : 'Finance' },
    { id: 'Healthcare', icon: TrendingUp, label: isUzbek ? 'Sog\'liqni saqlash' : 'Healthcare' }
  ];

  const filteredClients = clients.filter((client) => {
    return !selectedCategory || client.industry === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-portfolio">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-title">
            {isUzbek ? "Bizning Portfolio" : "Our Portfolio"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-subtitle">
            {isUzbek 
              ? "Mijozlarimiz bilan amalga oshirgan muvaffaqiyatli loyihalarimizni ko'ring"
              : "Explore our successful projects and client achievements"}
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant={selectedCategory === '' ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedCategory('')}
              className="flex items-center gap-2"
              data-testid="button-category-all"
            >
              <Star className="h-4 w-4" />
              {isUzbek ? "Barcha loyihalar" : "All Projects"}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
                data-testid={`button-category-${category.id}`}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Portfolio Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse" data-testid={`skeleton-project-${i}`}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1" data-testid={`card-project-${client.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" data-testid={`badge-type-${client.id}`}>
                      {categories.find(cat => cat.id === client.industry)?.label || client.industry || 'General'}
                    </Badge>
                    {client.status === 'active' && (
                      <Badge variant="default" data-testid={`badge-featured-${client.id}`}>
                        <Star className="h-3 w-3 mr-1" />
                        {isUzbek ? "Faol" : "Active"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2" data-testid={`text-client-name-${client.id}`}>
                    {client.companyName || client.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground" data-testid={`text-project-title-${client.id}`}>
                    {client.industry || (isUzbek ? 'Biznes hamkori' : 'Business Partner')}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Project Image Placeholder */}
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-all" data-testid={`img-project-${client.id}`}>
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4" data-testid={`text-description-${client.id}`}>
                    {client.notes || (isUzbek ? 'Muvaffaqiyatli hamkorlik loyihasi' : 'Successful partnership project')}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span data-testid={`text-date-${client.id}`}>
                        {client.createdAt ? new Date(client.createdAt).getFullYear() : new Date().getFullYear()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span data-testid={`text-status-${client.id}`}>
                        {client.status === 'active' ? (isUzbek ? 'Faol' : 'Active') : 
                         client.status === 'inactive' ? (isUzbek ? 'Yakunlangan' : 'Completed') :
                         (isUzbek ? 'Potensial' : 'Potential')}
                      </span>
                    </div>
                  </div>

                  {/* Industry/Tags */}
                  {client.industry && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      <Badge variant="outline" className="text-xs" data-testid={`badge-industry-${client.id}`}>
                        {client.industry}
                      </Badge>
                      {client.companySize && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-size-${client.id}`}>
                          {client.companySize}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {client.companyWebsite && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={() => client.companyWebsite && window.open(client.companyWebsite, '_blank')}
                        data-testid={`button-view-project-${client.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {isUzbek ? "Ko'rish" : "View"}
                      </Button>
                    )}
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-details-${client.id}`}
                    >
                      {isUzbek ? "Batafsil" : "Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2" data-testid="text-no-projects">
              {isUzbek ? "Hech qanday loyiha topilmadi" : "No projects found"}
            </h3>
            <p className="text-muted-foreground" data-testid="text-no-projects-description">
              {isUzbek 
                ? "Tez orada yangi loyihalar qo'shiladi"
                : "New projects will be added soon"}
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4" data-testid="text-cta-title">
                {isUzbek ? "Keyingi loyiha sizniki bo'lsin!" : "Let your project be next!"}
              </h3>
              <p className="text-muted-foreground mb-6" data-testid="text-cta-description">
                {isUzbek 
                  ? "Bizning tajribali jamoamiz bilan o'z g'oyangizni hayotga tatbiq eting"
                  : "Turn your ideas into reality with our experienced team"}
              </p>
              <Button size="lg" data-testid="button-start-project">
                {isUzbek ? "Loyiha boshlash" : "Start a Project"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}