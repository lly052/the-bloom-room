import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderFilingSystem } from '../components/OrderFilingSystem';
import { Order } from '../App';

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'FLR-00001',
    customer: 'Sarah Thompson',
    email: 'sarah@test.com',
    product: 'Rose Bouquet',
    arrangement: 'Rose Bouquet',
    occasion: 'Birthday',
    deliveryType: 'standard',
    deliveryDate: '2026-05-01',
    recipientName: 'James Thompson',
    deliveryAddress: '14 Maple Street',
    message: 'Happy Birthday!',
    quantity: 1,
    amount: 65,
    status: 'pending',
    date: '2026-04-20',
    priority: 'medium',
    notes: '',
  },
  {
    id: '2',
    orderNumber: 'FLR-00002',
    customer: 'Mark Davies',
    email: 'mark@test.com',
    product: 'Mixed Wildflowers',
    arrangement: 'Mixed Wildflowers',
    occasion: 'Anniversary',
    deliveryType: 'express',
    deliveryDate: '2026-05-02',
    recipientName: 'Lucy Davies',
    deliveryAddress: '7 Oak Avenue',
    message: '',
    quantity: 2,
    amount: 90,
    status: 'processing',
    date: '2026-04-19',
    priority: 'high',
    notes: '',
  },
];

describe('OrderFilingSystem', () => {
  const onUpdateOrder = vi.fn();
  const onDeleteOrder = vi.fn();
  const onAddOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all orders in the table', () => {
    render(
      <OrderFilingSystem orders={mockOrders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} onAddOrder={onAddOrder} />
    );

    expect(screen.getByText('Sarah Thompson')).toBeInTheDocument();
    expect(screen.getByText('Mark Davies')).toBeInTheDocument();
    expect(screen.getByText('FLR-00001')).toBeInTheDocument();
    expect(screen.getByText('FLR-00002')).toBeInTheDocument();
  });

  it('filters orders when searching by customer name', () => {
    render(
      <OrderFilingSystem orders={mockOrders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} onAddOrder={onAddOrder} />
    );

    fireEvent.change(screen.getByPlaceholderText(/search orders/i), { target: { value: 'Sarah' } });

    expect(screen.getByText('Sarah Thompson')).toBeInTheDocument();
    expect(screen.queryByText('Mark Davies')).not.toBeInTheDocument();
  });

  it('shows the correct order count', () => {
    render(
      <OrderFilingSystem orders={mockOrders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} onAddOrder={onAddOrder} />
    );

    expect(screen.getByText('Showing 2 of 2 orders')).toBeInTheDocument();
  });

  it('shows empty message when no orders match the search', () => {
    render(
      <OrderFilingSystem orders={mockOrders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} onAddOrder={onAddOrder} />
    );

    fireEvent.change(screen.getByPlaceholderText(/search orders/i), { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('opens the delete confirmation dialog when a trash button is clicked', async () => {
    render(
      <OrderFilingSystem orders={mockOrders} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} onAddOrder={onAddOrder} />
    );

    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.innerHTML.includes('trash'));
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete Order')).toBeInTheDocument();
    });
  });
});
