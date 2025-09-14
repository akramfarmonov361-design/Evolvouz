import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import type { BlogPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Eye, 
  Search,
  ArrowRight,
  User
} from "lucide-react";

export default function Blog() {
  const [language, setLanguage] = useState<'uz' | 'en'>('uz');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const isUzbek = language === 'uz';

  const { data: blogPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  const categories = ['AI', 'Business', 'Technology', 'Marketing', 'Strategy'];

  const filteredPosts = blogPosts.filter((post) => {
    const title = isUzbek ? post.title : (post.titleEn || post.title);
    const content = isUzbek ? post.content : (post.contentEn || post.content);
    const category = isUzbek ? post.category : (post.categoryEn || post.category);
    
    const matchesSearch = !searchTerm || 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || category === selectedCategory;
    
    return matchesSearch && matchesCategory && post.status === 'published';
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-blog">
      <Navigation language={language} onLanguageChange={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-title">
            {isUzbek ? "Evolvo Blog" : "Evolvo Blog"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-subtitle">
            {isUzbek 
              ? "AI va biznes sohasidagi eng so'nggi yangiliklarni o'qing"
              : "Read the latest insights on AI and business innovation"}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={isUzbek ? "Maqolalarni qidiring..." : "Search articles..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === '' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('')}
              data-testid="button-category-all"
            >
              {isUzbek ? "Barchasi" : "All"}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase()}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse" data-testid={`skeleton-post-${i}`}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" data-testid={`badge-category-${post.id}`}>
                      {isUzbek ? post.category : (post.categoryEn || post.category)}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 mr-1" />
                      <span data-testid={`text-views-${post.id}`}>{post.viewCount || 0}</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-post-title-${post.id}`}>
                    {isUzbek ? post.title : (post.titleEn || post.title)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 mb-4" data-testid={`text-post-excerpt-${post.id}`}>
                    {isUzbek ? post.excerpt : (post.excerptEn || post.excerpt)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span data-testid={`text-author-${post.id}`}>{post.authorId || 'Admin'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span data-testid={`text-date-${post.id}`}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(isUzbek ? 'uz-UZ' : 'en-US') : new Date().toLocaleDateString(isUzbek ? 'uz-UZ' : 'en-US')}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    data-testid={`button-read-more-${post.id}`}
                  >
                    {isUzbek ? "Batafsil o'qish" : "Read More"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2" data-testid="text-no-posts">
              {isUzbek ? "Hech qanday maqola topilmadi" : "No articles found"}
            </h3>
            <p className="text-muted-foreground" data-testid="text-no-posts-description">
              {isUzbek 
                ? "Qidiruv shartlaringizni o'zgartiring yoki keyinroq qaytib keling"
                : "Try adjusting your search criteria or check back later"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}