import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import ServiceForm from "@/components/ServiceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Service, ServiceInquiry } from "@shared/schema";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart3, 
  DollarSign, 
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Admin() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const isUzbek = language === 'uz';

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: isUzbek ? "Ruxsat yo'q" : "Access Denied",
        description: isUzbek ? "Siz admin emassiz. Bosh sahifaga yo'naltirilmoqda..." : "You are not an admin. Redirecting to home...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, user, toast, isUzbek]);

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ["/api/inquiries"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "Xizmat o'chirildi" : "Service deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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

  const updateInquiryStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/inquiries/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "So'rov holati yangilandi" : "Inquiry status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
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

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsServiceFormOpen(true);
  };

  const handleDeleteService = (id: string) => {
    deleteServiceMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setIsServiceFormOpen(false);
    setEditingService(null);
  };

  const handleFormCancel = () => {
    setIsServiceFormOpen(false);
    setEditingService(null);
  };

  const handleInquiryStatusChange = (inquiryId: string, status: string) => {
    updateInquiryStatusMutation.mutate({ id: inquiryId, status });
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

  if (!isAuthenticated || user?.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  const stats = [
    {
      title: isUzbek ? "Jami Xizmatlar" : "Total Services",
      value: services.length.toString(),
      icon: BarChart3,
      color: "text-primary",
    },
    {
      title: isUzbek ? "Faol So'rovlar" : "Active Inquiries",
      value: inquiries.filter((i: ServiceInquiry) => i.status === 'pending').length.toString(),
      icon: MessageSquare,
      color: "text-accent",
    },
    {
      title: isUzbek ? "Bu oy daromad" : "This Month Revenue",
      value: "$12,450",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: isUzbek ? "Mamnunlik" : "Satisfaction",
      value: "98.5%",
      icon: Star,
      color: "text-yellow-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{isUzbek ? "Kutilmoqda" : "Pending"}</Badge>;
      case 'contacted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{isUzbek ? "Bog'lanildi" : "Contacted"}</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{isUzbek ? "Yopildi" : "Closed"}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="secondary" className="bg-green-100 text-green-800">{isUzbek ? "Faol" : "Active"}</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-800">{isUzbek ? "Nofaol" : "Inactive"}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2" data-testid="text-admin-title">
              {isUzbek ? "Admin Boshqaruv Paneli" : "Admin Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {isUzbek ? "Xizmatlaringizni boshqaring va analitikani kuzating" : "Manage your services and track analytics"}
            </p>
          </div>
          <Button 
            onClick={() => setIsServiceFormOpen(true)}
            data-testid="button-add-service"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isUzbek ? "Yangi xizmat" : "Add Service"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-admin-stat-${index}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Services Management */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isUzbek ? "Xizmatlar Boshqaruvi" : "Services Management"}
              </CardTitle>
              <Button 
                variant="outline"
                onClick={() => setIsServiceFormOpen(true)}
                data-testid="button-add-service-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isUzbek ? "Yangi xizmat" : "Add Service"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/6"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="w-8 h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {isUzbek ? "Nomi" : "Name"}
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {isUzbek ? "Kategoriya" : "Category"}
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {isUzbek ? "Narx" : "Price"}
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {isUzbek ? "Holat" : "Status"}
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {isUzbek ? "Amallar" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service: Service) => (
                      <tr key={service.id} className="border-b border-border">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-foreground" data-testid={`text-service-name-${service.id}`}>
                                {isUzbek ? service.title : (service.titleEn || service.title)}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                {new Date(service.createdAt).toLocaleDateString(isUzbek ? 'uz-UZ' : 'en-US')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {isUzbek ? service.category : (service.categoryEn || service.category)}
                        </td>
                        <td className="p-4 text-foreground font-medium">
                          {service.price || (isUzbek ? "Narx so'rang" : "Request Price")}
                        </td>
                        <td className="p-4">
                          {getServiceStatusBadge(service.isActive)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              data-testid={`button-edit-service-${service.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  data-testid={`button-delete-service-${service.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {isUzbek ? "Xizmatni o'chirish" : "Delete Service"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {isUzbek 
                                      ? "Bu amalni qaytarib bo'lmaydi. Xizmat butunlay o'chiriladi."
                                      : "This action cannot be undone. The service will be permanently deleted."
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {isUzbek ? "Bekor qilish" : "Cancel"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteService(service.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isUzbek ? "O'chirish" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {isUzbek ? "Hali xizmatlar yo'q" : "No services yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isUzbek ? "Birinchi xizmatni yaratish uchun boshlang" : "Start by creating your first service"}
                </p>
                <Button onClick={() => setIsServiceFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isUzbek ? "Birinchi xizmat yaratish" : "Create First Service"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isUzbek ? "Xizmat So'rovlari" : "Service Inquiries"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inquiriesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry: ServiceInquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-foreground">
                          {inquiry.companyName || inquiry.contactEmail}
                        </span>
                        <Badge variant="outline">
                          {new Date(inquiry.createdAt).toLocaleDateString(isUzbek ? 'uz-UZ' : 'en-US')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {inquiry.contactEmail}
                      </p>
                      {inquiry.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {inquiry.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(inquiry.status)}
                      <Select
                        value={inquiry.status}
                        onValueChange={(status) => handleInquiryStatusChange(inquiry.id, status)}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-inquiry-status-${inquiry.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            {isUzbek ? "Kutilmoqda" : "Pending"}
                          </SelectItem>
                          <SelectItem value="contacted">
                            {isUzbek ? "Bog'lanildi" : "Contacted"}
                          </SelectItem>
                          <SelectItem value="closed">
                            {isUzbek ? "Yopildi" : "Closed"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {isUzbek ? "Hali so'rovlar yo'q" : "No inquiries yet"}
                </h3>
                <p className="text-muted-foreground">
                  {isUzbek ? "Mijozlar so'rovlari bu yerda ko'rinadi" : "Customer inquiries will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Form Modal */}
      <Dialog open={isServiceFormOpen} onOpenChange={() => !editingService && setIsServiceFormOpen(false)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService 
                ? (isUzbek ? "Xizmatni tahrirlash" : "Edit Service")
                : (isUzbek ? "Yangi xizmat yaratish" : "Create New Service")
              }
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            service={editingService || undefined}
            language={language}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
