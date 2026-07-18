// ==========================================
// SQUARE86 - STRATEJİ & PUANLAMA MOTORU
// ==========================================

let deste = [];
let oyuncuEli = [];
let rakipEli = [];
let oyuncuPuan = 0;
let rakipPuan = 0;

let oyuncuCezaHavuzu = [];
let rakipCezaHavuzu = [];

// Teklif kuralı değişkenleri
let yerdekiTeklifKarti = null; 
let teklifSahibi = null; // "OYUNCU" veya "RAKIP"

let rakipSonIndirilenler = [];
let rakipSonHamleTipi = "Oyun başladı, senin hamlen bekleniyor...";

// 1. DESTE HAZIRLAMA (86 Standart Kart + 1 Joker)
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

// 3. SIFIRDAN OYUN BAŞLATMA
function oyunuBaslat() {
    deste = desteyiKaristir(desteOlustur());
    
    oyuncuEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    rakipEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    
    oyuncuPuan = 0;
    rakipPuan = 0;
    oyuncuCezaHavuzu = [];
    rakipCezaHavuzu = [];
    yerdekiTeklifKarti = null;
    teklifSahibi = null;
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = "Oyun başladı, hamleni yapabilirsin.";
}

// 4. MATEMATİKSEL KOMBİNASYON HESAPLAYICI (ÖZEL KURALLAR)
function eliHesapla(kartlar) {
    if (kartlar.length === 0) return { tip: "PAS", puan: 0 };

    let jokerAdeti = kartlar.filter(k => k === "JOKER").length;
    let normalKartlar = kartlar.filter(k => k !== "JOKER").map(Number).sort((a, b) => a - b);

    // --- 2 KARTLI KOMBİNASYONLAR (ÇİFT) ---
    // Formül: Sayı x Sayı (Örn: 6x6 = 36)
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
        
        // A) 4'LÜ KONTROLÜ -> Formül: Toplamları x Sayı (Örn: (5+5+5+5)x5 = 100)
        let hepsiAyni = true;
        if (normalKartlar.length > 0) {
            let kontrolSayisi = normalKartlar[0];
            normalKartlar.forEach(k => { if(k !== kontrolSayisi) hepsiAyni = false; });
            if (hepsiAyni) {
                return { tip: jokerAdeti === 1 ? "JOKERLİ 4'LÜ" : "4'LÜ", puan: (kontrolSayisi * 4) * kontrolSayisi };
            }
        }

        // B) SERİ KONTROLÜ -> Formül: Elemanlar Toplamı x Serinin En Büyük Sayısı
        let ardisikMi = true;

        // Jokersiz Düz Seri (Örn: 3-4-5-6 -> (18) x 6 = 108)
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
        // Jokerli Seri Kontrolü
        else if (jokerAdeti === 1) {
            let bosluklar = [];
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                let fark = normalKartlar[i+1] - normalKartlar[i];
                if (fark > 1) {
                    for(let b = 1; b < fark; b++) bosluklar.push(normalKartlar[i] + b);
                }
            }

            // Araya joker giriyorsa (Örn: 3-4-[Jok]-6)
            if (bosluklar.length === 1 && (normalKartlar[2] - normalKartlar[0] === 3)) {
                let tamSeri = [...normalKartlar, bosluklar[0]].sort((a,b)=>a-b);
                return { tip: "JOKERLİ SERİ", puan: tamSeri.reduce((a,b)=>a+b,0) * tamSeri[3] };
            }
            // Uca joker giriyorsa (Örn: 3-4-5-[Jok] -> Joker 6 olur)
            else if (bosluklar.length === 0 && (normalKartlar[2] - normalKartlar[0] === 2)) {
                let eksikSayi = normalKartlar[2] + 1;
                if (eksikSayi > 10) eksikSayi = normalKartlar[0] - 1; // 10 sınırını aşarsa başa koy
                let tamSeri = [...normalKartlar, eksikSayi].sort((a,b)=>a-b);
                return { tip: "JOKERLİ SERİ", puan: tamSeri.reduce((a,b)=>a+b,0) * tamSeri[3] };
            }
        }
    }

    return { tip: "PAS", puan: 0 };
}

// 5. ANLIK CEZA GÖSTERGESİ (Kural: Kart Değerlerinin 10 Katı)
function suAnkiCezayiHesapla(havuz) {
    if (!havuz || havuz.length === 0) return 0;
    return havuz.reduce((toplam, kart) => {
        let val = kart === "JOKER" ? 20 : Number(kart);
        return toplam + (val * 10);
    }, 0);
}

// 6. OYUNCU İÇİN: MAVİ BUTONA BASIP YERDEKİ TEKLİFİ KAPMA HAMLESİ
function yerdekiKartiAlDene() {
    if (!yerdekiTeklifKarti || teklifSahibi !== "RAKIP") return;
    
    oyuncuEli.push(yerdekiTeklifKarti);
    document.getElementById("bildirim-alani").innerText = `Rakibin teklif ettiği ${yerdekiTeklifKarti} kartını eline çektin! Rakip cezadan kurtuldu.`;
    
    yerdekiTeklifKarti = null;
    teklifSahibi = null;
    document.getElementById("teklif-kart-yazi").innerText = "-";
    
    if(window.arayuzuGuncelle) window.arayuzuGuncelle();
}

