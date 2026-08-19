document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const btnSync = document.getElementById('btn-sync-action');

  // Checa se está em uma aba do AVA ou Anhanguera
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const isAva = currentTab && currentTab.url && (
      currentTab.url.includes('avaeduc.com.br') || 
      currentTab.url.includes('anhanguera.com') ||
      currentTab.url.includes('unopar.br')
    );

    if (isAva) {
      statusText.innerHTML = '🟢 <span style="color:#34d399">Portal Acadêmico Detectado</span>';
    } else {
      statusText.innerHTML = '🟡 <span style="color:#fbbf24">Abra o portal do AVA para sincronizar</span>';
    }
  });

  // Ação de sincronização manual pelo popup
  btnSync.addEventListener('click', () => {
    btnSync.disabled = true;
    btnSync.textContent = '🔄 Mapeando matérias...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'SCRAPE_DATA' }, (response) => {
          if (response && response.success) {
            chrome.runtime.sendMessage({
              action: 'SAVE_DISCIPLINAS',
              payload: {
                student: response.student,
                disciplinas: response.disciplinas,
                scrapedAt: new Date().toISOString()
              }
            }, (saveRes) => {
              btnSync.disabled = false;
              btnSync.textContent = '✅ Sincronizado com Sucesso!';
              statusText.innerHTML = `🎉 <strong>${response.disciplinas.length} matérias</strong> sincronizadas!`;
            });
          } else {
            btnSync.disabled = false;
            btnSync.textContent = '⚡ Sincronizar Disciplinas';
            statusText.innerHTML = '⚠️ Vá para a página de disciplinas do AVA e tente novamente.';
          }
        });
      }
  // Ação de auto-concluir atividades que não são questões (Webaula, SCORM, Vídeo)
  const btnComplete = document.getElementById('btn-complete-action');
  btnComplete?.addEventListener('click', () => {
    btnComplete.disabled = true;
    btnComplete.textContent = '🔄 Concluindo...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'AUTO_COMPLETE_ACTIVITY' }, (response) => {
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
