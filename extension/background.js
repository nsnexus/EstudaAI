/**
 * EstudaAI Background Service Worker
 * Responsável por: salvar dados, rotear comandos de automação do painel para o AVA
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ EstudaAI Extension instalada com sucesso!');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ============================================================
  // SALVAR DISCIPLINAS SINCRONIZADAS DO AVA
  // ============================================================
  if (request.action === 'SAVE_DISCIPLINAS') {
    const data = request.payload;
    chrome.storage.local.set({
      estudaai_student: data.student,
      estudaai_disciplinas: data.disciplinas,
      estudaai_last_sync: data.scrapedAt
    }, () => {
      console.log('✅ Dados do AVA salvos:', data.disciplinas?.length, 'matérias');

      // Envia dados em tempo real para o painel web aberto
      chrome.tabs.query({
        url: [
          'https://estudaai.pages.dev/*',
          'http://localhost:3000/*',
          'http://localhost:3001/*',
          'http://localhost:3002/*',
          'http://localhost:3003/*',
          'http://127.0.0.1:3000/*'
        ]
      }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'INJECT_SYNCED_DATA',
              payload: data
            }).catch(() => {});
          }
        });
      });

      sendResponse({ success: true, count: data.disciplinas?.length || 0 });
    });
    return true;
  }

  // ============================================================
  // GET DADOS SALVOS
  // ============================================================
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

  // ============================================================
  // EXECUTAR AUTOMAÇÃO REAL NO AVA (chamado pelo painel web)
  // Encontra a aba do AVA aberta e injeta o comando
  // ============================================================
  if (request.action === 'AUTOPILOT_EXECUTE') {
    const { task, disciplinaId, disciplinaNome } = request.payload;

    // Procura aba do AVA aberta
    chrome.tabs.query({
      url: [
        'https://*.avaeduc.com.br/*',
        'https://*.colaboraread.com.br/*',
        'https://*.anhanguera.com/*',
        'https://*.kroton.com.br/*',
        'https://*.unopar.com.br/*',
        'https://*.pitagoras.com.br/*'
      ]
    }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({
          success: false,
          error: 'Nenhuma aba do portal AVA/Anhanguera encontrada. Abra o portal primeiro.'
        });
        return;
      }

      const avaTab = tabs[0];

      // Injeta content.js caso não esteja rodando
      chrome.scripting.executeScript({
        target: { tabId: avaTab.id },
        files: ['content.js']
      }, () => {
        // Manda o comando para o content script na aba do AVA
        chrome.tabs.sendMessage(avaTab.id, {
          action: 'AUTOPILOT_EXECUTE',
          task: task,
          disciplinaId: disciplinaId,
          disciplinaNome: disciplinaNome
        }, (response) => {
          sendResponse(response || { success: true, started: true });
        });
      });
    });
    return true;
  }

  // ============================================================
  // ABRIR ABA DO AVA E EXECUTAR AUTOMAÇÃO NA URL CERTA
  // ============================================================
  if (request.action === 'AUTOPILOT_OPEN_AND_EXECUTE') {
    const { url, task } = request.payload;

    chrome.tabs.create({ url: url, active: false }, (tab) => {
      // Aguarda a aba carregar antes de injetar
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }, () => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'AUTOPILOT_EXECUTE',
                task: task
              });
            });
          }, 1500);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }
});
