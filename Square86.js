// ==========================================
// SQUARE86 - GELİŞMİŞ OYUN MOTORU & MANTIK
// ==========================================

let deste = [];
let oyuncuEli = [];
let rakipEli = [];
let oyuncuPuan = 0;
let rakipPuan = 0;

let oyuncuCezaHavuzu = [];
let rakipCezaHavuzu = [];

// Arayüzün hata vermemesi için gerekli yan durumlar
let rakipSonIndirilenler = [];
let rakipSonHamleTipi = "Henüz hamle yapmadı";

// 1. DESTE OLUŞTURMA (86 Kart + 1 Joker)
function desteOlustur() {
    let yeniDeste = [];
    const kartDagilimi = {
        10: 4, 9: 5, 8: 6, 7: 7, 6: 8, 
        5: 9, 4: 10, 3: 11, 2: 12, 1: 13
    };

    for (let sayi in kartDagilimi) {
        let adet = kartDagilimi[sayi];
        for (let i = 0; i < adet; i++) {
            yeniDeste.push(Number(sayi));
        }
    }
    yeniDeste.push("JOKER");
    return yeniDeste;
}

// 2. DESTEYİ KARIŞTIRMA
function desteyiKaristir(kartlar) {
    for (let i = kartlar.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kartlar[i], kartlar[j]] = [kartlar[j], kartlar[i]];
    }
    return kartlar;
}

// 3. OYUNU BAŞLATMA
function oyunuBaslat() {
    deste = desteyiKaristir(desteOlustur());
    
    oyuncuEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    rakipEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    
    oyuncuPuan = 0;
    rakipPuan = 0;
    oyuncuCezaHavuzu = [];
    rakipCezaHavuzu = [];
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = "Oyun başladı, senin hamlen bekleniyor...";
    
    alert("Square86 Başladı! İyi şanslar.");
}

// 4. ELİN DEĞERİNİ VE KOMBİNASYONUNU HESAPLAMA (Puan Mantığı)
function eliHesapla(kartlar) {
    if (kartlar.length === 0) return { tip: "PAS", puan: 0 };

    // Joker kontrolü ve sayıya dönüştürme mantığı
    let jokerAdeti = kartlar.filter(k => k === "JOKER").length;
    let normalKartlar = kartlar.filter(k => k !== "JOKER").map(Number).sort((a, b) => a - b);

    // --- 2 KARTLI KOMBİNASYON (ÇİFT) ---
    if (kartlar.length === 2) {
        if (jokerAdeti === 1 || normalKartlar[0] === normalKartlar[1]) {
            let kartDegeri = jokerAdeti === 1 ? normalKartlar[0] : normalKartlar[0];
            return { tip: "CIFT", puan: kartDegeri * 2 };
        }
    }

    // --- 4 KARTLI KOMBİNASYONLAR (4'LÜ veya SERİ) ---
    if (kartlar.length === 4) {
        // Hepsi Aynı mı? (4'lü)
        let hepsiAyni = true;
        for (let i = 1; i < normalKartlar.length; i++) {
            if (normalKartlar[i] !== normalKartlar[0]) hepsiAyni = false;
        }
        if (hepsiAyni && normalKartlar.length > 0) {
            return { tip: "4LU", puan: normalKartlar[0] * 10 };
        }

        // Sıralı mı? (Seri Kontrolü - Örn: 3-4-5-6)
        let ardisikMi = true;
        // Joker yoksa düz kontrol yap
        if (jokerAdeti === 0) {
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                if (normalKartlar[i+1] !== normalKartlar[i] + 1) ardisikMi = false;
            }
            if (ardisikMi) return { tip: "SERI", puan: normalKartlar.reduce((a,b)=>a+b, 0) * 2 };
        } else if (jokerAdeti === 1) {
            // 1 Jokerli boşluk toleranslı ardışık kontrolü
            let bosluklar = 0;
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                let fark = normalKartlar[i+1] - normalKartlar[i];
                if (fark === 2) bosluklar++;
                else if (fark !== 1) ardisikMi = false;
            }
            if (ardisikMi && bosluklar <= 1) {
                // Tahmini puan hesabı için eksik olan yeri jokerle doldur
                let toplamPuan = normalKartlar.reduce((a,b)=>a+b, 0) + (normalKartlar[0] + 1); 
                return { tip: "JOKERLI SERI", puan: toplamPuan * 2 };
            }
        }
    }

    return { tip: "PAS", puan: 0 };
}

