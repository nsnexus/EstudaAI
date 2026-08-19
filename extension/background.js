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
  // ============================================================
  if (request.action === 'AUTOPILOT_EXECUTE') {
    const { task, disciplinaId, disciplinaNome, url, disciplinasPendentes } = request.payload;

    // Lógica 100% Autônoma: Múltiplas disciplinas
    if (task === 'complete_all' && disciplinasPendentes && disciplinasPendentes.length > 0) {
      executeAllAutonomous(disciplinasPendentes, sendResponse);
      return true; // Keep message channel open
    }

    // Lógica 100% Autônoma: Disciplina única
    if (task === 'complete_discipline' && url) {
      executeDisciplineAutonomous(url, disciplinaNome, sendResponse);
      return true; // Keep message channel open
    }

    // Fallback original: Procura aba do AVA aberta
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
      chrome.scripting.executeScript({
        target: { tabId: avaTab.id },
        files: ['content.js']
      }, () => {
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

// Helper: Executa uma disciplina em aba temporária e depois fecha
function executeDisciplineAutonomous(url, disciplinaNome, sendResponse) {
  chrome.tabs.create({ url: url, active: false }, (tab) => {
    const listener = (tabId, changeInfo) => {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Dá um pequeno tempo para a página terminar renderização JS pesada
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }, () => {
            // Envia o comando
            chrome.tabs.sendMessage(tab.id, {
              action: 'AUTOPILOT_EXECUTE',
              task: 'complete_discipline',
              disciplinaNome: disciplinaNome
            }, (response) => {
              // Resposta recebida, fecha a aba e responde pro EstudaAI
              chrome.tabs.remove(tab.id);
              sendResponse(response || { success: true, concluidas: 0, total: 0 });
            });
          });
        }, 2000);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Helper: Executa um array de disciplinas sequencialmente
async function executeAllAutonomous(disciplinasPendentes, sendResponse) {
  let totalConcluidas = 0;
  let totalAtividades = 0;

  for (const disc of disciplinasPendentes) {
    if (!disc.url) continue;
    
    // Aguarda a promessa da execução de cada disciplina
    const result = await new Promise((resolve) => {
      executeDisciplineAutonomous(disc.url, disc.nome, resolve);
    });

    if (result && result.success) {
      totalConcluidas += result.concluidas || 0;
      totalAtividades += result.total || 0;
    }
    
    // Pequeno delay entre disciplinas
    await new Promise(r => setTimeout(r, 1000));
  }

  sendResponse({ success: true, concluidas: totalConcluidas, total: totalAtividades });
}
