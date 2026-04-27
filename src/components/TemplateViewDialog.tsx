import { Template } from './TemplateFilingSystem';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, User, FileText, CheckSquare, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface TemplateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export function TemplateViewDialog({ open, onOpenChange, template }: TemplateViewDialogProps) {
  if (!template) return null;

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
      opening: 'Opening',
      closing: 'Closing',
      delivery: 'Delivery',
      arrangement: 'Arrangement',
      'customer-service': 'Customer Service',
      inventory: 'Inventory',
      maintenance: 'Maintenance',
      safety: 'Safety'
    };
    return labels[category];
  };

  const getTypeIcon = (type: Template['type']) => {
    switch (type) {
      case 'checklist':
        return <CheckSquare className="w-5 h-5 text-slate-400" />;
      case 'procedure':
        return <Clock className="w-5 h-5 text-slate-400" />;
      case 'guide':
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${template.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
              }
              h1 {
                color: #1e293b;
                margin-bottom: 10px;
              }
              .meta {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 20px;
              }
              .content {
                white-space: pre-wrap;
                line-height: 1.6;
                font-size: 14px;
              }
              @media print {
                body {
                  padding: 20px;
                }
              }
            </style>
          </head>
          <body>
            <h1>${template.title}</h1>
            <div class="meta">
              Category: ${getCategoryLabel(template.category)} | 
              Type: ${template.type.charAt(0).toUpperCase() + template.type.slice(1)} | 
              Last Updated: ${new Date(template.lastUpdated).toLocaleDateString()} | 
              Created By: ${template.createdBy}
            </div>
            <div class="content">${template.content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getTypeIcon(template.type)}
            {template.title}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getCategoryColor(template.category)}>
                {getCategoryLabel(template.category)}
              </Badge>
              <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 capitalize">
                {template.type}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Last Updated</div>
                <div className="text-slate-900">{new Date(template.lastUpdated).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Created By</div>
                <div className="text-slate-900">{template.createdBy}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-slate-900 mb-3">Content</h3>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <pre className="whitespace-pre-wrap font-sans text-slate-900 text-sm leading-relaxed">
                {template.content}
              </pre>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handlePrint}>
              Print Template
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
