import { useState } from 'react';
import { SegmentCriteria, UserRole, RegistrationStatus, RecipientPreview } from '../../types';

interface RecipientSegmentationProps {
  segmentCriteria: SegmentCriteria;
  onCriteriaChange: (criteria: SegmentCriteria) => void;
  recipientPreview: RecipientPreview | null;
  isLoading: boolean;
}

export function RecipientSegmentation({
  segmentCriteria,
  onCriteriaChange,
  recipientPreview,
  isLoading
}: RecipientSegmentationProps) {
  const [showRecipientList, setShowRecipientList] = useState(false);

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = segmentCriteria.roles || [];
    const newRoles = checked
      ? [...currentRoles, role]
      : currentRoles.filter(r => r !== role);
    
    onCriteriaChange({
      ...segmentCriteria,
      roles: newRoles.length > 0 ? newRoles : undefined
    });
  };

  const handleRegistrationStatusChange = (status: RegistrationStatus, checked: boolean) => {
    const currentStatuses = segmentCriteria.registrationStatus || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onCriteriaChange({
      ...segmentCriteria,
      registrationStatus: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  const handleAttendanceStatusChange = (status: 'ATTENDED' | 'NOT_ATTENDED' | undefined) => {
    onCriteriaChange({
      ...segmentCriteria,
      attendanceStatus: status
    });
  };

  const clearAllFilters = () => {
    onCriteriaChange({});
  };

  const roleOptions = [
    { value: UserRole.PARTICIPANT, label: 'Participants', description: 'Event attendees' },
    { value: UserRole.JUDGE, label: 'Judges', description: 'Competition judges' },
    { value: UserRole.VOLUNTEER, label: 'Volunteers', description: 'Event volunteers' },
    { value: UserRole.SPEAKER, label: 'Speakers', description: 'Event speakers' },
    { value: UserRole.ORGANIZER, label: 'Organizers', description: 'Event organizers' },
  ];

  const registrationStatusOptions = [
    { value: RegistrationStatus.CONFIRMED, label: 'Confirmed', description: 'Confirmed registrations' },
    { value: RegistrationStatus.WAITLISTED, label: 'Waitlisted', description: 'On waiting list' },
    { value: RegistrationStatus.PENDING, label: 'Pending', description: 'Pending approval' },
    { value: RegistrationStatus.CANCELLED, label: 'Cancelled', description: 'Cancelled registrations' },
  ];

  const attendanceOptions = [
    { value: undefined, label: 'All', description: 'All participants regardless of attendance' },
    { value: 'ATTENDED' as const, label: 'Attended', description: 'Participants who checked in' },
    { value: 'NOT_ATTENDED' as const, label: 'Not Attended', description: 'Participants who did not check in' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recipient Segmentation</h3>
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All Filters
        </button>
      </div>

      <div className="space-y-6">
        {/* Role Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Filter by Role</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roleOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={segmentCriteria.roles?.includes(option.value) || false}
                  onChange={(e) => handleRoleChange(option.value, e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Registration Status Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Filter by Registration Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {registrationStatusOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={segmentCriteria.registrationStatus?.includes(option.value) || false}
                  onChange={(e) => handleRegistrationStatusChange(option.value, e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Attendance Status Filter (Requirements 8.2, 8.5) */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Filter by Attendance Status</h4>
          <div className="space-y-2">
            {attendanceOptions.map((option) => (
              <label key={option.value || 'all'} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="attendanceStatus"
                  checked={segmentCriteria.attendanceStatus === option.value}
                  onChange={() => handleAttendanceStatusChange(option.value)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Recipient Preview */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Recipient Preview</h4>
            {recipientPreview && recipientPreview.count > 0 && (
              <button
                type="button"
                onClick={() => setShowRecipientList(!showRecipientList)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showRecipientList ? 'Hide List' : 'Show List'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Loading recipients...</span>
            </div>
          ) : recipientPreview ? (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold text-indigo-600">{recipientPreview.count}</span>
                  <span className="text-sm text-gray-600">
                    recipient{recipientPreview.count !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>

              {showRecipientList && recipientPreview.recipients.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-1">
                    {recipientPreview.recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">{recipient.name}</span>
                        <span className="text-gray-600">{recipient.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Select filters above to preview recipients
            </div>
          )}
        </div>
      </div>
    </div>
  );
}