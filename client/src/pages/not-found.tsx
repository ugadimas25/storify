import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Page Not Found
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button size="lg" className="w-full rounded-xl h-12 text-base shadow-lg shadow-primary/20">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
