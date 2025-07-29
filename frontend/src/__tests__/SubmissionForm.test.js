// --- START frontend/src/__tests__/SubmissionForm.test.js --- //
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import SubmissionForm from '../components/SubmissionForm';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

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

describe('SubmissionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    renderWithProviders(<SubmissionForm />);
    
    expect(screen.getByText('Submit GitHub Repositories')).toBeInTheDocument();
    expect(screen.getByText('Enter GitHub URLs')).toBeInTheDocument();
    expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/github\.com\/username\/repo-name/)).toBeInTheDocument();
  });

  it('validates GitHub URLs correctly', async () => {
    renderWithProviders(<SubmissionForm />);
    
    const textarea = screen.getByPlaceholderText(/https:\/\/github\.com\/username\/repo-name/);
    
    // Test valid URLs
    fireEvent.change(textarea, {
      target: { value: 'https://github.com/username/repo1\nhttps://github.com/username/repo2' }
    });
    
    expect(screen.getByText('2 URLs entered, 2 valid GitHub URLs')).toBeInTheDocument();
    
    // Test invalid URLs
    fireEvent.change(textarea, {
      target: { value: 'https://github.com/username/repo1\nhttps://invalid-url.com/repo\nnot-a-url' }
    });
    
    expect(screen.getByText('3 URLs entered, 1 valid GitHub URLs')).toBeInTheDocument();
  });

  it('submits URLs successfully', async () => {
    const mockResponse = {
      data: {
        submissionId: 1,
        batchId: 'batch-123',
        totalRepos: 2,
        jobs: [
          { id: 1, repoUrl: 'https://github.com/username/repo1', status: 'pending' },
          { id: 2, repoUrl: 'https://github.com/username/repo2', status: 'pending' }
        ],
        message: 'Processing 2 repositories'
      }
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);
    
    renderWithProviders(<SubmissionForm />);
    
    const textarea = screen.getByPlaceholderText(/https:\/\/github\.com\/username\/repo-name/);
    const submitButton = screen.getByText('Submit URLs');
    
    fireEvent.change(textarea, {
      target: { value: 'https://github.com/username/repo1\nhttps://github.com/username/repo2' }
    });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully submitted 2 repositories for processing!/)).toBeInTheDocument();
    });
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/submissions', {
      urls: ['https://github.com/username/repo1', 'https://github.com/username/repo2']
    });
  });

  it('handles submission errors', async () => {
    const mockError = {
      response: {
        data: {
          error: 'No valid GitHub URLs provided'
        }
      }
    };
    
    mockedAxios.post.mockRejectedValueOnce(mockError);
    
    renderWithProviders(<SubmissionForm />);
    
    const textarea = screen.getByPlaceholderText(/https:\/\/github\.com\/username\/repo-name/);
    const submitButton = screen.getByText('Submit URLs');
    
    fireEvent.change(textarea, {
      target: { value: 'https://invalid-url.com/repo' }
    });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('No valid GitHub URLs provided')).toBeInTheDocument();
    });
  });

  it('prevents submission with empty URLs', () => {
    renderWithProviders(<SubmissionForm />);
    
    const submitButton = screen.getByText('Submit URLs');
    
    expect(submitButton).toBeDisabled();
  });

  it('prevents submission with more than 10 URLs', () => {
    renderWithProviders(<SubmissionForm />);
    
    const textarea = screen.getByPlaceholderText(/https:\/\/github\.com\/username\/repo-name/);
    const submitButton = screen.getByText('Submit URLs');
    
    const manyUrls = Array.from({ length: 11 }, (_, i) => `https://github.com/username/repo${i}`).join('\n');
    fireEvent.change(textarea, { target: { value: manyUrls } });
    
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Maximum 10 repositories per batch/)).toBeInTheDocument();
  });
});
// --- END frontend/src/__tests__/SubmissionForm.test.js --- // 