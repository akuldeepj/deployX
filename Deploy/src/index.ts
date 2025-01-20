import { createClient, commandOptions } from "redis";
import { copyFinalbuild, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import { sendLog } from "./utils";

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main() {
    while (1) {
        const res = await subscriber.brPop(
            commandOptions({ isolated: true }),
            "build-queue",
            0
        );

        // @ts-ignore
        const id = res.element;

        try {
            await sendLog(id, "Starting deployment process");
            
            await sendLog(id, "Downloading files from S3");
            await downloadS3Folder(`output/${id}`);
            
            await sendLog(id, "Building project");
            const buildDir = await buildProject(id);
            
            await sendLog(id, "Copying build files");
            copyFinalbuild(id, buildDir);
            
            await sendLog(id, "Deployment completed successfully");
            await publisher.hSet("status", id, "deployed");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await sendLog(id, `Deployment failed: ${errorMessage}`, 'error');
            await publisher.hSet("status", id, "failed");
            await publisher.hSet("error", id, errorMessage);
        }
    }
}

main();
