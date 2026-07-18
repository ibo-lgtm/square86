// ==========================================
// SQUARE86 - HATASIZ OYUN MOTORU (KARTLAR AKTİF)
// ==========================================

let deste = [];
let oyuncuEli = [];
let rakipEli = [];
let oyuncuPuan = 0;
let rakipPuan = 0;

let oyuncuCezaHavuzu = [];
let rakipCezaHavuzu = [];

let yerdekiTeklifKarti = null; 
let teklifSahibi = null; // "OYUNCU" veya "RAKIP"

let rakipSonIndirilenler = [];
let rakipSonHamleTipi = "Oyun başladı, senin hamlen bekleniyor...";

function desteOlustur() {
    let yeniDeste = [];
    const kartDagilimi = {
        10: 4, 9: 5, 8: 6, 7: 7, 6: 8, 
        5: 9, 4: 10, 3: 11, 2: 12, 1: 13
    };
    for (let sayi in kartDagilimi) {
        let adet = kartDagilimi[sayi];
        for (let i = 0; i < adet; i++) { yeniDeste.push(Number(sayi)); }
    }
    yeniDeste.push("JOKER");
    return yeniDeste;
}

function desteyiKaristir(kartlar) {
    for (let i = kartlar.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kartlar[i], kartlar[j]] = [kartlar[j], kartlar[i]];
    }
    return kartlar;
}

function oyunuBaslat() {
    deste = desteyiKaristir(desteOlustur());
    
    // Kart dağıtımı tertemiz hale getirildi
    oyuncuEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    rakipEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    
    oyuncuPuan = 0;
    rakipPuan = 0;
    oyuncuCezaHavuzu = [];
    rakipCezaHavuzu = [];
    yerdekiTeklifKarti = null;
    teklifSahibi = null;
    rakipSonIndirilenler = [];
    rakipSonHamleTipi = "Oyun başladı, hamleni seç.";
}

function eliHesapla(kartlar) {
    if (kartlar.length === 0) return { tip: "PAS", puan: 0 };
    let jokerAdeti = kartlar.filter(k => k === "JOKER").length;
    let normalKartlar = kartlar.filter(k => k !== "JOKER").map(Number).sort((a, b) => a - b);

    if (kartlar.length === 2) {
        if (jokerAdeti === 1 && normalKartlar.length === 1) { return { tip: "JOKERLİ ÇİFT", puan: normalKartlar[0] * normalKartlar[0] }; }
        if (normalKartlar[0] === normalKartlar[1]) { return { tip: "ÇİFT", puan: normalKartlar[0] * normalKartlar[0] }; }
    }

    if (kartlar.length === 4) {
        let hepsiAyni = true;
        if (normalKartlar.length > 0) {
            let kontrolSayisi = normalKartlar[0];
            normalKartlar.forEach(k => { if(k !== kontrolSayisi) hepsiAyni = false; });
            if (hepsiAyni) {
                return { tip: jokerAdeti === 1 ? "JOKERLİ 4'LÜ" : "4'LÜ", puan: (kontrolSayisi * 4) * kontrolSayisi };
            }
        }

        let ardisikMi = true;
        if (jokerAdeti === 0) {
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                if (normalKartlar[i+1] !== normalKartlar[i] + 1) ardisikMi = false;
            }
            if (ardisikMi) {
                let toplam = normalKartlar.reduce((a, b) => a + b, 0);
                return { tip: "SERİ", puan: toplam * normalKartlar[normalKartlar.length - 1] };
            }
        } else if (jokerAdeti === 1) {
            let bosluklar = [];
            for (let i = 0; i < normalKartlar.length - 1; i++) {
                let fark = normalKartlar[i+1] - normalKartlar[i];
                if (fark > 1) { for(let b = 1; b < fark; b++) bosluklar.push(normalKartlar[i] + b); }
            }
            if (bosluklar.length === 1 && (normalKartlar[2] - normalKartlar[0] === 3)) {
                let tamSeri = [...normalKartlar, bosluklar[0]].sort((a,b)=>a-b);
                return { tip: "JOKERLİ SERİ", puan: tamSeri.reduce((a,b)=>a+b,0) * tamSeri[3] };
            } else if (bosluklar.length === 0 && (normalKartlar[2] - normalKartlar[0] === 2)) {
                let eksikSayi = normalKartlar[2] + 1 > 10 ? normalKartlar[0] - 1 : normalKartlar[2] + 1;
                let tamSeri = [...normalKartlar, eksikSayi].sort((a,b)=>a-b);
                return { tip: "JOKERLİ SERİ", puan: tamSeri.reduce((a,b)=>a+b,0) * tamSeri[3] };
            }
        }
    }
    return { tip: "PAS", puan: 0 };
}

