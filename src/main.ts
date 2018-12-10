import * as Gio from "Gio";
import * as GLib from "GLib";
import * as Lang from "Lang";

import { Process } from "./process";

export interface KeePassXAuth {
    password?: string;
}

export class Entry {
    constructor(
        public readonly title?: string,
        public readonly username?: string,
        public readonly url?: string,
        public readonly notes?: string,
    ) {}

    public matches(search: string[]): boolean {
        const fields = [this.title, this.username, this.url, this.notes]
            .filter(f => f !== undefined)
            .map(f => f!.toLowerCase());

        loop1:
        for (const s of search) {
            const sl = s.toLowerCase();

            for (const f of fields) {
                if (f.indexOf(sl) !== -1) {
                    continue loop1;
                }
            }

            // no field matched
            return false;
        }

        return true;
    }
}

export class KeePassX {
    private entryCache: Entry[] | undefined = undefined;

    constructor(
        public readonly database: string,
        private readonly auth: KeePassXAuth
    ) {}

    private async call(cmd: string, args: string[] = []): Promise<string> {
        const p = new Process(["keepassxc-cli", cmd, this.database].concat(args));

        const pw = this.auth.password;
        if (pw) {
            p.putString(pw + "\n");
        }

        return p.readAsync();
    }

    public async passwordToClipboard(entryTitle: string): Promise<any> {
        return this.call("clip", [entryTitle]);
    }

    /**
     * Return all entries that match a number of search strings
     * (in either title, username, url or notes).
     * @arg search An array of strings that must be contained in any of the
     *             title, username, url or notes of matching entries
     * @return An array of matching entries
     */
    public async entries(search: string[] = []): Promise<Entry[]> {
        if (!this.entryCache) {
            this.entryCache = await this.fetchEntries();
        }

        return this.entryCache.filter(e => e.matches(search));
    }

    private async fetchEntries(): Promise<Entry[]> {
        const xml = await this.extract();
        
        return xml.split(/\s*<Entry>/).slice(1).map(entry => {
            const fields: { [key: string]: string | undefined } = {};
            
            for (const f of entry.split(/<String>\s*<Key>/).slice(1)) {
                const s = f.split(/<\/Key>\s*<Value/);
                fields[s[0]] = (s[1].indexOf(">", 0) === 0) ? s[1].slice(1).split("</Value>")[0] : undefined;
            }

            return new Entry(fields.Title, fields.UserName, fields.URL, fields.Notes);
        });
    }

    public extract(): Promise<string> {
        return this.call("extract");
    }
}
