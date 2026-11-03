import { forwardRef } from 'react';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(({ title, showBack = false, rightAction }, ref) => {
  const navigate = (url: string | number, options?: any) => {
    if (typeof url === 'number') {
      window.history.go(url);
    } else {
      router.visit(url, options);
    }
  };

  return (
    <header ref={ref} className="sticky top-0 z-30 px-4 sm:px-6 md:px-8 py-4 sm:py-5 bg-background/80 backdrop-blur-md border-b border-border shadow-sm mb-6">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <button 
              onClick={() => navigate(-1)} 
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight capitalize">{title}</h1>
        </div>
        {rightAction && (
           <div className="flex items-center gap-3">
              {rightAction}
           </div>
        )}
      </div>
    </header>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
