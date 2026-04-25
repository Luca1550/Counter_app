import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';

// new Database(chemin) ouvre le fichier .db
// Si le fichier n'existe pas, il est créé automatiquement
const DB_PATH = path.join(__dirname, '..', 'counter.db');
const db = new Database(DB_PATH);

// Exécuté à chaque démarrage
db.exec(`
CREATE TABLE IF NOT EXISTS Counter (
id INTEGER PRIMARY KEY,
value INTEGER NOT NULL DEFAULT 0
)
`);
// OR IGNORE : si id=1 existe déjà, ne fait rien (conserve la valeur)
db.prepare('INSERT OR IGNORE INTO Counter (id, value) VALUES (1, 0)').run();

function createWindow(): void {
    const win = new BrowserWindow({
        width: 500,
        height: 450,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    win.loadFile(path.join(__dirname, '..', 'renderer/app/dist/app/browser/index.html')
    );
}

app.whenReady().then(() => {
    createWindow();
});
// Fermer la connexion proprement à la fermeture de l'app
app.on('before-quit', () => {
    db.close();
});

ipcMain.handle('get-counter', (): number => {
        // get() → retourne un objet { value: number } ou undefined
        // Le cast 'as { value: number }' est nécessaire car TypeScript
        // ne peut pas inférer la forme du résultat SQL automatiquement
        const row = db.prepare('SELECT value FROM Counter WHERE id = 1').get() as {
            value:
            number
        };
        return row.value;
    });
ipcMain.handle('increment', (): number => {
        // run() exécute l'UPDATE — pas de valeur de retour utile
        db.prepare('UPDATE Counter SET value = value + 1 WHERE id = 1').run();
        // get() relit la valeur après modification
        const row = db.prepare('SELECT value FROM Counter WHERE id = 1').get() as {
            value:
            number
        };
        return row.value;
    });
ipcMain.handle('decrement', (): number => {
        db.prepare('UPDATE Counter SET value = value - 1 WHERE id = 1').run();
        const row = db.prepare('SELECT value FROM Counter WHERE id = 1').get() as {
            value:
            number
        };
        return row.value;
    });
ipcMain.handle('reset', (): number => {
        db.prepare('UPDATE Counter SET value = 0 WHERE id = 1').run();
        return 0;
    });

