import { exec } from "child_process";

export default function execPromise(command: string, options: any): Promise<string> {
    return new Promise(function(resolve, reject) {
        exec(command, options,(error, stdout) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.toString());
        });
    });
}