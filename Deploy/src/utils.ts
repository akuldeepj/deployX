import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

export function buildProject(id: string) {
    return new Promise(async (resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        try {
            // Update homepage in package.json
            await updateHomepage(projectPath);

            // Run build commands
            const child = exec(
                `cd ${projectPath} && npm install && npm run build`
            );

            child.stdout?.on("data", (data) => {
                console.log("stdout: " + data);
            });

            child.stderr?.on("data", (data) => {
                console.error("stderr: " + data);
            });

            child.on("close", (code) => {
                resolve("");
            });
        } catch (error) {
            reject(`Failed to build project ${id}: ${error}`);
        }
    });
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
