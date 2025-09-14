import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertServiceSchema, type Service } from "@shared/schema";
import { z } from "zod";
import { X, Plus, Wand2 } from "lucide-react";

const formSchema = insertServiceSchema.extend({
  features: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceFormProps {
  service?: Service;
  language: 'uz' | 'en';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const iconTypes = [
  { value: 'chat', label: 'Chat/Messaging' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'automation', label: 'Automation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'text-analysis', label: 'Text Analysis' },
  { value: 'training', label: 'Training' },
];

export default function ServiceForm({ service, language, onSuccess, onCancel }: ServiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isUzbek = language === 'uz';
  const isEditing = !!service;
  
  const [features, setFeatures] = useState<string[]>(service?.features || []);
  const [featuresEn, setFeaturesEn] = useState<string[]>(service?.featuresEn || []);
  const [newFeature, setNewFeature] = useState("");
  const [newFeatureEn, setNewFeatureEn] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: service?.title || "",
      titleEn: service?.titleEn || "",
      description: service?.description || "",
      descriptionEn: service?.descriptionEn || "",
      shortDescription: service?.shortDescription || "",
      shortDescriptionEn: service?.shortDescriptionEn || "",
      price: service?.price || "",
      category: service?.category || "",
      categoryEn: service?.categoryEn || "",
      iconType: service?.iconType || "lightbulb",
      aiPrompt: service?.aiPrompt || "",
      isActive: service?.isActive ?? true,
      features: service?.features || [],
      featuresEn: service?.featuresEn || [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/services", {
        ...data,
        features,
        featuresEn,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "Xizmat yaratildi" : "Service created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", `/api/services/${service!.id}`, {
        ...data,
        features,
        featuresEn,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "Xizmat yangilandi" : "Service updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async ({ serviceType, language }: { serviceType: string; language: 'uz' | 'en' }) => {
      const response = await apiRequest("POST", "/api/ai/generate-service", {
        serviceType,
        language,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (language === 'uz') {
        form.setValue('title', data.title);
        form.setValue('description', data.description);
        form.setValue('shortDescription', data.shortDescription);
        form.setValue('category', data.category);
        setFeatures(data.features);
      } else {
        form.setValue('titleEn', data.title);
        form.setValue('descriptionEn', data.description);
        form.setValue('shortDescriptionEn', data.shortDescription);
        form.setValue('categoryEn', data.category);
        setFeaturesEn(data.features);
      }
      toast({
        title: isUzbek ? "Muvaffaqiyat" : "Success",
        description: isUzbek ? "AI mazmun yaratildi" : "AI content generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: isUzbek ? "Xatolik" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addFeature = (lang: 'uz' | 'en') => {
    const feature = lang === 'uz' ? newFeature : newFeatureEn;
    if (feature.trim()) {
      if (lang === 'uz') {
        setFeatures([...features, feature.trim()]);
        setNewFeature("");
      } else {
        setFeaturesEn([...featuresEn, feature.trim()]);
        setNewFeatureEn("");
      }
    }
  };

  const removeFeature = (index: number, lang: 'uz' | 'en') => {
    if (lang === 'uz') {
      setFeatures(features.filter((_, i) => i !== index));
    } else {
      setFeaturesEn(featuresEn.filter((_, i) => i !== index));
    }
  };

  const generateContent = () => {
    const serviceType = form.getValues('title') || form.getValues('titleEn') || 'AI Service';
    generateContentMutation.mutate({ serviceType, language });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {isEditing 
              ? (isUzbek ? "Xizmatni tahrirlash" : "Edit Service")
              : (isUzbek ? "Yangi xizmat yaratish" : "Create New Service")
            }
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateContent}
            disabled={generateContentMutation.isPending}
            data-testid="button-generate-content"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isUzbek ? "AI yaratish" : "AI Generate"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uzbek Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">O'zbek tili</h3>
              
              <div>
                <Label htmlFor="title">Nomi *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  data-testid="input-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shortDescription">Qisqa tavsif</Label>
                <Textarea
                  id="shortDescription"
                  {...form.register("shortDescription")}
                  rows={2}
                  data-testid="textarea-short-description"
                />
              </div>

              <div>
                <Label htmlFor="description">To'liq tavsif</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  rows={4}
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategoriya</Label>
                <Input
                  id="category"
                  {...form.register("category")}
                  data-testid="input-category"
                />
              </div>

              <div>
                <Label>Xususiyatlar</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Yangi xususiyat"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature('uz'))}
                      data-testid="input-new-feature-uz"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addFeature('uz')}
                      data-testid="button-add-feature-uz"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeFeature(index, 'uz')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* English Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">English</h3>
              
              <div>
                <Label htmlFor="titleEn">Title</Label>
                <Input
                  id="titleEn"
                  {...form.register("titleEn")}
                  data-testid="input-title-en"
                />
              </div>

              <div>
                <Label htmlFor="shortDescriptionEn">Short Description</Label>
                <Textarea
                  id="shortDescriptionEn"
                  {...form.register("shortDescriptionEn")}
                  rows={2}
                  data-testid="textarea-short-description-en"
                />
              </div>

              <div>
                <Label htmlFor="descriptionEn">Full Description</Label>
                <Textarea
                  id="descriptionEn"
                  {...form.register("descriptionEn")}
                  rows={4}
                  data-testid="textarea-description-en"
                />
              </div>

              <div>
                <Label htmlFor="categoryEn">Category</Label>
                <Input
                  id="categoryEn"
                  {...form.register("categoryEn")}
                  data-testid="input-category-en"
                />
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeatureEn}
                      onChange={(e) => setNewFeatureEn(e.target.value)}
                      placeholder="New feature"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature('en'))}
                      data-testid="input-new-feature-en"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addFeature('en')}
                      data-testid="button-add-feature-en"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {featuresEn.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removeFeature(index, 'en')}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">
                {isUzbek ? "Narx" : "Price"}
              </Label>
              <Input
                id="price"
                {...form.register("price")}
                placeholder="$299/month"
                data-testid="input-price"
              />
            </div>

            <div>
              <Label htmlFor="iconType">
                {isUzbek ? "Ikon turi" : "Icon Type"}
              </Label>
              <Select 
                value={form.watch("iconType") || ""} 
                onValueChange={(value) => form.setValue("iconType", value)}
              >
                <SelectTrigger data-testid="select-icon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconTypes.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">
                {isUzbek ? "Faol" : "Active"}
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="aiPrompt">
              {isUzbek ? "AI so'rov (ixtiyoriy)" : "AI Prompt (optional)"}
            </Label>
            <Textarea
              id="aiPrompt"
              {...form.register("aiPrompt")}
              rows={3}
              placeholder={isUzbek 
                ? "Bu xizmat uchun AI tavsiyalari yaratish uchun maxsus so'rov" 
                : "Special prompt for generating AI recommendations for this service"
              }
              data-testid="textarea-ai-prompt"
            />
          </div>

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel"
              >
                {isUzbek ? "Bekor qilish" : "Cancel"}
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending
                ? (isUzbek ? "Saqlanmoqda..." : "Saving...")
                : isEditing
                ? (isUzbek ? "Yangilash" : "Update")
                : (isUzbek ? "Yaratish" : "Create")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
