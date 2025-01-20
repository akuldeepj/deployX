"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DeploymentFormProps {
  onDeploy: (id: string) => void
}

export function DeploymentForm({ onDeploy }: DeploymentFormProps) {
  const [repoUrl, setRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:3000/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })
      const data = await response.json()
      onDeploy(data.id)
    } catch (error) {
      console.error("Deployment failed:", error)
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-center mb-6">Futuristic Deployment</h1>
      <Input
        type="url"
        placeholder="Enter repository URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
        className="bg-gray-800 border-gray-700 text-white"
      />
      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {isLoading ? "Deploying..." : "Deploy"}
      </Button>
    </motion.form>
  )
}

