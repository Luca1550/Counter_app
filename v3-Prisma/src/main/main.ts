import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../prisma/generated/client.js';

// Vite place le bundle dans .vite/build/main.js
// __dirname = .vite/build/
// ../.. remonte à la racine du projet (où se trouve counter.db)
const dbPath = path.join(__dirname, '..', '..', 'counter.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });
// ↑ on passe le driver adapter au client
// Prisma n'a plus besoin de process.env

async function initCounter(): Promise<void> {
  await prisma.counter.upsert({
    where: { id: 1 },
    update: {}, // si trouvé : ne rien changer
    create: { id: 1, value: 0 }, // si absent : créer avec value = 0
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 500,
    height: 450,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  // Charge le renderer Angular (buildé avec ng build)
  win.loadFile(
    path.join(__dirname, '..', '..', 'renderer/app/dist/app/browser/index.html')
  );
}
app.whenReady().then(async () => { // async requis pour pouvoir utiliser await
  await initCounter(); // créer le compteur si absent
  createWindow();
});
app.on('before-quit'
  , async () => {
    await prisma.$disconnect(); // fermer la connexion proprement
  });

ipcMain.handle('get-counter', async (): Promise<number> => {
  const counter = await prisma.counter.findUnique({ where: { id: 1 } });
  return counter?.value ?? 0;
});
ipcMain.handle('increment', async (): Promise<number> => {
  const counter = await prisma.counter.update({
    where: { id: 1 },
    data: { value: { increment: 1 } },
  });
  return counter.value;
});
ipcMain.handle('decrement', async (): Promise<number> => {
  const counter = await prisma.counter.update({
    where: { id: 1 },
    data: { value: { decrement: 1 } },
  });
  return counter.value;
});
ipcMain.handle('reset', async (): Promise<number> => {
  const counter = await prisma.counter.update({
    where: { id: 1 },
    data: { value: 0 },
  });
  return counter.value;
});