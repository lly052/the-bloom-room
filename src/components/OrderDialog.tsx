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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null; // null = creating a new order, otherwise = editing
  onSave: (order: Omit<Order, 'id' | 'orderNumber'>) => void;
}

// ---------------------------------------------------------------------------
// Static data lists used in the dropdowns
// ---------------------------------------------------------------------------

// Occasions stay as a fixed list — these don't really change
// Arrangement types are now stored in Supabase so the user can add their own

const occasions = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Sympathy',
  'Congratulations',
  'Get Well',
  'Thank You',
  'Just Because',
  "Mother's Day",
  "Valentine's Day"
];

// ---------------------------------------------------------------------------
// Empty form — used when opening a blank "new order" form
// ---------------------------------------------------------------------------

const emptyForm: Omit<Order, 'id' | 'orderNumber'> = {
  customer: '',
  email: '',
  product: '',
  arrangement: '',
  occasion: '',
  deliveryType: 'standard',
  // Default delivery date is tomorrow
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderDialog({ open, onOpenChange, order, onSave }: OrderDialogProps) {
  // formData holds everything the user types into the form
  const [formData, setFormData] = useState<Omit<Order, 'id' | 'orderNumber'>>(emptyForm);

  // ---------------------------------------------------------------------------
  // Arrangement types — fetched from Supabase so the user can manage their own list
  // ---------------------------------------------------------------------------

  // The list of arrangement names shown in the dropdown
  const [arrangementTypes, setArrangementTypes] = useState<string[]>([]);

  // Controls whether the "add new type" input row is visible
  const [showAddTypeInput, setShowAddTypeInput] = useState(false);

  // What the user is typing in the "add new type" input
  const [newTypeName, setNewTypeName] = useState('');

  // Prevents double-clicking the save button
  const [isSavingType, setIsSavingType] = useState(false);

  // Fetch arrangement types from Supabase when the dialog opens
  useEffect(() => {
    async function fetchArrangementTypes() {
      const { data, error } = await supabase
        .from('arrangement_types')
        .select('name')
        .order('name');

      if (!error && data) {
        setArrangementTypes(data.map(row => row.name));
      }
    }
    fetchArrangementTypes();
  }, [open]); // Re-fetch every time the dialog opens so the list is always up to date

  // Called when the user clicks "Add" next to the new type input
  async function handleAddNewType() {
    const trimmedName = newTypeName.trim();

    // Don't save if the input is empty
    if (!trimmedName) return;

    setIsSavingType(true);

    const { error } = await supabase
      .from('arrangement_types')
      .insert({ name: trimmedName });

    if (error) {
      // The most likely cause is a duplicate name (unique constraint)
      alert('Could not add that type — it may already exist.');
    } else {
      // Add it to the local list straight away so it appears in the dropdown
      setArrangementTypes(prev => [...prev, trimmedName].sort());

      // Auto-select the new type in the form
      updateField({ arrangement: trimmedName, product: trimmedName });

      // Hide the input and clear it
      setNewTypeName('');
      setShowAddTypeInput(false);
    }

    setIsSavingType(false);
  }

  useEffect(() => {
    if (order) {
      // We are editing an existing order — pre-fill every field with its saved values
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
      // We are creating a new order — reset the form to empty defaults
      setFormData(emptyForm);
    }
  }, [order, open]);

  // Called when the user clicks "Create Order" or "Update Order"
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };

  // A small helper so we don't repeat "...formData" everywhere
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

            {/* ---- Section 1: Customer Information ---- */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input
                    id="customer"
                    value={formData.customer}
                    onChange={(e) => updateField({ customer: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField({ email: e.target.value })}
                    required
                  />
                </div>

              </div>
            </div>

            <Separator />

            {/* ---- Section 2: Arrangement Details ---- */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Arrangement Details</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="arrangement">Arrangement Type</Label>
                  <Select
                    value={formData.arrangement}
                    onValueChange={(value: string) => updateField({ arrangement: value, product: value })}
                  >
                    <SelectTrigger id="arrangement">
                      <SelectValue placeholder="Select arrangement" />
                    </SelectTrigger>
                    <SelectContent>
                      {arrangementTypes.map((arr: string) => (
                        <SelectItem key={arr} value={arr}>{arr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Add new arrangement type */}
                  {!showAddTypeInput ? (
                    // Show a small link to reveal the input
                    <button
                      type="button"
                      onClick={() => setShowAddTypeInput(true)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline mt-1"
                    >
                      + Add new arrangement type
                    </button>
                  ) : (
                    // Show the input row when the link is clicked
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
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddNewType}
                        disabled={isSavingType}
                      >
                        {isSavingType ? 'Saving...' : 'Add'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowAddTypeInput(false); setNewTypeName(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select
                    value={formData.occasion}
                    onValueChange={(value: string) => updateField({ occasion: value })}
                  >
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
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => updateField({ quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (£)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => updateField({ amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

              </div>
            </div>

            <Separator />

            {/* ---- Section 3: Delivery Details ---- */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Delivery Details</h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => updateField({ recipientName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <Select
                    value={formData.deliveryType}
                    onValueChange={(value: string) => updateField({ deliveryType: value as Order['deliveryType'] })}
                  >
                    <SelectTrigger id="deliveryType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery</SelectItem>
                      <SelectItem value="express">Express Delivery</SelectItem>
                      <SelectItem value="same-day">Same Day Delivery</SelectItem>
                      {/* Collection means the customer picks up from the shop */}
                      <SelectItem value="collection">Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Only show address field when the order is being delivered, not collected */}
              {formData.deliveryType !== 'collection' && (
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Input
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => updateField({ deliveryAddress: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deliveryDate">
                  {formData.deliveryType === 'collection' ? 'Collection Date' : 'Delivery Date'}
                </Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => updateField({ deliveryDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Card Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => updateField({ message: e.target.value })}
                  placeholder="Optional message for the card"
                  rows={2}
                />
              </div>

            </div>

            <Separator />

            {/* ---- Section 4: Order Management ---- */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Order Management</h3>
              <div className="grid grid-cols-3 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) => updateField({ status: value as Order['status'] })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={formData.priority}
                    onValueChange={(value: string) => updateField({ priority: value as Order['priority'] })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Order Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField({ date: e.target.value })}
                    required
                  />
                </div>

              </div>
            </div>

            <Separator />

            {/* ---- Section 5: Notes ---- */}
            <div className="space-y-4">
              <h3 className="text-slate-900">Notes & Specifics</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField({ notes: e.target.value })}
                  placeholder="e.g. No strong scents, add extra ribbon, fragrance-free only, allergic to lilies..."
                  rows={4}
                />
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {order ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
