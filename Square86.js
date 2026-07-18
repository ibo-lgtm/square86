// SQUARE86 - OYUN MOTORU TEMELİ
let deste = [];
let oyuncuEli = [];
let rakipEli = [];
let oyuncuPuan = 0;
let rakipPuan = 0;

// Pas geçildiğinde biriken gizli ceza havuzları
let oyuncuCezaHavuzu = [];
let rakipCezaHavuzu = [];

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
    
    // Joker kartını ekliyoruz
    yeniDeste.push("JOKER");
    return yeniDeste;
}

// 2. DESTEYİ KARIŞTIRMA (Rastgele Dağılım)
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
    
    // Kart dağıtımı (Elde hep 4 kart olacak)
    oyuncuEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    rakipEli = [deste.pop(), deste.pop(), deste.pop(), deste.pop()];
    
    oyuncuPuan = 0;
    rakipPuan = 0;
    oyuncuCezaHavuzu = [];
    rakipCezaHavuzu = [];

    alert("Square86 Başladı! Kartlar Dağıtıldı.");
}

// Oyunu tetikle
oyunuBaslat();

// 4. ELDEKİ PUANLARI HESAPLAMA SİHİRBAZI
function eliHesapla(el) {
    // Önce eli küçükten büyüğe sıralayalım (Seri kontrolü için kolaylık sağlar)
    // Joker'i şimdilik ayırıyoruz
    let normalKartlar = el.filter(k => k !== "JOKER").sort((a, b) => a - b);
    let jokerAdeti = el.filter(k => k === "JOKER").length;

    // Eğer el tamamen normalse veya Joker varsa olası en yüksek kombinasyonu bulacağız
    // 4'lü Seri Kontrolü (Sadece 4 kartla olur)
    if (jokerAdeti === 0) {
        // Joker yoksa ardışık mı diye bak
        if (normalKartlar[1] === normalKartlar[0]+1 && 
            normalKartlar[2] === normalKartlar[1]+1 && 
            normalKartlar[3] === normalKartlar[2]+1) {
            let toplam = normalKartlar.reduce((a, b) => a + b, 0);
            let enBuyuk = normalKartlar[3];
            return { tip: "SERI", puan: toplam * enBuyuk };
        }
    } else if (jokerAdeti === 1) {
        // 1 Joker varsa, eksik olan sayıyı bulup seriyi tamamlayabilir miyiz?
        // Olası tüm 4'lü serileri simüle edip en yüksek puanı buluyoruz
        let enYuksekSeriPuani = 0;
        for (let i = 1; i <= 7; i++) { // En fazla 7-8-9-10 serisi olabilir
            let hedefSeri = [i, i+1, i+2, i+3];
            // Elimizdeki 3 kart bu serinin içinde var mı kontrol et
            let eslesme = normalKartlar.filter(k => hedefSeri.includes(k));
            // Eğer elimizdeki 3 farklı kart da bu seride varsa Joker eksik olanı tamamlar
            if (eslesme.length === 3 && new Set(normalKartlar).size === 3) {
                let toplam = hedefSeri.reduce((a, b) => a + b, 0);
                let puan = toplam * hedefSeri[3];
                if (puan > enYuksekSeriPuani) enYuksekSeriPuani = puan;
            }
        }
        if (enYuksekSeriPuani > 0) return { tip: "SERI(JOKERLI)", puan: enYuksekSeriPuani };
    }

    // Kartların kaçar adet olduğunu sayalım (Çift ve 4'lü kontrolü için)
    let kartSayilari = {};
    normalKartlar.forEach(k => kartSayilari[k] = (kartSayilari[k] || 0) + 1);

    // 4'lü Kontrolü
    for (let sayi in kartSayilari) {
        let adet = kartSayilari[sayi];
        if (adet === 4 || (adet === 3 && jokerAdeti === 1)) {
            let s = Number(sayi);
            return { tip: "4LU", puan: (s * 4) * s };
        }
    }

    // Çift Kontrolü
    let enYuksekCiftPuani = 0;
    for (let sayi in kartSayilari) {
        let adet = kartSayilari[sayi];
        if (adet >= 2 || (adet === 1 && jokerAdeti === 1)) {
            let s = Number(sayi);
            let ciftPuan = s * s;
            if (ciftPuan > enYuksekCiftPuani) enYuksekCiftPuani = ciftPuan;
        }
    }

    if (enYuksekCiftPuani > 0) return { tip: "CIFT", puan: enYuksekCiftPuani };

    // Hiçbir kombinasyon yoksa pas geçilmek zorunda
    return { tip: "PAS", puan: 0 };
}

