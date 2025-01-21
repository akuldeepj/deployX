"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface Deployment {
  repoUrl: string;
  id: string;
  status: string;
  error: string | null;
  logs: Array<{
    message: string;
    type: string;
    timestamp: string;
  }>;
  url: string | null;
}

export function Dashboard({ onNewDeployment }: { onNewDeployment: () => void }) {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDeployments();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDeployments, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeployments = async () => {
    try {
      const response = await fetch('http://localhost:3000/deployments', {
        credentials: 'include'
      });
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/deployments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete failed:', data.error);
        return;
      }

      console.log('Delete success:', data.message);
      // Remove the deployment from local state
      setDeployments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete deployment:', error);
    }
  };

  const handleRedeploy = async (id: string,repourl : string) => {
    try {
      const response = await fetch(`http://localhost:3000/redeploy/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ repoUrl: repourl }) // Replace with actual repo URL
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Redeploy failed:', data.error);
        return;
      }

      console.log('Redeploy success:', data.message);
      // Refresh deployments
      await fetchDeployments();
    } catch (error) {
      console.error('Failed to redeploy:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Deployments</CardTitle>
        <Button 
          onClick={onNewDeployment}
          disabled={deployments.length >= 5}
          className="ml-auto"
        >
          New Deployment
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No deployments yet. Create your first deployment!
          </div>
        ) : (
          deployments.map((deployment) => (
            <Card key={deployment.id} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Deployment ID: {deployment.id}</p>
                    <p className={`text-sm ${
                      deployment.status === 'failed' ? 'text-destructive' : 
                      deployment.status === 'deployed' ? 'text-green-500' : 
                      'text-muted-foreground'
                    }`}>
                      Status: {deployment.status}
                    </p>
                    {deployment.url && (
                      <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View Deployment
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRedeploy(deployment.id,deployment.repoUrl)}
                      disabled={deployments.length >= 5}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(deployment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {deployment.error && (
                  <div className="text-sm p-2 rounded bg-destructive/10 text-destructive">
                    Error: {deployment.error}
                  </div>
                )}

                {deployment.logs && deployment.logs.length > 0 && (
                  <div className="text-sm space-y-1 max-h-32 overflow-y-auto bg-muted p-2 rounded">
                    {deployment.logs.map((log, index) => (
                      <div 
                        key={index}
                        className={`${
                          log.type === 'error' ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="text-xs opacity-50">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {' '}{log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
} 