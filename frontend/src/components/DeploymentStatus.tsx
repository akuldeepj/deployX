"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface Log {
    message: string;
    type: 'info' | 'error';
    timestamp: string;
}

interface DeploymentStatusProps {
    deploymentId: string;
    onReset: () => void;
}

export function DeploymentStatus({ deploymentId, onReset }: DeploymentStatusProps) {
    const [status, setStatus] = useState<string>("uploaded")
    const [progress, setProgress] = useState(0)
    const [logs, setLogs] = useState<Log[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const [statusRes, logsRes] = await Promise.all([
                    fetch(`http://localhost:3000/status?id=${deploymentId}`),
                    fetch(`http://localhost:3000/logs/${deploymentId}`)
                ]);
                
                const statusData = await statusRes.json();
                const logsData = await logsRes.json();
                
                setStatus(statusData.status);
                setLogs(logsData);

                if (statusData.status === "failed") {
                    const errorRes = await fetch(`http://localhost:3000/error/${deploymentId}`);
                    const errorData = await errorRes.json();
                    setError(errorData.error);
                }
            } catch (error) {
                console.error("Failed to fetch status:", error)
            }
        }

        const interval = setInterval(checkStatus, 2000)
        return () => clearInterval(interval)
    }, [deploymentId])

    useEffect(() => {
        const stages = ["uploaded", "built", "deployed"]
        const currentStage = stages.indexOf(status)
        setProgress(((currentStage + 1) / stages.length) * 100)
    }, [status])

    const deploymentLink = `http://${deploymentId}.localhost:3001`

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-2xl font-bold text-center mb-4">Deployment Status</h2>
            <Progress value={progress} className="w-full h-2 bg-gray-700" />
            <p className={`text-center text-lg capitalize ${status === "failed" ? "text-red-500" : ""}`}>{status}</p>
            
            {error && (
                <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                    <h3 className="text-red-500 font-semibold mb-2">Error Details</h3>
                    <pre className="text-red-400 text-sm whitespace-pre-wrap">{error}</pre>
                </div>
            )}

            {/* Add logs section */}
            <div className="mt-4 bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                    <div
                        key={index}
                        className={`mb-2 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}
                    >
                        <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="ml-2">{log.message}</span>
                    </div>
                ))}
            </div>

            {status === "deployed" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <a
                        href={deploymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center py-2 px-4 rounded"
                    >
                        View Deployment
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </motion.div>
            )}
        </motion.div>
    )
}

