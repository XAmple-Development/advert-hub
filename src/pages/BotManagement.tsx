
import React from 'react';
import BotManagement from '@/components/BotManagement';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';

const BotManagementPage = () => {
  return (
    <ModernLayout>
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-2">
            Discord Bot Management
          </h1>
          <p className="text-muted-foreground text-lg">Configure and monitor your Discord bot integrations</p>
        </div>
        <BotManagement />
      </div>
    </ModernLayout>
  );
};

export default BotManagementPage;
