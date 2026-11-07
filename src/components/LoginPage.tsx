import React from 'react';
import { AuthView } from './AuthView';
import { useHarvestStore } from '../store/useHarvestStore';

export const LoginPage: React.FC = () => {
  const { setActiveTab, pendingCheckoutTarget } = useHarvestStore();

  return (
    <AuthView
      onSuccess={() => {
        setActiveTab(pendingCheckoutTarget ? 'MARKETPLACE' : 'MARKETPLACE');
      }}
    />
  );
};
