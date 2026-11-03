import './index.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppProvider } from '@/context/AppContext';
import { AdminProvider } from '@/context/AdminContext';
import DesktopLayout from '@/components/DesktopLayout';
import { initSubmitGuard } from '@/lib/submit-guard';

// Initialize global double-click & duplicate submission guard
initSubmitGuard();

const queryClient = new QueryClient();

// Extract Inertia page data to fix compatibility with Laravel 10+ inertia adapter
let initialPageData = null;
const appEl = document.getElementById('app');
if (appEl && appEl.dataset.page) {
    initialPageData = JSON.parse(appEl.dataset.page);
} else {
    const scriptEl = document.querySelector('script[data-page="app"]');
    if (scriptEl) {
        initialPageData = JSON.parse(scriptEl.textContent);
    }
}

createInertiaApp({
    title: (title) => `${title} - Maaldhis`,
    page: initialPageData,
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        let page = pages[`./pages/${name}.tsx`];
        if (!page) {
            console.error(`Page not found: ./pages/${name}.tsx`);
            return;
        }
        
        // If it has a default export
        if (page.default) {
            // Apply Layouts
            const isAdmin = name.startsWith('admin/');
            
            if (!name.startsWith('LoginPage') && 
                !name.startsWith('SignupPage') && 
                !name.startsWith('ResetPasswordPage') &&
                !name.startsWith('CustomerDisplayPage') &&
                !name.startsWith('admin/AdminLoginPage') &&
                !name.startsWith('NotFound') && 
                !page.default.layout) {
                
                page.default.layout = (pageElement) => <DesktopLayout>{pageElement}</DesktopLayout>;
            }
        }
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <AdminProvider>
                        <AppProvider>
                            <Toaster />
                            <Sonner />
                            <App {...props} />
                        </AppProvider>
                    </AdminProvider>
                </TooltipProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
