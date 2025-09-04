import React from 'react';

export interface EnhancedToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  label: string;
}

const EnhancedToggleButton: React.FC<EnhancedToggleButtonProps> = ({ active, onToggle, label }) => {
  return (
    <button
      onClick={onToggle}
      className={`toggle-btn ${active ? 'active' : ''} focus:outline-none transition-colors duration-200`}>
      {label}
    </button>
  );
};

export default EnhancedToggleButton;
