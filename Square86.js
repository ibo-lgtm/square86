// ==========================================
// SQUARE86 - ÖZEL PUANLAMA VE OYUN MOTORU
// ==========================================

let deste = [];
let oyuncuEli = [];
let rakipEli = [];
let oyuncuPuan = 0;
let rakipPuan = 0;

let oyuncuCezaHavuzu = [];
let rakipCezaHavuzu = [];

let rakipSonIndirilenler = [];
let rakipSonHamleTipi = "Oyun başladı, senin hamlen bekleniyor...";

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
    
    alert("Square86 Başladı! Yeni kurallarla kartlar dağıtıldı.");
}

// 4. GELİŞMİŞ VE DÜZELTİLMİŞ EL HESAPLAMA MOTORU
function eliHesapla(kartlar) {
    if (kartlar.length === 0) return { tip: "PAS", puan: 0 };

    let jokerAdeti = kartlar.filter(k => k === "JOKER").length;
    let normalKartlar = kartlar.filter(k => k !== "JOKER").map(Number).sort((a, b) => a - b);

    // --- 2 KARTLI KOMBİNASYON (ÇİFT) ---
    // Kural: Sayı x Sayı (Örn: 6x6 = 36)
    if (kartlar.length === 2) {
        if (jokerAdeti === 1 && normalKartlar.length === 1) {
            let sayi = normalKartlar[0];
            return { tip: "JOKERLİ ÇİFT", puan: sayi * sayi };
        }
        if (normalKartlar[0] === normalKartlar[1]) {
            let sayi = normalKartlar[0];
            return { tip: "ÇİFT", puan: sayi * sayi };
        }
    }

    // --- 4 KARTLI KOMBİNASYONLAR (4'LÜ veya SERİ) ---
    if (kartlar.length === 4) {
        // Hepsi Aynı mı? (4'lü) -> Kural: Toplamları x O Sayı (Örn: (5+5+5+5)x5 = 100)
        let hepsiAyni = true;
        if (jokerAdeti === 1) {
            for (let i = 1; i < normalKartlar.length; i++) {
                if (normalKartlar[i] !== normalKartlar[0]) hepsiAyni = false;
            }
            if (hepsiAyni && normalKartlar.length === 3) {
                let sayi = normalKartlar[0];
                return { tip: "JOKERLİ 4'LÜ", puan: (sayi * 4) * sayi };
            }
        } else if (jokerAdeti === 0) {
            for (let i = 1; i < normalKartlar.length; i++) {
                if (normalKartlar[i] !== normalKartlar[0]) hepsiAyni = false;
            }
            if (hepsiAyni) {
                let sayi = normalKartlar[0];
                return { tip: "4'LÜ", puan: (sayi * 4) * sayi };
            }
        }

        // Sıralı mı? (Seri Kontrolü) -> Kural: Toplamları x En Büyük Sayı (Örn: (3+4+5+6)x6 = 108)
        let ardisikMi = true;
        
        // JOKERSİZ DÜZ SERİ
        if (jokerAdeti === 0) {
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                if (normalKartlar[i+1] !== normalKartlar[i] + 1) ardisikMi = false;
            }
            if (ardisikMi) {
                let toplam = normalKartlar.reduce((a, b) => a + b, 0);
                let enBuyuk = normalKartlar[normalKartlar.length - 1];
                return { tip: "SERİ", puan: toplam * enBuyuk };
            }
        } 
        // 1 JOKERLİ SERİ
        else if (jokerAdeti === 1) {
            // Durum A: Joker ortada veya uçta bir boşluğu dolduruyor
            let bosluklar = [];
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                let fark = normalKartlar[i+1] - normalKartlar[i];
                if (fark > 1) {
                    for(let b = 1; b < fark; b++) bosluklar.push(normalKartlar[i] + b);
                }
            }

            // Eğer sayılar kendi içinde ardışıksa veya sadece 1 boşluk varsa geçerlidir
            if (bosluklar.length === 1 && (normalKartlar[2] - normalKartlar[0] === 3)) {
                let eksikSayi = bosluklar[0];
                let tamSeri = [...normalKartlar, eksikSayi].sort((a,b)=>a-b);
                let toplam = tamSeri.reduce((a, b) => a + b, 0);
                let enBuyuk = tamSeri[tamSeri.length - 1];
                return { tip: "JOKERLİ SERİ", puan: toplam * enBuyuk };
            }
            // Durum B: Sayılar tamamen ardışık, joker serinin başına veya sonuna eklenecek
            else if (bosluklar.length === 0 && (normalKartlar[2] - normalKartlar[0] === 2)) {
                // Önceliği puandan ötürü serinin sonuna (en büyük sayı yapmaya) veriyoruz
                let eksikSayi = normalKartlar[normalKartlar.length - 1] + 1;
                // Eğer en büyük sayı 10'u geçiyorsa serinin başına ekle (10 sınır kuralı)
                if (eksikSayi > 10) {
                    eksikSayi = normalKartlar[0] - 1;
                }
                let tamSeri = [...normalKartlar, eksikSayi].sort((a,b)=>a-b);
                let toplam = tamSeri.reduce((a, b) => a + b, 0);
                let enBuyuk = tamSeri[tamSeri.length - 1];
                return { tip: "JOKERLİ SERİ", puan: toplam * enBuyuk };
            }
        }
    }

    return { tip: "PAS", puan: 0 };
}

