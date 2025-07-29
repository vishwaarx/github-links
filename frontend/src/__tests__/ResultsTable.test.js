// --- START frontend/src/__tests__/ResultsTable.test.js --- //
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import ResultsTable from '../components/ResultsTable';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ResultsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table correctly', async () => {
    const mockJobs = {
      jobs: [
        {
          id: 1,
          repo_url: 'https://github.com/username/repo1',
          status: 'completed',
          result: true,
          reason: 'Setup completed successfully',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          repo_url: 'https://github.com/username/repo2',
          status: 'failed',
          result: false,
          reason: 'Setup failed',
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText('Repository Results')).toBeInTheDocument();
      expect(screen.getByText('username/repo1')).toBeInTheDocument();
      expect(screen.getByText('username/repo2')).toBeInTheDocument();
    });
  });

  it('displays correct status badges', async () => {
    const mockJobs = {
      jobs: [
        {
          id: 1,
          repo_url: 'https://github.com/username/repo1',
          status: 'pending',
          result: null,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          repo_url: 'https://github.com/username/repo2',
          status: 'processing',
          result: null,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 3,
          repo_url: 'https://github.com/username/repo3',
          status: 'completed',
          result: true,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 4,
          repo_url: 'https://github.com/username/repo4',
          status: 'failed',
          result: false,
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 4,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('processing')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  it('displays correct result badges', async () => {
    const mockJobs = {
      jobs: [
        {
          id: 1,
          repo_url: 'https://github.com/username/repo1',
          status: 'completed',
          result: true,
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          repo_url: 'https://github.com/username/repo2',
          status: 'completed',
          result: false,
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('filters jobs by status', async () => {
    const mockJobs = {
      jobs: [
        {
          id: 1,
          repo_url: 'https://github.com/username/repo1',
          status: 'completed',
          result: true,
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText('Repository Results')).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('status=completed')
      );
    });
  });

  it('handles loading state', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<ResultsTable />);

    expect(screen.getByText('Loading results...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const mockError = new Error('Failed to fetch jobs');
    mockedAxios.get.mockRejectedValueOnce(mockError);

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading results/)).toBeInTheDocument();
    });
  });

  it('displays empty state when no jobs', async () => {
    const mockJobs = {
      jobs: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('No jobs have been processed yet.')).toBeInTheDocument();
    });
  });

  it('provides view links for jobs', async () => {
    const mockJobs = {
      jobs: [
        {
          id: 1,
          repo_url: 'https://github.com/username/repo1',
          status: 'completed',
          result: true,
          created_at: '2023-01-01T00:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockJobs });

    renderWithProviders(<ResultsTable />);

    await waitFor(() => {
      const viewLinks = screen.getAllByText('View');
      expect(viewLinks).toHaveLength(1);
      expect(viewLinks[0]).toHaveAttribute('href', '/job/1');
    });
  });
});
// --- END frontend/src/__tests__/ResultsTable.test.js --- // 