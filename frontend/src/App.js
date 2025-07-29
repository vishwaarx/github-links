// --- START frontend/src/App.js --- //
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import './App.css';
import Header from './components/Header';
import SubmissionForm from './components/SubmissionForm';
import ResultsTable from './components/ResultsTable';
import JobDetails from './components/JobDetails';
import Dashboard from './components/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submit" element={<SubmissionForm />} />
              <Route path="/results" element={<ResultsTable />} />
              <Route path="/job/:id" element={<JobDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
// --- END frontend/src/App.js --- // 