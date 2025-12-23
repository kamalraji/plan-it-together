import React from 'react';

interface OrganizationProfileProps {
  organizationId: string;
}

export const OrganizationProfile: React.FC<OrganizationProfileProps> = ({ organizationId }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Profile</h2>
      <p className="text-gray-600">Organization ID: {organizationId}</p>
      {/* TODO: Implement organization profile functionality */}
    </div>
  );
};

export default OrganizationProfile;