function suAnkiCezayiHesapla(havuz) {
    if (!havuz || havuz.length === 0) return 0; // Hatalı kelime düzeltildi
    return havuz.reduce((toplam, kart) => {
        let val = kart === "JOKER" ? 20 : Number(kart);
        return toplam + (val * 10);
    }, 0);
}

function yerdekiKartiAlDene() {
    if (!yerdekiTeklifKarti || teklifSahibi !== "RAKIP") return;
    
    oyuncuEli.push(yerdekiTeklifKarti);
    document.getElementById("bildirim-alani").innerText = `Rakibin teklif ettiği ${yerdekiTeklifKarti} kartını aldın!`;
    
    yerdekiTeklifKarti = null;
    teklifSahibi = null;
    document.getElementById("teklif-kart-yazi").innerText = "-";
    
    window.arayuzuGuncelle();
}

function rakipHamleYap() {
    while (rakipEli.length < 4 && deste.length > 0) {
        rakipEli.push(deste.pop());
    }

    if (rakipEli.length === 0) return;

    if (yerdekiTeklifKarti !== null && teklifSahibi === "OYUNCU") {
        let testEli = [...rakipEli, yerdekiTeklifKarti];
        let kombinasyonYapiyorMu = false;

        for(let i=0; i<testEli.length; i++) {
            for(let j=i+1; j<testEli.length; j++) {
                for(let k=j+1; k<testEli.length; k++) {
                    for(let l=k+1; l<testEli.length; l++) {
                        if(eliHesapla([testEli[i], testEli[j], testEli[k], testEli[l]]).tip !== "PAS") kombinasyonYapiyorMu = true;
                    }
                }
            }
        }

        if (kombinasyonYapiyorMu || yerdekiTeklifKarti === "JOKER" || Number(yerdekiTeklifKarti) >= 8) {
            rakipEli.push(yerdekiTeklifKarti);
            rakipSonHamleTipi = `Rakip yerdeki ${yerdekiTeklifKarti} kartını eline aldı. Cezan silindi!`;
            yerdekiTeklifKarti = null;
            teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
        } else {
            oyuncuCezaHavuzu.push(yerdekiTeklifKarti);
            yerdekiTeklifKarti = null;
            teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
        }
    }

    if (rakipEli.length >= 4) {
        for (let i = 0; i < rakipEli.length; i++) {
            for (let j = i + 1; j < rakipEli.length; j++) {
                for (let k = j + 1; k < rakipEli.length; k++) {
                    for (let l = k + 1; l < rakipEli.length; l++) {
                        let dortluAdayi = [rakipEli[i], rakipEli[j], rakipEli[k], rakipEli[l]];
                        let analiz4 = eliHesapla(dortluAdayi);
                        if (analiz4.tip !== "PAS") {
                            rakipPuan += analiz4.puan;
                            rakipSonIndirilenler = [...dortluAdayi];
                            rakipSonHamleTipi = `Rakip ${analiz4.tip} yaptı! (+${analiz4.puan} Puan)`;
                            
                            rakipEli = rakipEli.filter((_, idx) => idx !== i && idx !== j && idx !== k && idx !== l);
                            while (rakipEli.length < 4 && deste.length > 0) { rakipEli.push(deste.pop()); }
                            return;
                        }
                    }
                }
            }
        }
    }

    for (let i = 0; i < rakipEli.length; i++) {
        for (let j = i + 1; j < rakipEli.length; j++) {
            let ikili = [rakipEli[i], rakipEli[j]];
            let analiz2 = eliHesapla(ikili);
            if (analiz2.tip !== "PAS") {
                rakipPuan += analiz2.puan;
                rakipSonIndirilenler = [...ikili];
                rakipSonHamleTipi = `Rakip Çift indirdi! (+${analiz2.puan} Puan)`;
                
                rakipEli.splice(j, 1);
                rakipEli.splice(i, 1);
                
                while (rakipEli.length < 4 && deste.length > 0) { rakipEli.push(deste.pop()); }
                return;
            }
        }
    }

    if (rakipEli.length > 0) {
        let enBuyukEndeks = 0;
        let enBuyukDeger = -1;
        rakipEli.forEach((k, idx) => {
            let val = k === "JOKER" ? 0 : Number(k);
            if(val > enBuyukDeger) { enBuyukDeger = val; enBuyukEndeks = idx; }
        });

        yerdekiTeklifKarti = rakipEli.splice(enBuyukEndeks, 1)[0];
        teklifSahibi = "RAKIP";
        rakipSonIndirilenler = [];
        rakipSonHamleTipi = `Rakip pas geçti ve ${yerdekiTeklifKarti} kartını ortaya teklif etti!`;
        document.getElementById("teklif-kart-yazi").innerText = yerdekiTeklifKarti + " (Rakibin Teklifi)";
    }

    while (rakipEli.length < 4 && deste.length > 0) {
        rakipEli.push(deste.pop());
    }
}

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
