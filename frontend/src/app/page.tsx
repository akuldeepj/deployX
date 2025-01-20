"use client"

import { useState } from "react"
import { DeploymentForm } from "@/components/DeploymentForm"
import { DeploymentStatus } from "@/components/DeploymentStatus"
import { Dashboard } from "@/components/Dashboard"
import { useAuth } from "@/context/AuthContext"
import { LoginForm } from "@/components/LoginForm"
import { Providers } from "@/components/Providers"

function HomePage() {
  const { user, isLoading } = useAuth();
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'new-deployment' | 'status'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {currentPage === 'dashboard' && (
          <Dashboard 
            onNewDeployment={() => setCurrentPage('new-deployment')} 
          />
        )}
        
        {currentPage === 'new-deployment' && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <DeploymentForm 
              onDeploy={(id) => {
                setDeploymentId(id);
                setCurrentPage('status');
              }}
              onCancel={() => setCurrentPage('dashboard')}
            />
          </div>
        )}
        
        {currentPage === 'status' && deploymentId && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <DeploymentStatus 
              deploymentId={deploymentId} 
              onReset={() => {
                setDeploymentId(null);
                setCurrentPage('dashboard');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Providers>
      <HomePage />
    </Providers>
  );
}

