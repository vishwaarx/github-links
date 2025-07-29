// --- START frontend/src/components/Dashboard.js --- //
import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery(
    'job-stats',
    async () => {
      const response = await axios.get('/api/jobs/stats/overview');
      return response.data;
    },
    {
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  );

  const { data: recentJobs } = useQuery(
    'recent-jobs',
    async () => {
      const response = await axios.get('/api/jobs?limit=5');
      return response.data;
    },
    {
      refetchInterval: 10000,
    }
  );

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      processing: Loader,
      completed: CheckCircle,
      failed: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateUrl = (url) => {
    return url.replace('https://github.com/', '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">Error loading dashboard: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor repository verification jobs and track their progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.stats?.total_jobs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.stats?.successful_jobs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.stats?.unsuccessful_jobs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.stats?.avg_execution_time 
                  ? `${Math.round(stats.stats.avg_execution_time / 1000)}s`
                  : '-'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/submit"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Submit Repositories</p>
                <p className="text-sm text-gray-500">Add new repositories for verification</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          <Link
            to="/results"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">View Results</p>
                <p className="text-sm text-gray-500">Check job status and results</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/results"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentJobs?.jobs?.length > 0 ? (
            recentJobs.jobs.map((job) => (
              <div key={job.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {truncateUrl(job.repo_url)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.result !== null && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.result 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {job.result ? 'Success' : 'Failed'}
                      </span>
                    )}
                    <Link
                      to={`/job/${job.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Activity className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400">Submit some repositories to see activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
// --- END frontend/src/components/Dashboard.js --- // 