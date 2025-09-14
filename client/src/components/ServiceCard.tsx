import { Service } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  BarChart3, 
  Heart, 
  Lightbulb, 
  Cog, 
  BookOpen,
  ArrowRight
} from "lucide-react";

interface ServiceCardProps {
  service: Service;
  language: 'uz' | 'en';
  onViewDetails: (service: Service) => void;
}

const getServiceIcon = (iconType: string | null) => {
  switch (iconType) {
    case 'chat':
      return MessageCircle;
    case 'analytics':
      return BarChart3;
    case 'automation':
      return Cog;
    case 'marketing':
      return Heart;
    case 'text-analysis':
      return Lightbulb;
    case 'training':
      return BookOpen;
    default:
      return Lightbulb;
  }
};

export default function ServiceCard({ service, language, onViewDetails }: ServiceCardProps) {
  const isUzbek = language === 'uz';
  const IconComponent = getServiceIcon(service.iconType);
  
  const title = isUzbek ? service.title : (service.titleEn || service.title);
  const shortDescription = isUzbek 
    ? service.shortDescription 
    : (service.shortDescriptionEn || service.shortDescription);
  const features = isUzbek 
    ? (service.features || []) 
    : (service.featuresEn || service.features || []);
  const category = isUzbek 
    ? service.category 
    : (service.categoryEn || service.category);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          {category && (
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-3 text-foreground" data-testid={`text-service-title-${service.id}`}>
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-4 flex-1" data-testid={`text-service-description-${service.id}`}>
          {shortDescription}
        </p>
        
        {features.length > 0 && (
          <div className="space-y-3 mb-6">
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-service-price-${service.id}`}>
            {service.price || (isUzbek ? "Narx so'rang" : "Request Price")}
          </span>
          <Button 
            onClick={() => onViewDetails(service)}
            className="group/btn"
            data-testid={`button-service-details-${service.id}`}
          >
            {isUzbek ? "Batafsil" : "Details"}
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
