import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/Navigation";
import type { Service } from "@shared/schema";
import { publicInsertOrderSchema, type PublicInsertOrder } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  CheckCircle,
  DollarSign,
  Calendar,
  MessageSquare,
  Building
} from "lucide-react";

// Use shared schema for consistency with backend, with form-friendly types
const orderSchema = publicInsertOrderSchema.extend({
  // Ensure optional fields are strings, not nullable for form inputs
  clientPhone: z.string().optional(),
  companyName: z.string().optional(), 
  projectDescription: z.string().min(10, "Please provide a detailed description"),
  budget: z.string().min(1, "Budget is required"),
  timeline: z.string().min(1, "Timeline is required"),
  requirements: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function Order() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isUzbek = language === 'uz';

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      companyName: "",
      projectDescription: "",
      budget: "",
      timeline: "",
      requirements: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderForm) => apiRequest("POST", "/api/orders", data),
    onSuccess: () => {
      toast({
        title: isUzbek ? "Buyurtma muvaffaqiyatli yuborildi!" : "Order submitted successfully!",
        description: isUzbek 
          ? "Tez orada siz bilan bog'lanamiz." 
          : "We will contact you shortly.",
      });
      form.reset();
      setSelectedService(null);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: isUzbek ? "Xatolik yuz berdi" : "Error occurred",
        description: error.message || (isUzbek ? "Iltimos qaytadan urinib ko'ring" : "Please try again"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderForm) => {
    createOrderMutation.mutate(data);
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    form.setValue('serviceId', serviceId);
  };

  const budgetOptions = [
    { value: "under-5k", label: isUzbek ? "$5,000 gacha" : "Under $5,000" },
    { value: "5k-15k", label: "$5,000 - $15,000" },
    { value: "15k-50k", label: "$15,000 - $50,000" },
    { value: "over-50k", label: isUzbek ? "$50,000 dan yuqori" : "Over $50,000" },
    { value: "discuss", label: isUzbek ? "Muhokama qilamiz" : "Let's discuss" },
  ];

  const timelineOptions = [
    { value: "asap", label: isUzbek ? "Imkon qadar tez" : "ASAP" },
    { value: "1-month", label: isUzbek ? "1 oy" : "1 month" },
    { value: "2-3-months", label: isUzbek ? "2-3 oy" : "2-3 months" },
    { value: "3-6-months", label: isUzbek ? "3-6 oy" : "3-6 months" },
    { value: "flexible", label: isUzbek ? "Moslashuvchan" : "Flexible" },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="page-order">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-title">
            {isUzbek ? "Buyurtma Berish" : "Place an Order"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-subtitle">
            {isUzbek 
              ? "Bizning xizmatlardan foydalaning va o'z biznesingizni rivojlantiring"
              : "Get started with our services and grow your business"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="text-form-title">
                <ShoppingCart className="h-5 w-5" />
                {isUzbek ? "Buyurtma Ma'lumotlari" : "Order Details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Service Selection */}
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-service">
                          {isUzbek ? "Xizmatni tanlang" : "Select Service"} *
                        </FormLabel>
                        <Select onValueChange={handleServiceSelect} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service">
                              <SelectValue placeholder={isUzbek ? "Xizmatni tanlang" : "Choose a service"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.filter((s) => s.isActive).map((service) => (
                              <SelectItem key={service.id} value={service.id} data-testid={`option-service-${service.id}`}>
                                {isUzbek ? service.title : (service.titleEn || service.title)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Client Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-name">
                            {isUzbek ? "To'liq ismingiz" : "Full Name"} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={isUzbek ? "Ismingizni kiriting" : "Enter your name"} 
                              {...field} 
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-email">
                            {isUzbek ? "Email manzilingiz" : "Email Address"} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder={isUzbek ? "email@example.com" : "email@example.com"} 
                              {...field} 
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-phone">
                            {isUzbek ? "Telefon raqamingiz" : "Phone Number"} *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+998 90 123 45 67" 
                              {...field} 
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-company">
                            {isUzbek ? "Kompaniya nomi" : "Company Name"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={isUzbek ? "Kompaniya nomi (ixtiyoriy)" : "Company name (optional)"} 
                              {...field} 
                              data-testid="input-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Project Details */}
                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-description">
                          {isUzbek ? "Loyiha tavsifi" : "Project Description"} *
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={isUzbek 
                              ? "Loyihangiz haqida batafsil ma'lumot bering..."
                              : "Describe your project in detail..."
                            }
                            rows={4}
                            {...field} 
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-budget">
                            {isUzbek ? "Byudjet" : "Budget"} *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-budget">
                                <SelectValue placeholder={isUzbek ? "Byudjetni tanlang" : "Select budget range"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {budgetOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} data-testid={`option-budget-${option.value}`}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-timeline">
                            {isUzbek ? "Muddat" : "Timeline"} *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-timeline">
                                <SelectValue placeholder={isUzbek ? "Muddatni tanlang" : "Select timeline"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timelineOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} data-testid={`option-timeline-${option.value}`}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-requirements">
                          {isUzbek ? "Qo'shimcha talablar" : "Additional Requirements"}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={isUzbek 
                              ? "Qo'shimcha talablar yoki izohlar..."
                              : "Any additional requirements or notes..."
                            }
                            rows={3}
                            {...field} 
                            data-testid="textarea-requirements"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createOrderMutation.isPending ? (
                      isUzbek ? "Yuborilmoqda..." : "Submitting..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isUzbek ? "Buyurtma Berish" : "Submit Order"}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Selected Service Info & Summary */}
          <div className="space-y-6">
            {selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-selected-service-title">
                    {isUzbek ? "Tanlangan Xizmat" : "Selected Service"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-service-name">
                    {isUzbek ? selectedService.title : (selectedService.titleEn || selectedService.title)}
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid="text-service-description">
                    {isUzbek ? selectedService.description : (selectedService.descriptionEn || selectedService.description)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-service-price">
                        {isUzbek ? "Narx:" : "Price:"} {selectedService.price || (isUzbek ? "Kelishiladi" : "Contact us")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-service-duration">
                        {isUzbek ? "Muddat:" : "Duration:"} {isUzbek ? "Kelishiladi" : "To be discussed"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-process-title">
                  <MessageSquare className="h-5 w-5" />
                  {isUzbek ? "Keyingi Qadamlar" : "What Happens Next"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium" data-testid="step-1">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid="text-step-1-title">
                        {isUzbek ? "Buyurtma Ko'rib Chiqish" : "Order Review"}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-step-1-description">
                        {isUzbek 
                          ? "24 soat ichida buyurtmangizni ko'rib chiqamiz"
                          : "We'll review your order within 24 hours"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium" data-testid="step-2">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid="text-step-2-title">
                        {isUzbek ? "Konsultatsiya" : "Consultation"}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-step-2-description">
                        {isUzbek 
                          ? "Loyihangizni muhokama qilish uchun bog'lanamiz"
                          : "We'll contact you to discuss your project details"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium" data-testid="step-3">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid="text-step-3-title">
                        {isUzbek ? "Taklif Tayyorlash" : "Proposal"}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-step-3-description">
                        {isUzbek 
                          ? "Batafsil taklif va shartnoma tayyorlaymiz"
                          : "We'll prepare a detailed proposal and agreement"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}