import * as Gio from "Gio";
import * as GLib from "GLib";

export class Process {
    private readonly stdout: Gio.DataInputStream;
    private readonly stdin: Gio.DataOutputStream;

    constructor(private readonly cmd: string[]) {
        const [res, pid, inFd, outFd, errFd] = (GLib as any).spawn_async_with_pipes(null, cmd, null, GLib.SpawnFlags.SEARCH_PATH, null);

        this.stdout = new Gio.DataInputStream({
            base_stream: new Gio.UnixInputStream({ fd: outFd }),
        });
        this.stdin = new Gio.DataOutputStream({
            base_stream: new Gio.UnixOutputStream({ fd: inFd }),
        });
    }

    public putString(input: string) {
        this.stdin.put_string(input, null!);
    }

    public readAsync(): Promise<string> {
        const stdout = this.stdout as any;

        return new Promise((resolve, reject) => {
            let output = "";

            function _socketRead(source_object, res) {
                const [chunk, length] = stdout.read_upto_finish(res);
                if (chunk !== null) {
                    output += chunk + "\n";
                    stdout.read_line_async(null, null, _socketRead);
                } else {
                    resolve(output);
                }
            }

            stdout.read_line_async(null, null, _socketRead);
        });
    }

    public close() {
        this.stdin.close(null!);
        this.stdout.close(null!);
    }
}
