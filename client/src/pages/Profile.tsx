import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, Shield, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { user, logout, isLoggingOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 pt-20 flex flex-col items-center space-y-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <div className="w-full space-y-4 mt-8">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <h1 className="text-2xl font-display font-bold mb-2">Welcome to Storify</h1>
        <p className="text-muted-foreground mb-8">Sign in to sync your progress across devices.</p>
        <Button asChild size="lg" className="w-full max-w-xs">
          <a href="/api/login">Sign In / Sign Up</a>
        </Button>
      </div>
    );
  }

  const menuItems = [
    { icon: Settings, label: "Account Settings" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 py-4">
        <h1 className="text-2xl font-display font-bold">Profile</h1>
      </div>

      <div className="flex flex-col items-center pt-8 pb-12 px-6">
        <Avatar className="w-24 h-24 mb-4 ring-4 ring-background shadow-xl">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {user.firstName?.[0] || user.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        
        <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
        <p className="text-muted-foreground">{user.email}</p>
        
        <div className="w-full max-w-sm mt-12 space-y-3">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="outline"
              className="w-full justify-start h-14 text-base font-normal rounded-xl bg-card hover:bg-muted/50 border-border/50"
            >
              <item.icon className="w-5 h-5 mr-3 text-muted-foreground" />
              {item.label}
            </Button>
          ))}

          <div className="pt-8">
            <Button 
              variant="destructive" 
              className="w-full h-14 rounded-xl"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="w-5 h-5 mr-2" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
