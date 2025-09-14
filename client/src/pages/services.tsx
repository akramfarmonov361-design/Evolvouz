import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Service } from "@shared/schema";
import { Search, Filter } from "lucide-react";

export default function Services() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const isUzbek = language === 'uz';

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  // Filter services based on search and category
  const filteredServices = services.filter((service: Service) => {
    const title = isUzbek ? service.title : (service.titleEn || service.title);
    const description = isUzbek ? service.description : (service.descriptionEn || service.description);
    const category = isUzbek ? service.category : (service.categoryEn || service.category);
    
    const matchesSearch = searchQuery === '' || 
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(services.map((s: Service) => s.category).filter(Boolean))];

  const handleServiceDetails = (service: Service) => {
    setSelectedService(service);
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-services-title">
            {isUzbek ? "AI Biznes Yechimlari" : "AI Business Solutions"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-services-subtitle">
            {isUzbek 
              ? "Biznes ehtiyojlaringizga moslashtirilgan AI xizmatlarimiz orqali raqamli transformatsiyani amalga oshiring"
              : "Achieve digital transformation through our AI services tailored to your business needs"
            }
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isUzbek ? "Xizmatlarni qidirish..." : "Search services..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-services"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {isUzbek ? "Barcha kategoriyalar" : "All Categories"}
                </SelectItem>
                {categories.filter(cat => cat !== 'all').map((category) => (
                  <SelectItem key={category} value={category || ''}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-xl mb-4"></div>
                <div className="h-6 bg-muted rounded mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
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
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2" data-testid="text-no-services-found">
              {isUzbek ? "Xizmatlar topilmadi" : "No services found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isUzbek 
                ? "Qidiruv so'zlaringizni o'zgartiring yoki filtrlarni tekshiring"
                : "Try adjusting your search terms or filters"
              }
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              data-testid="button-clear-filters"
            >
              {isUzbek ? "Filtrlarni tozalash" : "Clear Filters"}
            </Button>
          </div>
        )}

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
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="text-2xl font-bold">
                        {selectedService.price || (isUzbek ? "Narx so'rang" : "Request Price")}
                      </span>
                      {selectedService.category && (
                        <div className="text-sm text-muted-foreground">
                          {isUzbek 
                            ? selectedService.category 
                            : (selectedService.categoryEn || selectedService.category)
                          }
                        </div>
                      )}
                    </div>
                    <Button onClick={handleLogin} data-testid="button-get-started-modal">
                      {isUzbek ? "Boshlash" : "Get Started"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
