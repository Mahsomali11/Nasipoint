import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageHeader from '@/components/PageHeader';
import { Search, Trash2, Edit, Plus, X, FolderTree, FileText, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, currentStore } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingCategoryId, setViewingCategoryId] = useState<string | null>(null);

  const storeCategories = categories.filter(c => c.store_id === currentStore?.id);
  const viewingCategory = viewingCategoryId ? storeCategories.find(c => c.id === viewingCategoryId) : null;
  const categoriesToDisplay = viewingCategory 
    ? storeCategories.filter(c => c.parent_id === viewingCategoryId)
    : storeCategories.filter(c => !c.parent_id);

  const filtered = categoriesToDisplay.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const categoryToDelete = deleteId ? categories.find(c => c.id === deleteId) : null;

  const handleOpenForm = (category?: any) => {
    if (category) {
      setEditingId(category.id);
      setForm({ name: category.name, description: category.description || '', parent_id: category.parent_id || '' });
    } else {
      setEditingId(null);
      setForm({ name: '', description: '', parent_id: viewingCategoryId || '' });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    if (editingId) {
      await updateCategory(editingId, {
        name: form.name,
        description: form.description,
        parent_id: form.parent_id || null,
      });
      toast.success('Category updated');
    } else {
      await addCategory({
        store_id: currentStore.id,
        name: form.name,
        description: form.description,
        parent_id: form.parent_id || null,
      });
      toast.success('Category added');
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCategory(deleteId);
    toast.success('Category deleted');
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader 
        title={viewingCategory ? viewingCategory.name : "Categories"} 
        rightAction={
          <div className="flex items-center gap-3">
            {viewingCategory && (
              <button 
                onClick={() => setViewingCategoryId(null)}
                className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-all shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <button 
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add {viewingCategory ? 'Sub-Category' : 'Category'}</span>
            </button>
          </div>
        }
      />
      
      <div className="p-4 sm:p-6 md:px-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Controls Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search categories..."
              className="w-full pl-11 pr-4 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" 
            />
          </div>
          <div className="text-sm font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg w-full sm:w-auto text-center">
            {filtered.length} Categories
          </div>
        </div>

        {/* Data Table / Cards */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <FolderTree size={32} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-foreground font-semibold text-lg capitalize">No categories found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {search ? 'Try adjusting your search query.' : 'Create categories to organize your items.'}
            </p>
            {!search && (
              <button 
                onClick={() => handleOpenForm()}
                className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm"
              >
                Add Category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/10">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest w-1/3">Category Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest w-1/2">Description</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground  capitalize tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FolderTree size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm">{c.name}</span>
                            {c.parent_id && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                Sub-category of <span className="font-semibold">{storeCategories.find(p => p.id === c.parent_id)?.name || 'Unknown'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xl truncate">{c.description || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewingCategoryId(c.id)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm" title="View Sub-Categories"><Eye size={14} /></button>
                          <button onClick={() => handleOpenForm(c)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm" title="Edit Category"><Edit size={14} /></button>
                          <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg bg-background border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors shadow-sm" title="Delete Category"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacking Cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FolderTree size={20} />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-foreground text-base capitalize">{c.name}</h4>
                        {c.parent_id && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            Sub of <span className="font-semibold">{storeCategories.find(p => p.id === c.parent_id)?.name || 'Unknown'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingCategoryId(c.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Eye size={16} /></button>
                      <button onClick={() => handleOpenForm(c)} className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><Edit size={16} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  {c.description && (
                    <div className="pt-3 border-t border-border/50">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText size={14} className="text-muted-foreground/70 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{c.description}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-border bg-muted/10">
              <h3 className="text-xl font-bold text-foreground capitalize">{editingId ? 'Edit Category' : 'Add Category'}</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Category Name <span className="text-destructive">*</span></label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="e.g. Beverages"
                  className="w-full px-4 py-2 h-11 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Parent Category (Optional)</label>
                <SearchableSelect 
                  value={form.parent_id} 
                  onChange={val => setForm(f => ({ ...f, parent_id: val }))}
                  options={storeCategories
                    .filter(c => c.id !== editingId && !c.parent_id)
                    .map(c => ({ value: c.id, label: c.name }))}
                  placeholder="None (Top-Level Category)"
                  searchPlaceholder="Search parent category..."
                  clearLabel="None (Top-Level Category)"
                  allowClear
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground  capitalize tracking-wider mb-2">Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  placeholder="Optional details about this category"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all resize-none" 
                  rows={4} 
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-border mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground text-sm font-bold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity capitalize"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{categoryToDelete?.name}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11 font-bold">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
