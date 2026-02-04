import React, { useState, useEffect } from 'react';
import { RubricCriterion, CreateRubricDTO, Rubric } from '../../types';
import { supabase } from '@/integrations/supabase/client';

interface RubricManagementProps {
  eventId: string;
  onRubricCreated?: (rubric: Rubric) => void;
}

const RubricManagement: React.FC<RubricManagementProps> = ({ eventId, onRubricCreated }) => {
  const [criteria, setCriteria] = useState<Omit<RubricCriterion, 'id'>[]>([
    { name: '', description: '', weight: 0, maxScore: 100 },
  ]);
  const [existingRubric, setExistingRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingRubric();
  }, [eventId]);

  const fetchExistingRubric = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('judging-rubric', {
        body: { action: 'get', eventId },
      });

      if (error) throw error;

      if (data?.rubric) {
        const rubric = data.rubric as Rubric;
        setExistingRubric(rubric);
        if (rubric.criteria) {
          setCriteria(rubric.criteria as any);
        }
      }
    } catch (err) {
      console.error('Error fetching rubric:', err);
    }
  };

  const addCriterion = () => {
    setCriteria([...criteria, { name: '', description: '', weight: 0, maxScore: 100 }]);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const updateCriterion = (index: number, field: keyof RubricCriterion, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const getTotalWeight = () => {
    return criteria.reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
  };

  const validateRubric = (): string | null => {
    const totalWeight = getTotalWeight();
    
    if (totalWeight !== 100) {
      return `Total weight must equal 100%. Current total: ${totalWeight}%`;
    }

    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      if (!criterion.name.trim()) {
        return `Criterion ${i + 1} must have a name`;
      }
      if (!criterion.description.trim()) {
        return `Criterion ${i + 1} must have a description`;
      }
      if (criterion.weight <= 0) {
        return `Criterion ${i + 1} must have a weight greater than 0`;
      }
      if (criterion.maxScore <= 0) {
        return `Criterion ${i + 1} must have a maximum score greater than 0`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateRubric();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const rubricData: CreateRubricDTO = {
        eventId,
        criteria: criteria.map((c) => ({
          name: c.name.trim(),
          description: c.description.trim(),
          weight: c.weight,
          maxScore: c.maxScore,
        })),
      };

      const action = existingRubric ? 'update' : 'create';

      const { data, error } = await supabase.functions.invoke('judging-rubric', {
        body: {
          action,
          eventId,
          rubricId: existingRubric?.id,
          criteria: rubricData.criteria,
        },
      });

      if (error) throw error;

      const rubric = data.rubric as Rubric;
      setExistingRubric(rubric);
      setSuccess(existingRubric ? 'Rubric updated successfully!' : 'Rubric created successfully!');

      if (onRubricCreated) {
        onRubricCreated(rubric);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save rubric');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {existingRubric ? 'Edit Judging Rubric' : 'Create Judging Rubric'}
        </h2>
        <p className="text-gray-600">
          Define the criteria and weights for judging submissions. Total weight must equal 100%.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {criteria.map((criterion, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Criterion {index + 1}
                </h3>
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criterion Name *
                  </label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Innovation"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={criterion.weight || ''}
                      onChange={(e) => updateCriterion(index, 'weight', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Score *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={criterion.maxScore || ''}
                      onChange={(e) => updateCriterion(index, 'maxScore', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={criterion.description}
                  onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what judges should evaluate for this criterion..."
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={addCriterion}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Criterion
          </button>

          <div className="text-right">
            <div className={`text-sm mb-2 ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total Weight: {getTotalWeight()}% {getTotalWeight() === 100 ? '✓' : '(must equal 100%)'}
            </div>
            <button
              type="submit"
              disabled={loading || getTotalWeight() !== 100}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : existingRubric ? 'Update Rubric' : 'Create Rubric'}
            </button>
          </div>
        </div>
      </form>

      {existingRubric && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(existingRubric.updatedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricManagement;