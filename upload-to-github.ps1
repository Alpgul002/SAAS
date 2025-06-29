# GitHub Upload Script
Write-Host "🚀 GitHub'a yükleniyor..." -ForegroundColor Green

# Git komutlarını çalıştır
try {
    # Git repository'sini başlat
    Write-Host "📁 Git repository'si başlatılıyor..." -ForegroundColor Yellow
    & "C:\Program Files\Git\bin\git.exe" init
    
    # Tüm dosyaları ekle
    Write-Host "📦 Dosyalar ekleniyor..." -ForegroundColor Yellow
    & "C:\Program Files\Git\bin\git.exe" add .
    
    # İlk commit
    Write-Host "💾 İlk commit yapılıyor..." -ForegroundColor Yellow
    & "C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: SaaS Chatbot Platform"
    
    # Remote repository ekle
    Write-Host "🔗 Remote repository ekleniyor..." -ForegroundColor Yellow
    & "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/Alpgul002/SAAS.git
    
    # Main branch'e push et
    Write-Host "⬆️ GitHub'a yükleniyor..." -ForegroundColor Yellow
    & "C:\Program Files\Git\bin\git.exe" branch -M main
    & "C:\Program Files\Git\bin\git.exe" push -u origin main
    
    Write-Host "✅ Başarıyla GitHub'a yüklendi!" -ForegroundColor Green
    Write-Host "🌐 https://github.com/Alpgul002/SAAS" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Hata oluştu: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Manuel olarak yüklemeyi deneyin:" -ForegroundColor Yellow
    Write-Host "1. https://github.com/Alpgul002/SAAS adresine gidin" -ForegroundColor White
    Write-Host "2. 'Add file' → 'Upload files' tıklayın" -ForegroundColor White
    Write-Host "3. Tüm dosyaları sürükleyip bırakın" -ForegroundColor White
}

Write-Host "`n⏸️ Devam etmek için bir tuşa basın..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 