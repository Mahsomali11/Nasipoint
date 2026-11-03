import { forwardRef } from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

const FAB = forwardRef<HTMLButtonElement, FABProps>(({ onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <Plus size={28} />
    </button>
  );
});

FAB.displayName = 'FAB';

export default FAB;
