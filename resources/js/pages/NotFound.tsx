import { usePage } from '@inertiajs/react';
import { useEffect } from "react";
import { ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const { url } = usePage(); 
  const location = { pathname: url };

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-background p-4 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="text-center relative z-10 max-w-md w-full bg-card rounded-3xl border border-border p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-8 border border-border">
           <SearchX size={48} className="text-muted-foreground" />
        </div>
        
        <h1 className="mb-2 text-7xl font-black text-foreground tracking-tighter capitalize">404</h1>
        <p className="mb-8 text-xl font-bold text-muted-foreground">Oops! Page not found.</p>
        
        <div className="bg-muted/30 rounded-2xl p-4 mb-8">
           <p className="text-sm font-medium text-muted-foreground">
             The page you are looking for doesn't exist or has been moved.
           </p>
        </div>

        <a href="/" className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl">
          <ArrowLeft size={20} />
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
