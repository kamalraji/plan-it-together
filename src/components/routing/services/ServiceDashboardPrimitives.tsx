import React from 'react';
import { Link } from 'react-router-dom';

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Optional extra classes for the value text (e.g. accent colors) */
  valueClassName?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, valueClassName }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-center">
        {icon && <div className="flex-shrink-0 mr-3 sm:mr-4">{icon}</div>}
        <div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className={`text-xl sm:text-2xl font-bold text-foreground ${valueClassName ?? ''}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  to: string;
  primary?: boolean;
  icon?: React.ReactNode;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  to,
  primary,
  icon,
}) => {
  return (
    <Link
      to={to}
      className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
        primary
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
          : 'border-border bg-card hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
        {icon && <span className="text-xl sm:text-2xl">{icon}</span>}
        <h4
          className={`text-sm sm:text-base font-medium ${
            primary ? 'text-primary' : 'text-foreground'
          }`}
        >
          {title}
        </h4>
      </div>
      <p
        className={`text-xs sm:text-sm ${
          primary ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {description}
      </p>
    </Link>
  );
};
