import React, { useState } from 'react';
import { AdminReportService } from './AdminReportService';

/**
 * UI Component for triggering manual project digests.
 */
const AdminReportSettings = () => {
  const [unit, setUnit] = useState(1);
  const [durationType, setDurationType] = useState('days');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleTriggerReport = async () => {
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await AdminReportService.sendManualDigest(durationType, unit);
      if (response.success) {
        setStatus({ 
          type: 'success', 
          message: response.message
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to send report: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-report-section p-4 border rounded bg-white shadow-sm mt-4">
      <h3 className="text-lg font-bold mb-2">Project Digest Report</h3>
      <p className="text-sm text-gray-600 mb-4">
        Select a lookback period to generate a summary of all project imports and exports.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          min="1"
          className="w-20 p-2 border rounded"
          value={unit}
          onChange={(e) => setUnit(Math.max(1, parseInt(e.target.value) || 1))}
          disabled={isLoading}
        />
        <select
          className="p-2 border rounded bg-gray-50"
          value={durationType}
          onChange={(e) => setDurationType(e.target.value)}
          disabled={isLoading}
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
        </select>
        <button
          onClick={handleTriggerReport}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white font-semibold transition-colors ${
            isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Send Report Email'}
        </button>
      </div>

      {status.message && (
        <div className={`p-2 rounded text-sm ${
          status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default AdminReportSettings;