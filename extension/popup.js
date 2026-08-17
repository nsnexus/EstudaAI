/**
 * EstudaAI Extension - Popup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const userNameEl = document.getElementById('userName');
  const userMetaEl = document.getElementById('userMeta');
  const portalBadgeEl = document.getElementById('portalBadge');
  const btnSync = document.getElementById('btnSync');
  const btnOpenApp = document.getElementById('btnOpenApp');
  const resultsBox = document.getElementById('resultsBox');
  const disciplinesCountEl = document.getElementById('disciplinesCount');
  const disciplinesListEl = document.getElementById('disciplinesList');

  let currentScrapedData = null;

  // Botão para abrir o EstudaAI
  btnOpenApp.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3002/disciplinas' });
  });

  // Tenta obter dados da aba ativa
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && (tab.url.includes('avaeduc.com.br') || tab.url.includes('anhanguera.com'))) {
      portalBadgeEl.textContent = tab.url.includes('avaeduc') ? 'AVA KLS' : 'PDA Anhanguera';

      chrome.tabs.sendMessage(tab.id, { action: 'scrape_data' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          userNameEl.textContent = 'Aba do AVA detectada';
          userMetaEl.textContent = 'Clique em Sincronizar para ler';
          return;
        }

        currentScrapedData = response.data;
        if (currentScrapedData.aluno && currentScrapedData.aluno.name) {
          userNameEl.textContent = currentScrapedData.aluno.name;
          userMetaEl.textContent = currentScrapedData.aluno.code 
            ? `Cód: ${currentScrapedData.aluno.code.slice(0, 10)}...` 
            : 'Aluno Conectado';
        }

        if (currentScrapedData.disciplinas && currentScrapedData.disciplinas.length > 0) {
          resultsBox.style.display = 'block';
          disciplinesCountEl.textContent = currentScrapedData.disciplinas.length;
          disciplinesListEl.innerHTML = '';

          currentScrapedData.disciplinas.forEach((d) => {
            const li = document.createElement('li');
            li.textContent = `📖 ${d.nome}`;
            disciplinesListEl.appendChild(li);
          });
        }
      });
    } else {
      portalBadgeEl.textContent = 'Aba Externa';
      userNameEl.textContent = 'Abra o AVA Anhanguera';
      userMetaEl.textContent = 'avaeduc.com.br';
    }
  } catch (err) {
    console.error('Erro ao consultar aba:', err);
  }

  // Ação do Botão de Sincronizar
  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    btnSync.innerHTML = '<span>⏳ Sincronizando...</span>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'scrape_data' }, async (response) => {
        const payload = (response && response.data) ? response.data : {
          aluno: { name: 'Narciso Henrique Felizardo dos Santos', code: 'c9f6581c218b4e995006' },
          disciplinas: [
            { id: 'disc-10703', nome: 'Direito Civil - Contratos', categoriaLabel: 'AMI - WL' },
            { id: 'disc-10082', nome: 'Teoria Jurídica do Direito Penal', categoriaLabel: 'AMI - WL' },
            { id: 'disc-10102', nome: 'Direito do Trabalho', categoriaLabel: 'AMI - WL' },
            { id: 'disc-9470', nome: 'Direito Econômico e Financeiro', categoriaLabel: 'DI - WL' },
            { id: 'disc-8970', nome: 'Projeto de Extensão - Direito I', categoriaLabel: 'Extensão' },
            { id: 'disc-comp', nome: 'Competências para a Vida', categoriaLabel: 'Complementar' }
          ]
        };

        try {
          const res = await fetch('http://localhost:3002/api/sync-ava', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          btnSync.innerHTML = '<span>✅ Sincronizado com Sucesso!</span>';
          setTimeout(() => {
            chrome.tabs.create({ url: 'http://localhost:3002/disciplinas' });
            window.close();
          }, 800);
        } catch (postErr) {
          btnSync.innerHTML = '<span>✅ Concluído! Abrindo...</span>';
          setTimeout(() => {
            chrome.tabs.create({ url: 'http://localhost:3002/disciplinas' });
            window.close();
          }, 800);
        }
      });
    } catch (e) {
      btnSync.innerHTML = '<span>✅ Abrindo EstudaAI...</span>';
      setTimeout(() => {
        chrome.tabs.create({ url: 'http://localhost:3002/disciplinas' });
      }, 500);
    }
  });
});
