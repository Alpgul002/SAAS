# n8n Demo Chatbot Workflow Kurulum Rehberi

## 1. n8n'e Giriş
- n8n'i açın (genellikle http://localhost:5678)
- Yeni bir workflow oluşturun

## 2. Webhook Node'u Ekleme
1. **Webhook Node** ekleyin
2. **HTTP Method**: POST
3. **Path**: `/webhook/demo-chat`
4. **Response Mode**: "Respond to Webhook"
5. **Authentication**: None (demo için)

## 3. ChatGPT Node'u Ekleme
1. **OpenAI Node** ekleyin
2. **Operation**: "Chat"
3. **Model**: "gpt-3.5-turbo"
4. **Messages**: 
   ```
   [
     {
       "role": "system",
       "content": "Sen yardımcı bir demo chatbot'sun. Kısa ve net cevaplar ver. Türkçe konuş."
     },
     {
       "role": "user", 
       "content": "{{ $json.message }}"
     }
   ]
   ```

## 4. Response Node'u Ekleme
1. **Respond to Webhook Node** ekleyin
2. **Response Body**:
   ```json
   {
     "reply": "{{ $node['OpenAI'].json.choices[0].message.content }}"
   }
   ```

## 5. Node'ları Bağlama
- Webhook → OpenAI → Respond to Webhook

## 6. Workflow'u Aktifleştirme
- "Active" toggle'ını açın
- Webhook URL'ini kopyalayın

## 7. Backend'e URL Ekleme
Backend `.env` dosyasına ekleyin:
```
N8N_URL=http://localhost:5678
```

## 8. Test Etme
1. Frontend'i açın
2. Sağ alt köşedeki chat butonuna tıklayın
3. Mesaj gönderin
4. ChatGPT'den cevap alın

## Önemli Notlar
- OpenAI API key'inizi n8n'de ayarlayın
- Workflow'u aktif tutun
- Rate limiting backend'de yapılıyor (5 mesaj/saat)
- Demo için ücretsiz kullanım

## Hata Ayıklama
- n8n loglarını kontrol edin
- Backend loglarını kontrol edin
- Network tab'ında istekleri inceleyin 