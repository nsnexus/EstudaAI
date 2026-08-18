/**
 * EstudaAI Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ EstudaAI Extension instalada com sucesso!');
});

// Manipula mensagens entre content scripts e popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_DISCIPLINAS') {
    const data = request.payload;

    // Salva no storage compartilhado da extensão
    chrome.storage.local.set({ 
      estudaai_student: data.student,
      estudaai_disciplinas: data.disciplinas,
      estudaai_last_sync: data.scrapedAt
    }, () => {
      console.log('Dados do AVA salvos com sucesso na extensão:', data);
      
      // Procura abas abertas do EstudaAI para enviar os dados em tempo real
      chrome.tabs.query({ url: ['https://estudaai.pages.dev/*', 'http://localhost:3000/*'] }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'INJECT_SYNCED_DATA',
              payload: data
            }).catch(() => {});
          }
        });
      });

      sendResponse({ success: true, count: data.disciplinas.length });
    });

    return true; // Mantém o canal de resposta assíncrono aberto
  }

  if (request.action === 'GET_SAVED_DATA') {
    chrome.storage.local.get(['estudaai_student', 'estudaai_disciplinas', 'estudaai_last_sync'], (res) => {
      sendResponse({
        student: res.estudaai_student || null,
        disciplinas: res.estudaai_disciplinas || [],
        lastSync: res.estudaai_last_sync || null
      });
    });
    return true;
  }
});
