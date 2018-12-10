imports.searchPath.push('dist');
const KeePassX = imports.gjsKeepassx.KeePassX;

let kpx = new KeePassX("testdb_xc.kdbx", { password: "geheim" });

kpx.entries(["dmi"]).then(es => {
    for (const e of es) {
        print("Title: " + e.title)
        print("UserName: " + e.username);
        print("");
    }

    print("Copying Password of " + es[0].title + " to clipboard...");
    return kpx.passwordToClipboard(es[0].title);
}).then((x) => {
    print(x);
    print("done.");
    imports.mainloop.quit();
});

imports.mainloop.run();
