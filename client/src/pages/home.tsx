import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const isUzbek = language === 'uz';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: isUzbek ? "Avtorizatsiya kerak" : "Authorization Required",
        description: isUzbek ? "Siz tizimga kirmagansiz. Kirish sahifasiga yo'naltirilmoqda..." : "You are not logged in. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast, isUzbek]);

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const recommendationMutation = useMutation({
    mutationFn: async (data: {
      businessType: string;
      businessSize: string;
      currentChallenges: string[];
      industry: string;
      budget?: string;
    }) => {
      const response = await apiRequest("POST", "/api/recommendations", {
        ...data,
        language,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "AI tavsiyalar yaratildi" : "AI recommendations generated successfully",
      });
      // Save recommendations
      if (data.recommendations.length > 0) {
        saveRecommendationMutation.mutate({
          businessType: recommendationForm.businessType,
          businessSize: recommendationForm.businessSize,
          currentChallenges: recommendationForm.currentChallenges.split(',').map(s => s.trim()),
          recommendedServices: data.priorityOrder,
          aiResponse: data.summary,
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: isUzbek ? "Avtorizatsiya kerak" : "Authorization Required",
          description: isUzbek ? "Siz tizimdan chiqgansiz. Qayta kirilmoqda..." : "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveRecommendationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/recommendations/save", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      setIsRecommendationOpen(false);
      setRecommendationForm({
        businessType: '',
        businessSize: '',
        currentChallenges: '',
        industry: '',
        budget: '',
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: isUzbek ? "Avtorizatsiya kerak" : "Authorization Required",
          description: isUzbek ? "Siz tizimdan chiqgansiz. Qayta kirilmoqda..." : "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [recommendationForm, setRecommendationForm] = useState({
    businessType: '',
    businessSize: '',
    currentChallenges: '',
    industry: '',
    budget: '',
  });

  const handleRecommendationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recommendationForm.businessType || !recommendationForm.businessSize || !recommendationForm.industry) {
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: isUzbek ? "Iltimos, barcha majburiy maydonlarni to'ldiring" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    recommendationMutation.mutate({
      ...recommendationForm,
      currentChallenges: recommendationForm.currentChallenges.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{isUzbek ? "Yuklanmoqda..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const stats = [
    {
      title: isUzbek ? "Jami xizmatlar" : "Total Services",
      value: services.length.toString(),
      icon: Sparkles,
      color: "text-primary",
    },
    {
      title: isUzbek ? "AI tavsiyalar" : "AI Recommendations",
      value: recommendations.length.toString(),
      icon: Lightbulb,
      color: "text-accent",
    },
    {
      title: isUzbek ? "Samaradorlik" : "Efficiency",
      value: "98%",
      icon: TrendingUp,
      color: "text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-welcome-title">
            {isUzbek ? "Xush kelibsiz" : "Welcome"}, {user?.firstName || user?.email}!
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-welcome-subtitle">
            {isUzbek 
              ? "AI yordamida biznesingizni rivojlantiring va yangi imkoniyatlarni kashf eting"
              : "Grow your business with AI and discover new opportunities"
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-${index}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* AI Recommendations Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {isUzbek ? "AI Tavsiyalar" : "AI Recommendations"}
              </h2>
              <Dialog open={isRecommendationOpen} onOpenChange={setIsRecommendationOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-get-recommendations">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isUzbek ? "Yangi tavsiya olish" : "Get New Recommendation"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {isUzbek ? "AI Biznes Tavsiyalari" : "AI Business Recommendations"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRecommendationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessType">
                          {isUzbek ? "Biznes turi" : "Business Type"} *
                        </Label>
                        <Input
                          id="businessType"
                          value={recommendationForm.businessType}
                          onChange={(e) => setRecommendationForm(prev => ({ ...prev, businessType: e.target.value }))}
                          placeholder={isUzbek ? "Masalan: Onlayn do'kon" : "e.g., Online Store"}
                          required
                          data-testid="input-business-type"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessSize">
                          {isUzbek ? "Biznes hajmi" : "Business Size"} *
                        </Label>
                        <Select 
                          value={recommendationForm.businessSize} 
                          onValueChange={(value) => setRecommendationForm(prev => ({ ...prev, businessSize: value }))}
                        >
                          <SelectTrigger data-testid="select-business-size">
                            <SelectValue placeholder={isUzbek ? "Biznes hajmini tanlang" : "Select business size"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="startup">
                              {isUzbek ? "Startap (1-10 xodim)" : "Startup (1-10 employees)"}
                            </SelectItem>
                            <SelectItem value="small">
                              {isUzbek ? "Kichik (11-50 xodim)" : "Small (11-50 employees)"}
                            </SelectItem>
                            <SelectItem value="medium">
                              {isUzbek ? "O'rta (51-200 xodim)" : "Medium (51-200 employees)"}
                            </SelectItem>
                            <SelectItem value="large">
                              {isUzbek ? "Katta (200+ xodim)" : "Large (200+ employees)"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="industry">
                        {isUzbek ? "Faoliyat sohasi" : "Industry"} *
                      </Label>
                      <Input
                        id="industry"
                        value={recommendationForm.industry}
                        onChange={(e) => setRecommendationForm(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder={isUzbek ? "Masalan: Elektron tijorat" : "e.g., E-commerce"}
                        required
                        data-testid="input-industry"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currentChallenges">
                        {isUzbek ? "Joriy muammolar" : "Current Challenges"}
                      </Label>
                      <Textarea
                        id="currentChallenges"
                        value={recommendationForm.currentChallenges}
                        onChange={(e) => setRecommendationForm(prev => ({ ...prev, currentChallenges: e.target.value }))}
                        placeholder={isUzbek 
                          ? "Vergul bilan ajratib yozing: Mijozlar bilan aloqa, Avtomatizatsiya yo'qligi"
                          : "Separate with commas: Customer support, Lack of automation"
                        }
                        rows={3}
                        data-testid="textarea-challenges"
                      />
                    </div>

                    <div>
                      <Label htmlFor="budget">
                        {isUzbek ? "Byudjet (ixtiyoriy)" : "Budget (optional)"}
                      </Label>
                      <Input
                        id="budget"
                        value={recommendationForm.budget}
                        onChange={(e) => setRecommendationForm(prev => ({ ...prev, budget: e.target.value }))}
                        placeholder={isUzbek ? "Masalan: $1000-5000/oy" : "e.g., $1000-5000/month"}
                        data-testid="input-budget"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsRecommendationOpen(false)}
                        data-testid="button-cancel-recommendation"
                      >
                        {isUzbek ? "Bekor qilish" : "Cancel"}
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={recommendationMutation.isPending}
                        data-testid="button-submit-recommendation"
                      >
                        {recommendationMutation.isPending 
                          ? (isUzbek ? "Tahlil qilinmoqda..." : "Analyzing...")
                          : (isUzbek ? "Tavsiya olish" : "Get Recommendations")
                        }
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((recommendation: any, index: number) => (
                  <Card key={recommendation.id || index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {isUzbek ? "AI Tavsiya" : "AI Recommendation"} #{index + 1}
                        </CardTitle>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(recommendation.createdAt).toLocaleDateString(
                            isUzbek ? 'uz-UZ' : 'en-US'
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-sm text-muted-foreground">
                            {isUzbek ? "Biznes turi:" : "Business Type:"}
                          </span>
                          <p className="text-sm">{recommendation.businessType}</p>
                        </div>
                        
                        {recommendation.aiResponse && (
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">
                              {isUzbek ? "AI tavsiyasi:" : "AI Recommendation:"}
                            </span>
                            <p className="text-sm leading-relaxed">{recommendation.aiResponse}</p>
                          </div>
                        )}
                        
                        {recommendation.recommendedServices && recommendation.recommendedServices.length > 0 && (
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">
                              {isUzbek ? "Tavsiya etilgan xizmatlar:" : "Recommended Services:"}
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {recommendation.recommendedServices.slice(0, 3).map((serviceId: string, idx: number) => {
                                const service = services.find((s: any) => s.id === serviceId);
                                return service ? (
                                  <Badge key={serviceId} variant="outline">
                                    {isUzbek ? service.title : (service.titleEn || service.title)}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isUzbek ? "Hali tavsiyalar yo'q" : "No recommendations yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {isUzbek 
                      ? "Biznesingiz uchun AI tavsiyalarini olish uchun boshlang"
                      : "Start by getting AI recommendations for your business"
                    }
                  </p>
                  <Button 
                    onClick={() => setIsRecommendationOpen(true)}
                    data-testid="button-start-recommendations"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isUzbek ? "Birinchi tavsiya olish" : "Get First Recommendation"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isUzbek ? "Tezkor amallar" : "Quick Actions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/services'}
                  data-testid="button-browse-services"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {isUzbek ? "Xizmatlarni ko'rish" : "Browse Services"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsRecommendationOpen(true)}
                  data-testid="button-ai-consultation"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isUzbek ? "AI maslahat" : "AI Consultation"}
                </Button>
                
                {user?.role === 'admin' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/admin'}
                    data-testid="button-admin-panel"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isUzbek ? "Admin panel" : "Admin Panel"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Latest Services */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isUzbek ? "Yangi xizmatlar" : "Latest Services"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {services.slice(0, 3).map((service: any) => (
                  <div key={service.id} className="flex items-center space-x-3 py-2">
                    <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isUzbek ? service.title : (service.titleEn || service.title)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service.price || (isUzbek ? "Narx so'rang" : "Request Price")}
                      </p>
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isUzbek ? "Xizmatlar mavjud emas" : "No services available"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
