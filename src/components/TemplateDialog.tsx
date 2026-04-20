import { useState, useEffect } from 'react';
import { Template } from './TemplateFilingSystem';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSave: (template: Omit<Template, 'id' | 'lastUpdated'>) => void;
}

export function TemplateDialog({ open, onOpenChange, template, onSave }: TemplateDialogProps) {
  const [formData, setFormData] = useState<Omit<Template, 'id' | 'lastUpdated'>>({
    title: '',
    category: 'opening',
    type: 'checklist',
    content: '',
    createdBy: 'Staff'
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        category: template.category,
        type: template.type,
        content: template.content,
        createdBy: template.createdBy
      });
    } else {
      setFormData({
        title: '',
        category: 'opening',
        type: 'checklist',
        content: '',
        createdBy: 'Staff'
      });
    }
  }, [template, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update the template details below.' : 'Create a new operational template for your team.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Daily Opening Checklist"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Template['category'] })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Template['type'] })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  placeholder="Your name or role"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the template content here. For checklists, use ☐ for items."
                rows={15}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-500">
                Tip: For checklists, start each line with ☐. For procedures, use numbered steps.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
