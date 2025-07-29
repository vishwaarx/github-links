// --- START frontend/src/components/JobDetails.js --- //
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader,
  ExternalLink,
  FileText,
  Code
} from 'lucide-react';
import axios from 'axios';

const JobDetails = () => {
  const { id } = useParams();

  const { data: job, isLoading, error } = useQuery(
    ['job', id],
    async () => {
      const response = await axios.get(`/api/jobs/${id}`);
      return response.data;
    },
    {
      refetchInterval: 3000, // Refresh every 3 seconds for active jobs
    }
  );

  const { data: logs } = useQuery(
    ['job-logs', id],
    async () => {
      const response = await axios.get(`/api/jobs/${id}/logs`);
      return response.data;
    },
    {
      enabled: !!job && (job.status === 'completed' || job.status === 'failed'),
    }
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-2" />
        {status}
      </span>
    );
  };

  const getResultBadge = (result) => {
    if (result === null) return null;
    
    return result ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-4 w-4 mr-2" />
        Success
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <XCircle className="h-4 w-4 mr-2" />
        Failed
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return '-';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading job details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Error loading job details: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Job not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested job could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/results"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Results
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
              <p className="text-sm text-gray-600">ID: {job.id}</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(job.status)}
              {getResultBadge(job.result)}
            </div>
          </div>
        </div>

        {/* Repository Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Repository</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{job.repo_url}</p>
              <p className="text-sm text-gray-600">
                Created: {formatDate(job.created_at)}
              </p>
              {job.updated_at && (
                <p className="text-sm text-gray-600">
                  Updated: {formatDate(job.updated_at)}
                </p>
              )}
            </div>
            <a
              href={job.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Execution Details */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Execution Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Execution Time</p>
              <p className="text-sm text-gray-900">{formatDuration(job.execution_time)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Setup Instructions</p>
              <p className="text-sm text-gray-900">
                {job.setup_instructions || 'No setup instructions found'}
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        {job.reason && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Reason</h2>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              {job.reason}
            </p>
          </div>
        )}

        {/* Logs */}
        {logs && (
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Logs</h2>
            
            {logs.setupInstructions && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Setup Instructions
                </h3>
                <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md overflow-x-auto">
                  {logs.setupInstructions}
                </pre>
              </div>
            )}

            {logs.logs && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Execution Logs
                </h3>
                <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                  {logs.logs}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* No logs message */}
        {job.status === 'completed' && !logs && (
          <div className="px-6 py-4">
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No logs available for this job</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
// --- END frontend/src/components/JobDetails.js --- // 