import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';

// Windows protects the encryption key with the signed-in user's DPAPI vault.
function windowsSecret(value,encrypt){
 const script=encrypt?"$s=[Console]::In.ReadToEnd(); ConvertTo-SecureString $s -AsPlainText -Force | ConvertFrom-SecureString":"$s=[Console]::In.ReadToEnd() | ConvertTo-SecureString; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try {[Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}";
 return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{input:value,encoding:'utf8',windowsHide:true}).trim();
}
export function createLocalStore(directory=join(process.env.LOCALAPPDATA||homedir(),process.platform==='win32'?'MarketRadar':'.market-radar')){
 mkdirSync(directory,{recursive:true,mode:0o700});
 const keyPath=join(directory,process.platform==='win32'?'key.dpapi':'key'),dbPath=join(directory,'accounts.sqlite');
 let secret;
 if(existsSync(keyPath)){const saved=readFileSync(keyPath,'utf8');secret=process.platform==='win32'?windowsSecret(saved,false):saved}
 else {if(existsSync(dbPath))throw Error('Saved account key is missing. Restore it before opening the saved accounts.');secret=randomBytes(32).toString('hex');writeFileSync(keyPath,process.platform==='win32'?windowsSecret(secret,true):secret,{mode:0o600,flag:'wx'})}
 if(!/^[a-f0-9]{64}$/.test(secret))throw Error('Saved encryption key could not be opened by this user.');
 const sqlite=new DatabaseSync(dbPath);sqlite.exec('CREATE TABLE IF NOT EXISTS _radar_migrations (name TEXT PRIMARY KEY)');
 const migrations=fileURLToPath(new URL('./drizzle/',import.meta.url));
 for(const file of readdirSync(migrations).filter(x=>x.endsWith('.sql')).sort())if(!sqlite.prepare('SELECT name FROM _radar_migrations WHERE name=?').get(file)){
  sqlite.exec('BEGIN');try{sqlite.exec(readFileSync(join(migrations,file),'utf8'));sqlite.prepare('INSERT INTO _radar_migrations(name) VALUES(?)').run(file);sqlite.exec('COMMIT')}catch(e){sqlite.exec('ROLLBACK');throw e}
 }
 const DB={prepare(sql){return {bind(...args){const statement=sqlite.prepare(sql);return {run:async()=>({meta:{changes:statement.run(...args).changes}}),first:async()=>statement.get(...args)??null}}}}};
 return {DB,secret,close:()=>sqlite.close()};
}
