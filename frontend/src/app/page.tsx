"use client"

import { useState } from "react"
import { DeploymentForm } from "@/components/DeploymentForm"
import { DeploymentStatus } from "@/components/DeploymentStatus"
import { Background } from "@/components/Background"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  const [deploymentId, setDeploymentId] = useState<string | null>(null)

  const handleReset = () => {
    setDeploymentId(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      <Background />
      <div className="z-10 w-full max-w-md">
        {!deploymentId ? (
          <DeploymentForm onDeploy={setDeploymentId} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <DeploymentStatus deploymentId={deploymentId} />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Button onClick={handleReset} className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white">
                Start New Deployment
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

