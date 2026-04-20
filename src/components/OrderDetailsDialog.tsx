import { Order } from '../App';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, Mail, Package, PoundSterling, User, MapPin, MessageSquare, Flower2, PartyPopper, Truck } from 'lucide-react';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
  if (!order) return null;

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      arranged: 'bg-purple-100 text-purple-800 border-purple-200',
      'out-for-delivery': 'bg-orange-100 text-orange-800 border-orange-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Order['priority']) => {
    const colors = {
      low: 'bg-slate-100 text-slate-800 border-slate-200',
      medium: 'bg-orange-100 text-orange-800 border-orange-200',
      high: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority];
  };

  const getDeliveryTypeLabel = (type: Order['deliveryType']) => {
    const labels = {
      'standard': 'Standard Delivery',
      'express': 'Express Delivery',
      'same-day': 'Same-Day Delivery',
      'collection': 'Collection'
    };
    return labels[type];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flower Order Details</DialogTitle>
          <DialogDescription>Complete information for {order.orderNumber}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
            <Badge variant="outline" className={getPriorityColor(order.priority)}>
              {order.priority} priority
            </Badge>
          </div>

          <Separator />

          {/* Order Information */}
          <div>
            <h3 className="text-slate-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Order Number</div>
                    <div className="text-slate-900">{order.orderNumber}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Order Date</div>
                    <div className="text-slate-900">{new Date(order.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Customer</div>
                    <div className="text-slate-900">{order.customer}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="text-slate-900">{order.email}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Flower2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Arrangement</div>
                    <div className="text-slate-900">{order.arrangement}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PartyPopper className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Occasion</div>
                    <div className="text-slate-900">{order.occasion}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Quantity</div>
                    <div className="text-slate-900">{order.quantity} {order.quantity === 1 ? 'arrangement' : 'arrangements'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PoundSterling className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Order Amount</div>
                    <div className="text-slate-900">£{order.amount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Information */}
          <div>
            <h3 className="text-slate-900 mb-4">Delivery Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Recipient Name</div>
                    <div className="text-slate-900">{order.recipientName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Delivery Address</div>
                    <div className="text-slate-900">{order.deliveryAddress}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Delivery Type</div>
                    <div className="text-slate-900">{getDeliveryTypeLabel(order.deliveryType)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Delivery Date</div>
                    <div className="text-slate-900">{new Date(order.deliveryDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                  </div>
                </div>
              </div>
            </div>

            {order.message && (
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-500">Card Message</div>
                    <div className="text-slate-900 bg-slate-50 rounded-lg p-3 mt-1 italic">
                      "{order.message}"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-500">Notes & Specifics</div>
                    <div className="text-slate-900 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-1">
                      {order.notes}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Subtotal ({order.quantity} × £{(order.amount / order.quantity).toFixed(2)})</span>
              <span className="text-slate-900">£{order.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Delivery Fee</span>
              <span className="text-slate-900">{order.deliveryType === 'collection' ? '£0.00' : '£15.00'}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Tax (8.5%)</span>
              <span className="text-slate-900">£{(order.amount * 0.085).toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">
                £{(order.amount + (order.deliveryType === 'collection' ? 0 : 15) + (order.amount * 0.085)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
