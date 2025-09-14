import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User } from "lucide-react";

interface NavigationProps {
  language: 'uz' | 'en';
  onLanguageChange: (lang: 'uz' | 'en') => void;
}

export default function Navigation({ language, onLanguageChange }: NavigationProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isUzbek = language === 'uz';

  const navigationItems = [
    { 
      href: "/services", 
      label: isUzbek ? "Xizmatlar" : "Services",
      active: location.startsWith("/services")
    },
    { 
      href: "/blog", 
      label: isUzbek ? "Blog" : "Blog",
      active: location.startsWith("/blog")
    },
    { 
      href: "/portfolio", 
      label: isUzbek ? "Portfolio" : "Portfolio",
      active: location.startsWith("/portfolio")
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-foreground">Evolvo.uz</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  item.active ? 'text-foreground font-medium' : ''
                }`}
                data-testid={`link-${item.href.replace('#', '').replace('/', '')}`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => onLanguageChange('uz')}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                  language === 'uz'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-language-uz"
              >
                UZ
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-language-en"
              >
                EN
              </button>
            </div>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" data-testid="button-admin">
                      {isUzbek ? "Admin" : "Admin"}
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {user?.firstName || user?.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={handleLogin}
                  data-testid="button-login"
                >
                  {isUzbek ? "Kirish" : "Login"}
                </Button>
                <Button 
                  onClick={handleLogin}
                  data-testid="button-register"
                >
                  {isUzbek ? "Ro'yxatdan o'tish" : "Sign Up"}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-6">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-muted-foreground hover:text-foreground transition-colors ${
                        item.active ? 'text-foreground font-medium' : ''
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <button
                        onClick={() => onLanguageChange('uz')}
                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                          language === 'uz'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        UZ
                      </button>
                      <button
                        onClick={() => onLanguageChange('en')}
                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                          language === 'en'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                    
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        {user?.role === 'admin' && (
                          <Link href="/admin" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full">
                              {isUzbek ? "Admin Panel" : "Admin Panel"}
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full"
                        >
                          {isUzbek ? "Chiqish" : "Logout"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={handleLogin}
                          className="w-full"
                        >
                          {isUzbek ? "Kirish" : "Login"}
                        </Button>
                        <Button
                          onClick={handleLogin}
                          className="w-full"
                        >
                          {isUzbek ? "Ro'yxatdan o'tish" : "Sign Up"}
                        </Button>
                      </div>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
