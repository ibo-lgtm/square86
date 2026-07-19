// ==========================================
// SQUARE86 - 4 KART DENGESİ GARANTİLENMİŞ MOTOR
// ==========================================

window.deste = [];
window.oyuncuEli = [];
window.rakipEli = [];
window.oyuncuPuan = 0;
window.rakipPuan = 0;
window.oyuncuCezaHavuzu = [];
window.rakipCezaHavuzu = [];
window.yerdekiTeklifKarti = null; 
window.teklifSahibi = null; 
window.rakipSonIndirilenler = [];
window.rakipSonHamleTipi = "Oyun başladı, senin hamlen bekleniyor...";

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
    window.deste = desteyiKaristir(desteOlustur());
    
    // Oyun başında herkese 4 kart dağıtılır
    window.oyuncuEli = [window.deste.pop(), window.deste.pop(), window.deste.pop(), window.deste.pop()];
    window.rakipEli = [window.deste.pop(), window.deste.pop(), window.deste.pop(), window.deste.pop()];
    
    window.oyuncuPuan = 0;
    window.rakipPuan = 0;
    window.oyuncuCezaHavuzu = [];
    window.rakipCezaHavuzu = [];
    window.yerdekiTeklifKarti = null;
    window.teklifSahibi = null;
    window.rakipSonIndirilenler = [];
    window.rakipSonHamleTipi = "Oyun başladı, hamleni seç.";
}

function eliHesapla(kartlar) {
    if (!kartlar || kartlar.length === 0) return { tip: "PAS", puan: 0 };
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
    if (!havuz || havuz.length === 0) return 0;
    return havuz.reduce((toplam, kart) => {
        let val = kart === "JOKER" ? 20 : Number(kart);
        return toplam + (val * 10);
    }, 0);
}

// Oyuncunun kart almasını sağlayan fonksiyon
function yerdekiKartiAlDene() {
    if (!window.yerdekiTeklifKarti || window.teklifSahibi !== "RAKIP") return;
    
    // Oyuncu kartı alır, eli geçici olarak 5 olur
    window.oyuncuEli.push(window.yerdekiTeklifKarti);
    document.getElementById("bildirim-alani").innerText = `Rakibin teklif ettiği ${window.yerdekiTeklifKarti} kartını aldın! Eli 5 karta çıktı.`;
    
    window.yerdekiTeklifKarti = null;
    window.teklifSahibi = null;
    document.getElementById("teklif-kart-yazi").innerText = "-";
    
    if (typeof window.arayuzuGuncelle === "function") window.arayuzuGuncelle();
}

// OYUNCU KART ATTIĞINDA VEYA PAS GEÇTİĞİNDE ÇALIŞACAK KONTROL DÖNGÜSÜ
// index.html'deki kart atma fonksiyonunun sonuna veya pas butonuna eklenmelidir.
function oyuncuHamle SonuKontrol() {
    // Oyuncu elinden kart çıkarttığı için 4'ün altına düştüyse (yani 3 kaldıysa) desteden çekip 4 yapar.
    // Eğer elinde 5 kart vardı ve 1 tane attıysa (4 kaldıysa) bu döngü çalışmaz ve 4 kartta kalır!
    while (window.oyuncuEli.length < 4 && window.deste.length > 0) {
        window.oyuncuEli.push(window.deste.pop());
    }
    if (typeof window.arayuzuGuncelle === "function") window.arayuzuGuncelle();
}
window.oyuncuHamleSonuKontrol = oyuncuHamleSonuKontrol;


