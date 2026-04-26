import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilesTab } from '../components/FilesTab';

const mockList = vi.fn();
const mockSelectFilePasswords = vi.fn();

vi.mock('../utils/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        list: (...args: unknown[]) => mockList(...args),
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.com/file' }, error: null }),
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: (...args: unknown[]) => mockSelectFilePasswords(...args),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  },
}));

describe('FilesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ data: [], error: null });
    mockSelectFilePasswords.mockResolvedValue({ data: [], error: null });
  });

  it('shows the empty state when there are no files', async () => {
    render(<FilesTab />);

    await waitFor(() => {
      expect(screen.getByText(/no files uploaded yet/i)).toBeInTheDocument();
    });
  });

  it('renders the upload file button', async () => {
    render(<FilesTab />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });
  });

  it('shows files loaded from storage', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          name: '1234567890-staff-rota.pdf',
          metadata: { size: 12400, mimetype: 'application/pdf' },
          created_at: '2026-04-20T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<FilesTab />);

    await waitFor(() => {
      expect(screen.getByText('staff-rota.pdf')).toBeInTheDocument();
    });
  });

  it('shows the rename panel after picking a file', async () => {
    render(<FilesTab />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(screen.getByText(/name your file/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('invoice')).toBeInTheDocument();
    });
  });

  it('shows the delete confirmation dialog when trash is clicked', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          name: '1234567890-test-doc.pdf',
          metadata: { size: 5000, mimetype: 'application/pdf' },
          created_at: '2026-04-20T10:00:00Z',
        },
      ],
      error: null,
    });

    render(<FilesTab />);

    await waitFor(() => {
      expect(screen.getByText('test-doc.pdf')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[allButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Delete File')).toBeInTheDocument();
    });
  });
});
