import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import axios from "axios";

export async function buildProject(id: string) {
    return new Promise<string>(async (resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        let errorOutput = "";
        
        try {
            // Update homepage in package.json
            await updateHomepage(projectPath);

            // Run build commands
            const child = exec(`cd ${projectPath} && npm install && npm run build`);

            child.stdout?.on("data", async (data) => {
                console.log("stdout: " + data);
                await sendLog(id, data, "info");
            });

            child.stderr?.on("data", async (data) => {
                console.error("stderr: " + data);
                errorOutput += data;
                await sendLog(id, data, "error");
            });

            child.on("close", async (code) => {
                if (code === 0) {
                    const outputDir = await findBuildOutputDir(projectPath);
                    if (!outputDir) {
                        reject(`No build output directory found for project: ${id}`);
                    } else {
                        console.log(`Build output detected at: ${outputDir}`);
                        resolve(outputDir);
                    }
                } else {
                    reject(`Build failed with error:\n${errorOutput}`);
                }
            });
        } catch (error) {
            reject(`Failed to build project: ${error}`);
        }
    });
}

async function findBuildOutputDir(projectPath: string): Promise<string | null> {
    const possibleDirs = ["dist", ".next", "build"]; // Add other potential directories here
    for (const dir of possibleDirs) {
        const dirPath = path.join(projectPath, dir);
        if (await fs.access(dirPath).then(() => true).catch(() => false)) {
            return dirPath;
        }
    }
    return null;
}


async function updateHomepage(projectPath: string) {
    const packageJsonPath = path.join(projectPath, "package.json");

    try {
        // Read package.json
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

        // Update the homepage field to "."
        packageJson.homepage = ".";

        // Write the updated package.json back
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf-8");

        console.log(`Updated homepage in package.json to "." for project: ${projectPath}`);
    } catch (error) {
        console.error(`Failed to update homepage in package.json: ${error}`);
        throw error;
    }
}

export async function sendLog(id: string, message: string, type: 'info' | 'error' = 'info') {
    try {
        await axios.post('http://localhost:3000/logs', {
            id,
            message,
            type
        });
    } catch (error) {
        console.error('Failed to send log:', error);
    }
}
