document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const btnSync = document.getElementById('btn-sync-action');
  const btnComplete = document.getElementById('btn-complete-action');

  // Checa se está em uma aba de portal acadêmico
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs && tabs[0];
    const url = (currentTab && currentTab.url) || '';

    const isEduPortal = url.includes('avaeduc') ||
                        url.includes('colaboraread') ||
                        url.includes('anhanguera') ||
                        url.includes('kroton') ||
                        url.includes('unopar') ||
                        url.includes('pitagoras') ||
                        url.includes('ampli') ||
                        url.includes('moodle');

    const isInsideDiscipline = url.includes('course/view.php');

    if (isEduPortal) {
      statusText.innerHTML = '🟢 <span style="color:#34d399">Painel Acadêmico Detectado</span>';
    } else {
      statusText.innerHTML = '🟡 <span style="color:#fbbf24">Abra a página do AVA/Portal</span>';
    }
  });

  // Mostra a última sincronização
  chrome.storage.local.get(['estudaai_last_sync'], (res) => {
    const lastSyncEl = document.getElementById('last-sync-text');
    if (lastSyncEl && res.estudaai_last_sync) {
      const d = new Date(res.estudaai_last_sync);
      lastSyncEl.innerHTML = `🗓️ ${d.toLocaleDateString()} às ${d.toLocaleTimeString()}`;
    }
  });

  // Função auxiliar para enviar mensagem ou injetar content script se necessário
  function sendMsgWithFallback(tabId, message, callback) {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Injeta o content script em tempo de execução e tenta novamente
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }, () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, message, (retryRes) => {
              callback(retryRes);
            });
          }, 300);
        });
      } else {
        callback(response);
      }
    });
  }

  // Ação de sincronização manual pelo popup
  btnSync?.addEventListener('click', () => {
    btnSync.disabled = true;
    btnSync.textContent = '🔄 Mapeando matérias...';
    statusText.innerHTML = '🔄 <span style="color:#38bdf8">Lendo disciplinas do portal...</span>';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (!activeTab || !activeTab.id) {
        btnSync.disabled = false;
        btnSync.textContent = '⚡ Sincronizar Disciplinas';
        statusText.innerHTML = '⚠️ Nenhuma aba ativa encontrada.';
        return;
      }

      sendMsgWithFallback(activeTab.id, { action: 'SCRAPE_DATA' }, (response) => {
        if (response && response.success && response.disciplinas && response.disciplinas.length > 0) {
          chrome.runtime.sendMessage({
            action: 'SAVE_DISCIPLINAS',
            payload: {
              student: response.student,
              disciplinas: response.disciplinas,
              scrapedAt: new Date().toISOString()
            }
          }, () => {
            btnSync.disabled = false;
            btnSync.textContent = '✅ Sincronizado com Sucesso!';
            statusText.innerHTML = `🎉 <strong>${response.disciplinas.length} matérias</strong> sincronizadas!`;
            
            // Atualiza o campo visualmente na hora
            const d = new Date();
            const lastSyncEl = document.getElementById('last-sync-text');
            if (lastSyncEl) lastSyncEl.innerHTML = `🗓️ ${d.toLocaleDateString()} às ${d.toLocaleTimeString()}`;
          });
        } else {
          btnSync.disabled = false;
          btnSync.textContent = '⚡ Sincronizar Disciplinas';
          statusText.innerHTML = '⚠️ Acesse a página com suas matérias no AVA e tente de novo.';
        }
      });
    });
  });

  // Ação de auto-concluir atividades que não são questões (Webaula, SCORM, Vídeo)
  btnComplete?.addEventListener('click', () => {
    btnComplete.disabled = true;
    btnComplete.textContent = '🔄 Concluindo...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && activeTab.id) {
        sendMsgWithFallback(activeTab.id, { action: 'AUTO_COMPLETE_ACTIVITY' }, () => {
          btnComplete.disabled = false;
          btnComplete.textContent = '✅ Atividade Concluída!';
          statusText.innerHTML = '🎉 <span style="color:#34d399">Webaula/Vídeo computado no AVA!</span>';
          setTimeout(() => {
            btnComplete.textContent = '🎬 Auto-Concluir Webaula / Vídeo';
          }, 3000);
        });
      }
    });
  });
});