// 5. CEZA HESAPLAMA MOTORU (Kural: Kartların Değerinin 10 Katı)
function suAnkiCezayiHesapla(havuz) {
    if (!havuz || havuz.length === 0) return 0;
    return havuz.reduce((toplam, kart) => {
        let kartDegeri = kart === "JOKER" ? 20 : Number(kart); // Joker elde kalırsa taban 20 kabul edilir
        return toplam + (kartDegeri * 10); // Her kartın 10 katı ceza yazılır
    }, 0);
}

// 6. RAKİP YAPAY ZEKASI (BOT)
function rakipHamleYap() {
    if (rakipEli.length === 0) return;

    // Bot elindeki 4'lü veya Seri kontrolü yapar
    let analiz4LU = eliHesapla(rakipEli);
    if (analiz4LU.tip !== "PAS") {
        rakipPuan += analiz4LU.puan;
        rakipSonIndirilenler = [...rakipEli];
        rakipSonHamleTipi = `Rakip ${analiz4LU.tip} yaptı! (+${analiz4LU.puan} Puan)`;
        rakipEli = [];
        
        while(rakipEli.length < 4 && deste.length > 0) {
            rakipEli.push(deste.pop());
        }
        return;
    }

    // Bot elindeki çiftleri kontrol eder
    for (let i = 0; i < rakipEli.length; i++) {
        for (let j = i + 1; j < rakipEli.length; j++) {
            let ikili = [rakipEli[i], rakipEli[j]];
            let analiz2LI = eliHesapla(ikili);
            if (analiz2LI.tip !== "PAS") {
                rakipPuan += analiz2LI.puan;
                rakipSonIndirilenler = [...ikili];
                rakipSonHamleTipi = `Rakip ${analiz2LI.tip} indirdi! (+${analiz2LI.puan} Puan)`;
                
                rakipEli.splice(j, 1);
                rakipEli.splice(i, 1);
                
                while(rakipEli.length < 4 && deste.length > 0) {
                    rakipEli.push(deste.pop());
                }
                return;
            }
        }
    }

    // Mecburen pas geçme: En büyük kartını ceza havuzuna kapalı atar
    let enBuyukEndeks = 0;
    let enBuyukDeger = -1;
    
    rakipEli.forEach((k, idx) => {
        let val = k === "JOKER" ? 0 : Number(k);
        if(val > enBuyukDeger) {
            enBuyukDeger = val;
            enBuyukEndeks = idx;
        }
    });

    let atilan = rakipEli.splice(enBuyukEndeks, 1)[0];
    rakipCezaHavuzu.push(atilan);
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = "Rakip Pas geçti (1 kart kapalı attı).";

    if (deste.length > 0) {
        rakipEli.push(deste.pop());
    }
}

// 7. OYUN BİTTİ EKRANI (Elde kalan kartlar cezaya eklenir)
function oyunBitti() {
    // Elde kalan kartlar da ceza havuzuna dahil edilir
    oyuncuEli.forEach(k => oyuncuCezaHavuzu.push(k));
    rakipEli.forEach(k => rakipCezaHavuzu.push(k));
    
    let oyuncuNetCeza = suAnkiCezayiHesapla(oyuncuCezaHavuzu);
    let rakipNetCeza = suAnkiCezayiHesapla(rakipCezaHavuzu);
    
    let oyuncuFinalSkor = oyuncuPuan - oyuncuNetCeza;
    let rakipFinalSkor = rakipPuan - rakipNetCeza;

    let sonucMesaji = `=== OYUN BİTTİ (Deste Tükendi) ===\n\n`;
    sonucMesaji += `SENİN NET SKORUN: ${oyuncuFinalSkor}\n(Kombinasyon: +${oyuncuPuan} | 10 Kat Ceza Hatası: -${oyuncuNetCeza})\n\n`;
    sonucMesaji += `RAKİBİN NET SKORUN: ${rakipFinalSkor}\n(Kombinasyon: +${rakipPuan} | 10 Kat Ceza Hatası: -${rakipNetCeza})\n\n`;

    if (oyuncuFinalSkor > rakipFinalSkor) {
        sonucMesaji += "🎉 TEBRİKLER! EN YÜKSEK PUANA ULAŞARAK OYUNU KAZANDIN! 🎉";
    } else if (oyuncuFinalSkor < rakipFinalSkor) {
        sonucMesaji += "❌ MAALESEF RAKİP DAHA YÜKSEK PUAN ALDI! ❌";
    } else {
        sonucMesaji += "🤝 BERABERE BİTTİ! 🤝";
    }

    alert(sonucMesaji);
}
