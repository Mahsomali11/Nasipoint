import { useState, useEffect } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { useApp } from '@/context/AppContext';
import { Package, Users, ShoppingCart, UserPlus, CheckCircle2, Circle, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
  id: string;
  label: string;
  icon: typeof Package;
  check: () => boolean;
  path: string;
}

export default function OnboardingCards() {
  const { items, customers, sales, staffAccounts } = useApp();
  const navigate = (url, options) => router.visit(url, options);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem('onboarding_dismissed');
    if (done === 'true') setDismissed(true);
  }, []);

  const steps: OnboardingStep[] = [
    { id: 'products', label: 'Add your first product', icon: Package, check: () => items.length > 0, path: '/inventory' },
    { id: 'customers', label: 'Add your first customer', icon: Users, check: () => customers.length > 0, path: '/customers' },
    { id: 'sale', label: 'Make your first sale', icon: ShoppingCart, check: () => sales.length > 0, path: '/start-sale' },
    { id: 'staff', label: 'Invite staff members', icon: UserPlus, check: () => staffAccounts.length > 0, path: '/staff-accounts' },
  ];

  const completedCount = steps.filter(s => s.check()).length;
  const allComplete = completedCount === steps.length;
  const progress = (completedCount / steps.length) * 100;

  if (dismissed || allComplete) {
    if (allComplete && !dismissed) {
      localStorage.setItem('onboarding_dismissed', 'true');
    }
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('onboarding_dismissed', 'true');
  };

  return (
    <div className="bg-card rounded-2xl ring-1 ring-border shadow-sm p-4 lg:p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground text-sm capitalize">Getting Started</h3>
          <p className="text-xs text-muted-foreground">{completedCount}/{steps.length} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
          <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground capitalize">
            <X size={14} />
          </button>
        </div>
      </div>
      <Progress value={progress} className="h-1.5 mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {steps.map(step => {
          const done = step.check();
          return (
            <button
              key={step.id}
              onClick={() => !done && navigate(step.path)}
              className={`flex items-center gap-2 p-3 rounded-xl text-left transition-colors ${
                done
                  ? 'bg-primary/10 ring-1 ring-primary/20'
                  : 'bg-accent/50 ring-1 ring-border hover:ring-primary/40'
              }`}
            >
              {done ? (
                <CheckCircle2 size={16} className="text-primary shrink-0" />
              ) : (
                <Circle size={16} className="text-muted-foreground shrink-0" />
              )}
              <span className={`text-xs font-semibold ${done ? 'text-primary line-through' : 'text-foreground'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
