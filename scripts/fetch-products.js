
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// URL do Twojego Google Apps Script - ZAKTUALIZOWANY
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQfKc_tNM0F_kgr7ritY7coEnlxVwTPSn176x46MQXRI9m7Hsnoq3B_M6Pmgttbwp_4g/exec";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchData() {
  console.log('🔄 Rozpoczynanie pobierania danych z Google Sheets...');
  
  try {
    // 1. Dodajemy timestamp ORAZ losowy nonce, aby uniknąć cache'owania
    const nonce = Math.random().toString(36).substring(7);
    const urlWithCacheBuster = `${GOOGLE_SCRIPT_URL}?nonce=${nonce}&t=${Date.now()}`;
    
    console.log(`🔗 URL: ${urlWithCacheBuster}`);

    // 2. Wymuszamy brak cache w nagłówkach
    const response = await fetch(urlWithCacheBuster, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // DEBUG: Logujemy pierwsze 5 produktów, aby sprawdzić czy stany się zgadzają
    if (Array.isArray(data)) {
        console.log(`📦 Pobranno ${data.length} rekordów.`);
        console.log('🔍 PODGLĄD DANYCH (Pierwsze 5):');
        data.slice(0, 5).forEach(p => {
            console.log(`   - [${p.id}] ${p.name} | Stan: ${p.stan} | Cena: ${p.price}`);
        });
    }

    const jsonContent = JSON.stringify(data, null, 2);
    
    // Logika ścieżek:
    const localPublicDir = path.join(__dirname, '..', 'public');
    let targetPath;

    // PRIORYTET 1: Środowisko CI (GitHub Actions)
    if (process.env.CI) {
        targetPath = path.join(__dirname, '..', 'data.json');
        console.log(`📍 Wykryto środowisko CI (GitHub Actions) -> Wymuszony zapis do głównego katalogu (root).`);
    } 
    // PRIORYTET 2: Środowisko Lokalne (Dev)
    else if (fs.existsSync(localPublicDir)) {
        targetPath = path.join(localPublicDir, 'data.json');
        console.log(`📍 Wykryto środowisko lokalne (Dev) -> Zapis do folderu /public.`);
    } 
    // PRIORYTET 3: Fallback
    else {
        targetPath = path.join('data.json');
        console.log(`📍 Środowisko produkcyjne (Fallback) -> Zapis do obecnego katalogu.`);
    }

    fs.writeFileSync(targetPath, jsonContent);
    console.log(`✅ Zapisano pomyślnie w: ${targetPath}`);
    
  } catch (error) {
    console.error('❌ Błąd podczas pobierania danych:', error);
    process.exit(1);
  }
}

fetchData();