// 7. RAKİP YAPAY ZEKASI (STRATEJİK BOT HAMLELERİ)
function rakipHamleYap() {
    if (rakipEli.length === 0) return;

    // --- FAZ A: OYUNCUNUN TEKLİF ETTİĞİ KARTIN ANALİZİ ---
    if (yerdekiTeklifKarti !== null && teklifSahibi === "OYUNCU") {
        let testEli = [...rakipEli, yerdekiTeklifKarti];
        let seriyeYariyorMu = false;

        // Bot kartı eline alıp 4'lü kombinasyon yapabiliyor mu diye bakar
        for(let i=0; i<testEli.length; i++) {
            for(let j=i+1; j<testEli.length; j++) {
                for(let k=j+1; k<testEli.length; k++) {
                    for(let l=k+1; l<testEli.length; l++) {
                        if(eliHesapla([testEli[i], testEli[j], testEli[k], testEli[l]]).tip !== "PAS") seriyeYariyorMu = true;
                    }
                }
            }
        }

        // Taktiksel Karar: Kart işine yarıyorsa, Joker ise ya da büyük sayıysa (>= 8) bot kartı KAPANIR!
        if (seriyeYariyorMu || yerdekiTeklifKarti === "JOKER" || Number(yerdekiTeklifKarti) >= 8) {
            rakipEli.push(yerdekiTeklifKarti);
            rakipSonHamleTipi = `Rakip yerdeki ${yerdekiTeklifKarti} kartını kapmayı seçti. (Cezan silindi!)`;
            yerdekiTeklifKarti = null;
            teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
            return; // Hamlesini alarak kullandı, bir sonraki el kombinasyon yapacak.
        } else {
            // Bot kartı istemedi! Desteden çekecek. Oyuncunun kartı artık kalıcı olarak cezaya dönüşür!
            oyuncuCezaHavuzu.push(yerdekiTeklifKarti);
            yerdekiTeklifKarti = null;
            teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
        }
    }

    // Bot eksik kartı varsa hamlesine başlamadan önce desteden tamamlar
    if (rakipEli.length < 4 && deste.length > 0) {
        rakipEli.push(deste.pop());
    }

    // --- FAZ B: KOMBİNASYON İNDİRME HAMLESİ ---
    let analiz4LU = eliHesapla(rakipEli);
    if (analiz4LU.tip !== "PAS") {
        rakipPuan += analiz4LU.puan;
        rakipSonIndirilenler = [...rakipEli];
        rakipSonHamleTipi = `Rakip ${analiz4LU.tip} yaptı! (+${analiz4LU.puan} Puan)`;
        rakipEli = [];
        return;
    }

    // Çift Kontrolü
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
                return;
            }
        }
    }

    // --- FAZ C: PAS GEÇME & TEKLİF SUNMA ---
    // Elinde hamle yoksa en yüksek ceza riski taşıyan kartını teklif alanına açık atar
    let enBuyukEndeks = 0;
    let enBuyukDeger = -1;
    rakipEli.forEach((k, idx) => {
        let val = k === "JOKER" ? 0 : Number(k);
        if(val > enBuyukDeger) { enBuyukDeger = val; enBuyukEndeks = idx; }
    });

    yerdekiTeklifKarti = rakipEli.splice(enBuyukEndeks, 1)[0];
    teklifSahibi = "RAKIP";
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = `Rakip pas geçti ve yere ${yerdekiTeklifKarti} kartını teklif etti!`;
    document.getElementById("teklif-kart-yazi").innerText = yerdekiTeklifKarti + " (Rakibin Teklifi)";
}

// 8. OYUN SONU SKOR HESAPLAMA (Elde kalanlar da 10 katı cezaya dahil edilir)
function oyunBitti() {
    oyuncuEli.forEach(k => oyuncuCezaHavuzu.push(k));
    rakipEli.forEach(k => rakipCezaHavuzu.push(k));
    
    let oyuncuNetCeza = suAnkiCezayiHesapla(oyuncuCezaHavuzu);
    let rakipNetCeza = suAnkiCezayiHesapla(rakipCezaHavuzu);
    
    let oyuncuFinalSkor = oyuncuPuan - oyuncuNetCeza;
    let rakipFinalSkor = rakipPuan - rakipNetCeza;

    let sonucMesaji = `=== OYUN BİTTİ (Deste Tükendi) ===\n\n`;
    sonucMesaji += `SENİN NET SKORUN: ${oyuncuFinalSkor}\n(Kombinasyon: +${oyuncuPuan} | 10 Kat Ceza: -${oyuncuNetCeza})\n\n`;
    sonucMesaji += `RAKİBİN NET SKORUN: ${rakipFinalSkor}\n(Kombinasyon: +${rakipPuan} | 10 Kat Ceza: -${rakipNetCeza})\n\n`;

    if (oyuncuFinalSkor > rakipFinalSkor) {
        sonucMesaji += "🎉 TEBRİKLER! OYUNU KAZANDIN! 🎉";
    } else if (oyuncuFinalSkor < rakipFinalSkor) {
        sonucMesaji += "❌ MAALESEF RAKİP KAZANDI! ❌";
    } else {
        sonucMesaji += "🤝 BERABERE BİTTİ! 🤝";
    }

    alert(sonucMesaji);
}