function rakipHamleYap() {
    // Botun eli de asla 4'ün altına (3'e) düşemez. Eksikse tura başlamadan tamamlar.
    while (window.rakipEli.length < 4 && window.deste.length > 0) {
        window.rakipEli.push(window.deste.pop());
    }

    if (window.rakipEli.length === 0) return;

    // RAKİP YERDEKİ KARTI DEĞERLENDİRİYOR
    if (window.yerdekiTeklifKarti !== null && window.teklifSahibi === "OYUNCU") {
        let testEli = [...window.rakipEli, window.yerdekiTeklifKarti];
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

        // Eğer işine yarıyorsa rakip kartı kapar (Eli geçici olarak 5 olur)
        if (kombinasyonYapiyorMu || window.yerdekiTeklifKarti === "JOKER" || Number(window.yerdekiTeklifKarti) >= 8) {
            window.rakipEli.push(window.yerdekiTeklifKarti);
            window.rakipSonHamleTipi = `Rakip yerdeki ${window.yerdekiTeklifKarti} kartını eline aldı. Cezan silindi!`;
            window.yerdekiTeklifKarti = null;
            window.teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
        } else {
            window.oyuncuCezaHavuzu.push(window.yerdekiTeklifKarti);
            window.yerdekiTeklifKarti = null;
            window.teklifSahibi = null;
            document.getElementById("teklif-kart-yazi").innerText = "-";
        }
    }

    // RAKİP KOMBİNASYON İNDİRME AŞAMASI
    if (window.rakipEli.length >= 4) {
        for (let i = 0; i < window.rakipEli.length; i++) {
            for (let j = i + 1; j < window.rakipEli.length; j++) {
                for (let k = j + 1; k < window.rakipEli.length; k++) {
                    for (let l = k + 1; l < window.rakipEli.length; l++) {
                        let dortluAdayi = [window.rakipEli[i], window.rakipEli[j], window.rakipEli[k], window.rakipEli[l]];
                        let analiz4 = eliHesapla(dortluAdayi);
                        if (analiz4.tip !== "PAS") {
                            window.rakipPuan += analiz4.puan;
                            window.rakipSonIndirilenler = [...dortluAdayi];
                            window.rakipSonHamleTipi = `Rakip ${analiz4.tip} yaptı! (+${analiz4.puan} Puan)`;
                            
                            window.rakipEli = window.rakipEli.filter((_, idx) => idx !== i && idx !== j && idx !== k && idx !== l);
                            
                            // Kart indirip eli boşaldığı için hemen 4'e tamamlıyoruz
                            while (window.rakipEli.length < 4 && window.deste.length > 0) { window.rakipEli.push(window.deste.pop()); }
                            return;
                        }
                    }
                }
            }
        }
    }

    if (window.rakipEli.length >= 2) {
        for (let i = 0; i < window.rakipEli.length; i++) {
            for (let j = i + 1; j < window.rakipEli.length; j++) {
                let ikili = [window.rakipEli[i], window.rakipEli[j]];
                let analiz2 = eliHesapla(ikili);
                if (analiz2.tip !== "PAS") {
                    window.rakipPuan += analiz2.puan;
                    window.rakipSonIndirilenler = [...ikili];
                    window.rakipSonHamleTipi = `Rakip Çift indirdi! (+${analiz2.puan} Puan)`;
                    
                    window.rakipEli.splice(j, 1);
                    window.rakipEli.splice(i, 1);
                    
                    // Çift indirdiğinde el 4'ün altına düşeceği için 4'e tamamlıyoruz
                    while (window.rakipEli.length < 4 && window.deste.length > 0) { window.rakipEli.push(window.deste.pop()); }
                    return;
                }
            }
        }
    }

    // RAKİP PAS GEÇİYOR / KART TEKLİF EDİYOR
    if (window.rakipEli.length > 0) {
        let enBuyukEndeks = 0;
        let enBuyukDeger = -1;
        window.rakipEli.forEach((k, idx) => {
            let val = k === "JOKER" ? 0 : Number(k);
            if(val > enBuyukDeger) { enBuyukDeger = val; enBuyukEndeks = idx; }
        });

        window.yerdekiTeklifKarti = window.rakipEli.splice(enBuyukEndeks, 1)[0];
        window.teklifSahibi = "RAKIP";
        window.rakipSonIndirilenler = [];
        window.rakipSonHamleTipi = `Rakip pas geçti ve ${window.yerdekiTeklifKarti} kartını ortaya teklif etti!`;
        document.getElementById("teklif-kart-yazi").innerText = window.yerdekiTeklifKarti + " (Rakibin Teklifi)";
    }

    // KRİTİK DENGELİYİCİ: 
    // Eğer bot tur başında yerdeki kartı ALDIYSA eli 5'ti. Pas geçip 1 kart atınca eli 4 kaldı. Bu döngü çalışmaz (kart çekmez).
    // Eğer bot tur başında yerdeki kartı ALMADIYSA eli 4'tü. Pas geçip 1 kart atınca eli 3'e düştü. O zaman bu döngü çalışır ve elini 4 yapar!
    while (window.rakipEli.length < 4 && window.deste.length > 0) {
        window.rakipEli.push(window.deste.pop());
    }

    if (window.deste.length === 0) { oyunBitti(); }
}

function oyunBitti() {
    window.oyuncuEli.forEach(k => window.oyuncuCezaHavuzu.push(k));
    window.rakipEli.forEach(k => window.rakipCezaHavuzu.push(k));
    
    let oyuncuNetCeza = suAnkiCezayiHesapla(window.oyuncuCezaHavuzu);
    let rakipNetCeza = suAnkiCezayiHesapla(window.rakipCezaHavuzu);
    
    let oyuncuFinalSkor = window.oyuncuPuan - oyuncuNetCeza;
    let rakipFinalSkor = window.rakipPuan - rakipNetCeza;

    let sonucMesaji = `=== OYUN BİTTİ ===\n\n`;
    sonucMesaji += `SENİN NET SKORUN: ${oyuncuFinalSkor}\n(Kombinasyon: +${window.oyuncuPuan} | Ceza: -${oyuncuNetCeza})\n\n`;
    sonucMesaji += `RAKİBİN NET SKORUN: ${rakipFinalSkor}\n(Kombinasyon: +${window.rakipPuan} | Ceza: -${rakipNetCeza})\n\n`;

    if (oyuncuFinalSkor > rakipFinalSkor) { sonucMesaji += "🎉 TEBRİKLER! OYUNU KAZANDIN! 🎉"; }
    else if (oyuncuFinalSkor < rakipFinalSkor) { sonucMesaji += "❌ MAALESEF RAKİP KAZANDI! ❌"; }
    else { sonucMesaji += "🤝 BERABERE BİTTİ! 🤝"; }

    alert(sonucMesaji);
}

window.oyunuBaslat = oyunuBaslat;
window.eliHesapla = eliHesapla;
window.suAnkiCezayiHesapla = suAnkiCezayiHesapla;
window.yerdekiKartiAlDene = yerdekiKartiAlDene;
window.rakipHamleYap = rakipHamleYap;
window.oyunBitti = oyunBitti;
