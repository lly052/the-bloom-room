import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Plus, Eye, Pencil, Trash2, FileText, CheckSquare, Clock } from 'lucide-react';
import { TemplateDialog } from './TemplateDialog';
import { TemplateViewDialog } from './TemplateViewDialog';
import { supabase } from '../utils/supabase';

export interface Template {
  id: string;
  title: string;
  category: 'opening' | 'closing' | 'delivery' | 'arrangement' | 'customer-service' | 'inventory' | 'maintenance' | 'safety';
  type: 'checklist' | 'procedure' | 'guide';
  content: string;
  lastUpdated: string;
  createdBy: string;
}

type TemplateRow = {
  id: string;
  title: string;
  category: string;
  type: string;
  content: string;
  last_updated: string;
  created_by: string;
};

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Template['category'],
    type: row.type as Template['type'],
    content: row.content,
    lastUpdated: row.last_updated,
    createdBy: row.created_by,
  };
}

export function TemplateFilingSystem() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('last_updated', { ascending: false });
      if (!error && data) setTemplates(data.map(rowToTemplate));
      setLoading(false);
    }
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch =
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesType = typeFilter === 'all' || template.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [templates, searchQuery, categoryFilter, typeFilter]);

  const getCategoryColor = (category: Template['category']) => {
    const colors = {
      opening: 'bg-blue-100 text-blue-800 border-blue-200',
      closing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivery: 'bg-orange-100 text-orange-800 border-orange-200',
      arrangement: 'bg-pink-100 text-pink-800 border-pink-200',
      'customer-service': 'bg-purple-100 text-purple-800 border-purple-200',
      inventory: 'bg-green-100 text-green-800 border-green-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      safety: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[category];
  };

  const getCategoryLabel = (category: Template['category']) => {
    const labels = {
      opening: 'Opening', closing: 'Closing', delivery: 'Delivery',
      arrangement: 'Arrangement', 'customer-service': 'Customer Service',
      inventory: 'Inventory', maintenance: 'Maintenance', safety: 'Safety'
    };
    return labels[category];
  };

  const getTypeIcon = (type: Template['type']) => {
    if (type === 'checklist') return <CheckSquare className="w-4 h-4" />;
    if (type === 'procedure') return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const handleSaveTemplate = async (template: Omit<Template, 'id' | 'lastUpdated'>) => {
    const lastUpdated = new Date().toISOString().split('T')[0];
    if (editingTemplate) {
      const { error } = await supabase.from('templates').update({
        title: template.title,
        category: template.category,
        type: template.type,
        content: template.content,
        created_by: template.createdBy,
        last_updated: lastUpdated,
      }).eq('id', editingTemplate.id);

      if (!error) {
        setTemplates(prev => prev.map(t =>
          t.id === editingTemplate.id ? { ...template, id: editingTemplate.id, lastUpdated } : t
        ));
      }
    } else {
      const { data, error } = await supabase.from('templates').insert({
        title: template.title,
        category: template.category,
        type: template.type,
        content: template.content,
        created_by: template.createdBy,
        last_updated: lastUpdated,
      }).select().single();

      if (!error && data) setTemplates(prev => [rowToTemplate(data), ...prev]);
    }
    setIsAddDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const { error } = await supabase.from('templates').delete().eq('id', id);
      if (!error) setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operational Files</CardTitle>
              <CardDescription>Standard procedures and checklists for daily operations</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search files..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="arrangement">Arrangement</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-slate-600">
              Showing {filteredTemplates.length} of {templates.length} files
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-12">Loading files...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center text-slate-500 py-12">No files found</div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(template.type)}
                            <CardTitle className="text-base">{template.title}</CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 capitalize">
                            {template.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-slate-600 line-clamp-3">
                            {template.content.split('\n')[0]}
                          </div>
                          <div className="text-xs text-slate-500">
                            Updated {new Date(template.lastUpdated).toLocaleDateString()} • {template.createdBy}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setViewingTemplate(template)} className="flex-1">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TemplateDialog
        open={isAddDialogOpen || editingTemplate !== null}
        onOpenChange={(open) => { if (!open) { setIsAddDialogOpen(false); setEditingTemplate(null); } }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      <TemplateViewDialog
        open={viewingTemplate !== null}
        onOpenChange={(open) => { if (!open) setViewingTemplate(null); }}
        template={viewingTemplate}
      />
    </div>
  );
}
