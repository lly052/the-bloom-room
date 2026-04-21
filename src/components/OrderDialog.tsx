import { useState, useEffect } from 'react';
import { Order } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { supabase } from '../utils/supabase';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSave: (order: Omit<Order, 'id' | 'orderNumber'>) => void;
}

const occasions = [
  'Birthday', 'Anniversary', 'Wedding', 'Sympathy', 'Congratulations',
  'Get Well', 'Thank You', 'Just Because', "Mother's Day", "Valentine's Day"
];

const emptyForm: Omit<Order, 'id' | 'orderNumber'> = {
  customer: '',
  email: '',
  product: '',
  arrangement: '',
  occasion: '',
  deliveryType: 'standard',
  deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  recipientName: '',
  deliveryAddress: '',
  message: '',
  quantity: 1,
  amount: 0,
  status: 'pending',
  date: new Date().toISOString().split('T')[0],
  priority: 'medium',
  notes: ''
};

export function OrderDialog({ open, onOpenChange, order, onSave }: OrderDialogProps) {
  const [formData, setFormData] = useState<Omit<Order, 'id' | 'orderNumber'>>(emptyForm);
  const [arrangementTypes, setArrangementTypes] = useState<string[]>([]);
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isSavingType, setIsSavingType] = useState(false);

  useEffect(() => {
    async function fetchArrangementTypes() {
      const { data, error } = await supabase
        .from('arrangement_types')
        .select('name')
        .order('name');
      if (!error && data) setArrangementTypes(data.map(row => row.name));
    }
    fetchArrangementTypes();
  }, [open]);

  async function handleAddNewType() {
    const trimmedName = newTypeName.trim();
    if (!trimmedName) return;

    setIsSavingType(true);

    const { error } = await supabase.from('arrangement_types').insert({ name: trimmedName });

    if (error) {
      alert('Could not add that type — it may already exist.');
    } else {
      setArrangementTypes(prev => [...prev, trimmedName].sort());
      updateField({ arrangement: trimmedName, product: trimmedName });
      setNewTypeName('');
      setShowAddTypeInput(false);
    }

    setIsSavingType(false);
  }

  useEffect(() => {
    if (order) {
      setFormData({
        customer: order.customer,
        email: order.email,
        product: order.product,
        arrangement: order.arrangement,
        occasion: order.occasion,
        deliveryType: order.deliveryType,
        deliveryDate: order.deliveryDate,
        recipientName: order.recipientName,
        deliveryAddress: order.deliveryAddress,
        message: order.message,
        quantity: order.quantity,
        amount: order.amount,
        status: order.status,
        date: order.date,
        priority: order.priority,
        notes: order.notes
      });
    } else {
      setFormData(emptyForm);
    }
  }, [order, open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (changes: Partial<Omit<Order, 'id' | 'orderNumber'>>) => {
    setFormData(prev => ({ ...prev, ...changes }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Edit Flower Order' : 'Create New Flower Order'}</DialogTitle>
          <DialogDescription>
            {order ? 'Update the flower order details below.' : 'Fill in the details to create a new flower order.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">

            <div className="space-y-4">
              <h3 className="text-slate-900">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input id="customer" value={formData.customer} onChange={(e) => updateField({ customer: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => updateField({ email: e.target.value })} required />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-slate-900">Arrangement Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrangement">Arrangement Type</Label>
                  <Select value={formData.arrangement} onValueChange={(value: string) => updateField({ arrangement: value, product: value })}>
                    <SelectTrigger id="arrangement">
                      <SelectValue placeholder="Select arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                      {arrangementTypes.map((arr: string) => (
                        <SelectItem key={arr} value={arr}>{arr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!showAddTypeInput ? (
                    <button
                      type="button"
                      onClick={() => setShowAddTypeInput(true)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline mt-1"
                    >
                      + Add new arrangement type
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewType()}
                        placeholder="e.g. Summer Wildflower Mix"
                        autoFocus
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <Button type="button" size="sm" onClick={handleAddNewType} disabled={isSavingType}>
                        {isSavingType ? 'Saving...' : 'Add'}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => { setShowAddTypeInput(false); setNewTypeName(''); }}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select value={formData.occasion} onValueChange={(value: string) => updateField({ occasion: value })}>
                    <SelectTrigger id="occasion">
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {occasions.map((occ) => (
                        <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" min="1" value={formData.quantity}
                    onChange={(e) => updateField({ quantity: parseInt(e.target.value) || 1 })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input id="amount" type="number" min="0" step="0.01" value={formData.amount}
                    onChange={(e) => updateField({ amount: parseFloat(e.target.value) || 0 })} required />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-slate-900">Delivery Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input id="recipientName" value={formData.recipientName}
                    onChange={(e) => updateField({ recipientName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <Select value={formData.deliveryType} onValueChange={(value: string) => updateField({ deliveryType: value as Order['deliveryType'] })}>
                    <SelectTrigger id="deliveryType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery</SelectItem>
                      <SelectItem value="express">Express Delivery</SelectItem>
                      <SelectItem value="same-day">Same Day Delivery</SelectItem>
                      <SelectItem value="collection">Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.deliveryType !== 'collection' && (
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Input id="deliveryAddress" value={formData.deliveryAddress}
                    onChange={(e) => updateField({ deliveryAddress: e.target.value })} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">
                  {formData.deliveryType === 'collection' ? 'Collection Date' : 'Delivery Date'}
                </Label>
                <Input id="deliveryDate" type="date" value={formData.deliveryDate}
                  onChange={(e) => updateField({ deliveryDate: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Card Message</Label>
                <Textarea id="message" value={formData.message}
                  onChange={(e) => updateField({ message: e.target.value })}
                  placeholder="Optional message for the card" rows={2} />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-slate-900">Order Management</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: string) => updateField({ status: value as Order['status'] })}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="arranged">Arranged</SelectItem>
                      <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: string) => updateField({ priority: value as Order['priority'] })}>
                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Order Date</Label>
                  <Input id="date" type="date" value={formData.date}
                    onChange={(e) => updateField({ date: e.target.value })} required />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-slate-900">Notes & Specifics</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea id="notes" value={formData.notes}
                  onChange={(e) => updateField({ notes: e.target.value })}
                  placeholder="e.g. No strong scents, add extra ribbon, fragrance-free only, allergic to lilies..."
                  rows={4} />
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{order ? 'Update Order' : 'Create Order'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
