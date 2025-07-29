// --- START frontend/src/components/SubmissionForm.js --- //
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from 'react-query';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SubmissionForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const urls = watch('urls', '');

  // CSV dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setError(null);
    }
  });

  // Submit URLs mutation
  const submitUrlsMutation = useMutation(
    async (data) => {
      const urls = data.urls.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const response = await axios.post('/api/submissions', { urls });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setSubmissionResult(data);
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('submissions');
        setTimeout(() => {
          navigate('/results');
        }, 2000);
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to submit repositories');
      }
    }
  );

  // Submit CSV mutation
  const submitCSVMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/submissions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setSubmissionResult(data);
        queryClient.invalidateQueries('jobs');
        queryClient.invalidateQueries('submissions');
        setTimeout(() => {
          navigate('/results');
        }, 2000);
      },
      onError: (error) => {
        setError(error.response?.data?.error || 'Failed to upload CSV file');
      }
    }
  );

  const onSubmitUrls = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSubmissionResult(null);
    
    try {
      await submitUrlsMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCSV = async () => {
    if (!uploadedFile) {
      setError('Please select a CSV file');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSubmissionResult(null);
    
    try {
      await submitCSVMutation.mutateAsync(uploadedFile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateGitHubUrl = (url) => {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/;
    return githubRegex.test(url.trim());
  };

  const urlCount = urls.split('\n').filter(url => url.trim().length > 0).length;
  const validUrls = urls.split('\n').filter(url => validateGitHubUrl(url)).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit GitHub Repositories</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {submissionResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800">
                Successfully submitted {submissionResult.totalRepos} repositories for processing!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Textarea Input */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter GitHub URLs</h2>
            <form onSubmit={handleSubmit(onSubmitUrls)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository URLs (one per line)
                </label>
                <textarea
                  {...register('urls', { 
                    required: 'At least one URL is required',
                    validate: (value) => {
                      const urls = value.split('\n').filter(url => url.trim().length > 0);
                      if (urls.length === 0) return 'At least one URL is required';
                      if (urls.length > 10) return 'Maximum 10 repositories per batch';
                      return true;
                    }
                  })}
                  rows={10}
                  className="form-input"
                  placeholder="https://github.com/username/repo-name&#10;https://github.com/username/another-repo"
                />
                {errors.urls && (
                  <p className="mt-1 text-sm text-red-600">{errors.urls.message}</p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  {urlCount} URLs entered, {validUrls} valid GitHub URLs
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || urlCount === 0}
                className="form-button flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit URLs'}</span>
              </button>
            </form>
          </div>

          {/* CSV Upload */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {uploadedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the CSV file here'
                      : 'Drag & drop a CSV file here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    The CSV should contain GitHub repository URLs in any column
                  </p>
                </div>
              )}
            </div>
            
            {uploadedFile && (
              <button
                onClick={onSubmitCSV}
                disabled={isSubmitting}
                className="mt-4 form-button flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Uploading...' : 'Upload CSV'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter GitHub repository URLs (one per line) or upload a CSV file</li>
            <li>• Maximum 10 repositories per batch</li>
            <li>• URLs must be in format: https://github.com/username/repo-name</li>
            <li>• The system will clone each repo and attempt to run setup commands</li>
            <li>• Results will be available in the Results tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
// --- END frontend/src/components/SubmissionForm.js --- // 