import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThinkingPerson } from "@/components/illustrations";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // 404 tracking handled by analytics if configured
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center flex flex-col items-center">
        <ThinkingPerson size="md" showBackground={false} />
        <h1 className="mb-2 mt-6 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