// 5. CEZA HESAPLAMA MOTORU
function suAnkiCezayiHesapla(havuz) {
    // Havuzdaki kartların sayısal değerlerinin toplamını döndürür
    return havuz.reduce((toplam, kart) => {
        if (kart === "JOKER") return toplam + 20; // Joker elinde patlarsa ağır ceza
        return toplam + Number(kart);
    }, 0);
}

// 6. RAKİP YAPAY ZEKASI (BOT MOTORU)
function rakipHamleYap() {
    if (rakipEli.length === 0) return;

    // Bot önce elinde 4'lü veya Seri var mı diye bakar
    let analiz4LU = eliHesapla(rakipEli);
    if (analiz4LU.tip !== "PAS") {
        rakipPuan += analiz4LU.puan;
        rakipSonIndirilenler = [...rakipEli];
        rakipSonHamleTipi = `Rakip 4'lü Kombinasyon yaptı! (+${analiz4LU.puan} Puan)`;
        rakipEli = [];
        
        while(rakipEli.length < 4 && deste.length > 0) {
            rakipEli.push(deste.pop());
        }
        return;
    }

    // Bot elindeki ikili kombinasyonları arar (Deneysel Çift kontrolü)
    for (let i = 0; i < rakipEli.length; i++) {
        for (let j = i + 1; j < rakipEli.length; j++) {
            let ikili = [rakipEli[i], rakipEli[j]];
            let analiz2LI = eliHesapla(ikili);
            if (analiz2LI.tip !== "PAS") {
                rakipPuan += analiz2LI.puan;
                rakipSonIndirilenler = [...ikili];
                rakipSonHamleTipi = `Rakip Çift indirdi! (+${analiz2LI.puan} Puan)`;
                
                // Kartları elden çıkar
                rakipEli.splice(j, 1);
                rakipEli.splice(i, 1);
                
                while(rakipEli.length < 4 && deste.length > 0) {
                    rakipEli.push(deste.pop());
                }
                return;
            }
        }
    }

    // Kombinasyon yapamıyorsa en büyük kartını pas olarak dışarı atar
    let enBuyukEndeks = 0;
    let enBuyukDeger = -1;
    
    rakipEli.forEach((k, idx) => {
        let val = k === "JOKER" ? 0 : Number(k); // Joker'i pas geçmek istemez
        if(val > enBuyukDeger) {
            enBuyukDeger = val;
            enBuyukEndeks = idx;
        }
    });

    let atilan = rakipEli.splice(enBuyukEndeks, 1)[0];
    rakipCezaHavuzu.push(atilan);
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = "Rakip Pas geçti (Bir kartını kapalı attı).";

    if (deste.length > 0) {
        rakipEli.push(deste.pop());
    }
}

// 7. OYUN SONU EKRANI VE SKOR TABLOSU
function oyunBitti() {
    let oyuncuNetCeza = suAnkiCezayiHesapla(oyuncuCezaHavuzu);
    let rakipNetCeza = suAnkiCezayiHesapla(rakipCezaHavuzu);
    
    let oyuncuFinalSkor = oyuncuPuan - oyuncuNetCeza;
    let rakipFinalSkor = rakipPuan - rakipNetCeza;

    let sonucMesaji = `=== OYUN BİTTİ ===\n\n`;
    sonucMesaji += `SENİN SKORUN:\nKombinasyon: ${oyuncuPuan} | Toplam Ceza: -${oyuncuNetCeza}\nNet Puan: ${oyuncuFinalSkor}\n\n`;
    sonucMesaji += `RAKİP SKORUN:\nKombinasyon: ${rakipPuan} | Toplam Ceza: -${rakipNetCeza}\nNet Puan: ${rakipFinalSkor}\n\n`;

    if (oyuncuFinalSkor > rakipFinalSkor) {
        sonucMesaji += "🎉 TEBRİKLER, KAZANDIN! 🎉";
    } else if (oyuncuFinalSkor < rakipFinalSkor) {
        sonucMesaji += "❌ MAALESEF RAKİP KAZANDI! ❌";
    } else {
        sonucMesaji += "🤝 BERABERE BİTTİ! 🤝";
    }

    alert(sonucMesaji);
}
