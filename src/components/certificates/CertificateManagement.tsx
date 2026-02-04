import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CertificateQr } from '@/components/certificates/CertificateQr';

// Types for certificate management
export interface CertificateType {
  MERIT: 'MERIT';
  COMPLETION: 'COMPLETION';
  APPRECIATION: 'APPRECIATION';
}

export interface CertificateCriteria {
  type: keyof CertificateType;
  conditions: {
    minScore?: number;
    maxRank?: number;
    requiresAttendance?: boolean;
    requiresRole?: string[];
  };
}

export interface Certificate {
  id: string;
  certificateId: string;
  recipientId: string;
  eventId: string;
  type: keyof CertificateType;
  pdfUrl: string;
  qrCodeUrl: string;
  issuedAt: string;
  distributedAt?: string;
  recipient: {
    name: string;
    email: string;
  };
}

export interface DistributionResult {
  successful: number;
  failed: number;
  failures: Array<{
    certificateId: string;
    recipientEmail: string;
    error: string;
  }>;
}

interface CertificateManagementProps {
  eventId: string;
}

export function CertificateManagement({ eventId }: CertificateManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'criteria' | 'certificates' | 'distribution'>('criteria');
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [criteriaForm, setCriteriaForm] = useState<CertificateCriteria[]>([]);

  // Fetch certificate criteria
  const { data: criteria, isLoading: criteriaLoading } = useQuery({
    queryKey: ['certificate-criteria', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getCriteria', eventId },
      });
      if (error) throw error;
      return (data?.data || []) as CertificateCriteria[];
    },
  });

  // Fetch generated certificates
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['event-certificates', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'listEventCertificates', eventId },
      });
      if (error) throw error;
      return (data?.data || []) as Certificate[];
    },
  });

  // Store certificate criteria mutation
  const storeCriteriaMutation = useMutation({
    mutationFn: async (criteria: CertificateCriteria[]) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'saveCriteria', eventId, criteria },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-criteria', eventId] });
    },
  });

  // Batch generate certificates mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'batchGenerate', eventId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-certificates', eventId] });
    },
  });

  // Distribute certificates mutation
  const distributeMutation = useMutation({
    mutationFn: async (certificateIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'distribute', certificateIds },
      });
      if (error) throw error;
      return data as DistributionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-certificates', eventId] });
      setSelectedCertificates([]);
    },
  });

  // Initialize criteria form when data loads
  useEffect(() => {
    if (criteria && criteria.length > 0) {
      setCriteriaForm(criteria);
    } else {
      // Initialize with default criteria
      setCriteriaForm([
        {
          type: 'COMPLETION',
          conditions: {
            requiresAttendance: true,
          },
        },
      ]);
    }
  }, [criteria]);

  const addCriterion = () => {
    setCriteriaForm([
      ...criteriaForm,
      {
        type: 'MERIT',
        conditions: {},
      },
    ]);
  };

  const updateCriterion = (index: number, updates: Partial<CertificateCriteria>) => {
    const updated = [...criteriaForm];
    updated[index] = { ...updated[index], ...updates };
    setCriteriaForm(updated);
  };

  const removeCriterion = (index: number) => {
    setCriteriaForm(criteriaForm.filter((_, i) => i !== index));
  };

  const handleSaveCriteria = () => {
    storeCriteriaMutation.mutate(criteriaForm);
  };

  const handleBatchGenerate = () => {
    batchGenerateMutation.mutate();
  };

  const handleDistribute = () => {
    if (selectedCertificates.length > 0) {
      distributeMutation.mutate(selectedCertificates);
    }
  };

  const toggleCertificateSelection = (certificateId: string) => {
    setSelectedCertificates(prev =>
      prev.includes(certificateId)
        ? prev.filter(id => id !== certificateId)
        : [...prev, certificateId]
    );
  };

  const selectAllCertificates = () => {
    if (certificates) {
      setSelectedCertificates(certificates.map(cert => cert.id));
    }
  };

  const clearSelection = () => {
    setSelectedCertificates([]);
  };

  if (!user || user.role !== 'ORGANIZER') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Only organizers can manage certificates.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Management</h1>
        <p className="text-gray-600">Configure criteria, generate, and distribute certificates for your event.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'criteria', label: 'Certificate Criteria' },
            { key: 'certificates', label: 'Generated Certificates' },
            { key: 'distribution', label: 'Distribution Status' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Certificate Criteria Tab */}
      {activeTab === 'criteria' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Certificate Criteria Configuration</h2>
              <button
                onClick={addCriterion}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Criterion
              </button>
            </div>

            {criteriaLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading criteria...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {criteriaForm.map((criterion, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Criterion {index + 1}</h3>
                      <button
                        onClick={() => removeCriterion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Certificate Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Certificate Type
                        </label>
                        <select
                          value={criterion.type}
                          onChange={(e) => updateCriterion(index, { type: e.target.value as keyof CertificateType })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="COMPLETION">Completion</option>
                          <option value="MERIT">Merit</option>
                          <option value="APPRECIATION">Appreciation</option>
                        </select>
                      </div>

                      {/* Minimum Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Score (optional)
                        </label>
                        <input
                          type="number"
                          value={criterion.conditions.minScore || ''}
                          onChange={(e) => updateCriterion(index, {
                            conditions: {
                              ...criterion.conditions,
                              minScore: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 80"
                        />
                      </div>

                      {/* Maximum Rank */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Rank (optional)
                        </label>
                        <input
                          type="number"
                          value={criterion.conditions.maxRank || ''}
                          onChange={(e) => updateCriterion(index, {
                            conditions: {
                              ...criterion.conditions,
                              maxRank: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 3"
                        />
                      </div>

                      {/* Requires Attendance */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`attendance-${index}`}
                          checked={criterion.conditions.requiresAttendance || false}
                          onChange={(e) => updateCriterion(index, {
                            conditions: {
                              ...criterion.conditions,
                              requiresAttendance: e.target.checked
                            }
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`attendance-${index}`} className="ml-2 block text-sm text-gray-900">
                          Requires Attendance
                        </label>
                      </div>
                    </div>

                    {/* Required Roles */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Roles (optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['PARTICIPANT', 'JUDGE', 'VOLUNTEER', 'SPEAKER'].map((role) => (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={criterion.conditions.requiresRole?.includes(role) || false}
                              onChange={(e) => {
                                const currentRoles = criterion.conditions.requiresRole || [];
                                const updatedRoles = e.target.checked
                                  ? [...currentRoles, role]
                                  : currentRoles.filter(r => r !== role);
                                updateCriterion(index, {
                                  conditions: {
                                    ...criterion.conditions,
                                    requiresRole: updatedRoles.length > 0 ? updatedRoles : undefined
                                  }
                                });
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={handleSaveCriteria}
                    disabled={storeCriteriaMutation.isPending}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {storeCriteriaMutation.isPending ? 'Saving...' : 'Save Criteria'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generated Certificates</h2>
              <button
                onClick={handleBatchGenerate}
                disabled={batchGenerateMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {batchGenerateMutation.isPending ? 'Generating...' : 'Batch Generate'}
              </button>
            </div>

            {certificatesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading certificates...</p>
              </div>
            ) : certificates && certificates.length > 0 ? (
              <div>
                {/* Selection Controls */}
                <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {selectedCertificates.length} of {certificates.length} selected
                    </span>
                    <button
                      onClick={selectAllCertificates}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <button
                    onClick={handleDistribute}
                    disabled={selectedCertificates.length === 0 || distributeMutation.isPending}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {distributeMutation.isPending ? 'Distributing...' : 'Distribute Selected'}
                  </button>
                </div>

                {/* Certificates List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issued Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certificates.map((certificate) => (
                        <tr key={certificate.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedCertificates.includes(certificate.id)}
                              onChange={() => toggleCertificateSelection(certificate.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {certificate.recipient.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {certificate.recipient.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              certificate.type === 'MERIT' ? 'bg-yellow-100 text-yellow-800' :
                              certificate.type === 'COMPLETION' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {certificate.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {certificate.certificateId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CertificateQr certificateId={certificate.certificateId} size={72} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(certificate.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              certificate.distributedAt ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {certificate.distributedAt ? 'Distributed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <a
                              href={certificate.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Download
                            </a>
                            <a
                              href={`/verify-certificate/${certificate.certificateId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates generated yet</h3>
                <p className="text-gray-600 mb-4">
                  Configure certificate criteria first, then generate certificates for your event participants.
                </p>
                <button
                  onClick={() => setActiveTab('criteria')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Configure Criteria
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distribution Status Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribution Status</h2>

            {certificates && certificates.length > 0 ? (
              <div>
                {/* Distribution Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Certificates</h3>
                    <p className="text-3xl font-bold text-blue-600">{certificates.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Distributed</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {certificates.filter(cert => cert.distributedAt).length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending</h3>
                    <p className="text-3xl font-bold text-gray-600">
                      {certificates.filter(cert => !cert.distributedAt).length}
                    </p>
                  </div>
                </div>

                {/* Distribution Details */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distribution Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distributed Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {certificates.map((certificate) => (
                        <tr key={certificate.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {certificate.recipient.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {certificate.recipient.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              certificate.type === 'MERIT' ? 'bg-yellow-100 text-yellow-800' :
                              certificate.type === 'COMPLETION' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {certificate.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(certificate.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              certificate.distributedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {certificate.distributedAt ? 'Distributed' : 'Pending Distribution'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {certificate.distributedAt 
                              ? new Date(certificate.distributedAt).toLocaleDateString()
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates to distribute</h3>
                <p className="text-gray-600">Generate certificates first to see distribution status.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {storeCriteriaMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Certificate criteria saved successfully!
        </div>
      )}

      {batchGenerateMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Certificates generated successfully!
        </div>
      )}

      {distributeMutation.isSuccess && distributeMutation.data && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Distribution completed: {distributeMutation.data.successful} successful, {distributeMutation.data.failed} failed
        </div>
      )}

      {(storeCriteriaMutation.isError || batchGenerateMutation.isError || distributeMutation.isError) && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          An error occurred. Please try again.
        </div>
      )}
    </div>
  );
}