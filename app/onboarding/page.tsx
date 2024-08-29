import React from 'react';
import Onboarding from '@/components/Onboarding';
import { signup } from '../login/actions'; // Adjust the path based on your folder structure

const OnboardingPage: React.FC = () => {
  return (
    <Onboarding signup={signup} />
  );
};

export default OnboardingPage;