// 5. OYUNCU HAMLE YAPMA FONKSİYONU
// Kombinasyon varsa yer indirir (tip: "CIFT", "4LU", "SERI"), yoksa pas geçer (tip: "PAS")
function oyuncuHamleYap(secilenTip) {
    let analiz = eliHesapla(oyuncuEli);

    // Oyuncu pas geçmek istiyorsa
    if (secilenTip === "PAS") {
        if (deste.length === 0) {
            alert("Deste bitti, pas geçemezsin! Oyun sonlandırılıyor.");
            oyunBitti();
            return;
        }
        
        // Elinden rastgele veya seçtiği bir kartı ceza havuzuna atacak (Şimdilik ilk kartı atalım)
        let atilanKart = oyuncuEli.splice(0, 1)[0];
        oyuncuCezaHavuzu.push(atilanKart);
        
        // Desteden yeni kart çekerek elini 4'e tamamlar
        oyuncuEli.push(deste.pop());
        
        alert("Pas geçtin! Yere kapalı bir kart attın ve yeni kart çektin.");
        
    } else {
        // Oyuncu kombinasyon indirmek istiyorsa
        if (analiz.tip === "PAS") {
            alert("Elinde geçerli bir kombinasyon yok! Pas geçmelisin.");
            return;
        }
        
        if (analiz.tip.includes(secilenTip) || secilenTip === "ANY") {
            oyuncuPuan += analiz.puan;
            alert(`Tebrikler! ${analiz.tip} indirdin ve +${analiz.puan} puan kazandın!`);
            
            // Kartlar oyundan çıkıyor. Eli tamamen boşaltıp desteden 4 yeni kart çekiyoruz.
            oyuncuEli = [];
            for (let i = 0; i < 4; i++) {
                if (deste.length > 0) oyuncuEli.push(deste.pop());
            }
        }
    }

    // Her hamleden sonra desteyi kontrol et, bittiyse oyunu bitir
    if (deste.length === 0 && oyuncuEli.length === 0) {
        oyunBitti();
    } else {
        // Sıra bota (rakibe) geçiyor
        setTimeout(rakipHamleYap, 1000); // 1 saniye sonra rakip oynasın
    }
}

// 6. RAKİP YAPAY ZEKASI (BOT HAMLESİ)
function rakipHamleYap() {
    if (deste.length === 0 && rakipEli.length === 0) return;

    let analiz = eliHesapla(rakipEli);

    if (analiz.tip !== "PAS") {
        // Botun elinde kombinasyon varsa hemen indirir
        rakipPuan += analiz.puan;
        console.log(`Rakip ${analiz.tip} indirdi ve +${analiz.puan} puan kazandı!`);
        
        rakipEli = [];
        for (let i = 0; i < 4; i++) {
            if (deste.length > 0) rakipEli.push(deste.pop());
        }
    } else {
        // Kombinasyon yoksa pas geçer, elinden bir kartı ceza havuzuna atar
        if (deste.length > 0) {
            let atilanKart = rakipEli.splice(0, 1)[0];
            rakipCezaHavuzu.push(atilanKart);
            rakipEli.push(deste.pop());
            console.log("Rakip pas geçti, yere kapalı kart attı.");
        }
    }

    if (deste.length === 0) {
        oyunBitti();
    }
}

// 7. OYUN BİTİŞİ VE CEZA HESAPLAMA (Final Sahnesi)
function oyunBitti() {
    // Tasarladığın ceza kuralı: Atılan sayıların toplamının 10 katı ceza puanı olur.
    // Joker kartı ceza havuzuna atıldıysa 0 puan sayıyoruz (ceza vermesin diye)
    let oyuncuCezasi = oyuncuCezaHavuzu.reduce((toplam, kart) => {
        return toplam + (kart === "JOKER" ? 0 : kart * 10);
    }, 0);

    let rakipCezasi = rakipCezaHavuzu.reduce((toplam, kart) => {
        return toplam + (kart === "JOKER" ? 0 : kart * 10);
    }, 0);

    // Toplam puanlardan cezaları düşüyoruz
    let finalOyuncuPuan = oyuncuPuan - oyuncuCezasi;
    let finalRakipPuan = rakipPuan - rakipCezasi;

    let sonucMesaji = `Oyun Bitti!\n\n` +
                      `Senin Hamle Puanın: ${oyuncuPuan} | Yediğin Ceza: -${oyuncuCezasi} | Toplam: ${finalOyuncuPuan}\n` +
                      `Rakip Hamle Puanın: ${rakipPuan} | Yediğin Ceza: -${rakipCezasi} | Toplam: ${finalRakipPuan}\n\n`;

    if (finalOyuncuPuan > finalRakipPuan) {
        sonucMesaji += "🎉 TEBRİKLER, KAZANDIN! 🎉";
    } else if (finalOyuncuPuan < finalRakipPuan) {
        sonucMesaji += "❌ RAKİP KAZANDI! ❌";
    } else {
        sonucMesaji += "🤝 BERABERE! 🤝";
    }

    alert(sonucMesaji);
}
