/**
 * EstudaAI Bridge - Conecta o painel web com a extensão Chrome
 * 
 * Responsabilidades:
 * 1. Injeta dados sincronizados do AVA no localStorage do painel web
 * 2. Escuta comandos de Auto-Pilot do painel e os encaminha para o AVA via extensão
 * 3. Mantém dados sincronizados em ambas as direções
 */

(function () {
  console.log('🔗 EstudaAI Bridge conectado à plataforma!');

  // ============================================================
  // 1. INJETAR DADOS DO AVA AO CARREGAR O PAINEL
  // ============================================================
  chrome.storage.local.get(['estudaai_student', 'estudaai_disciplinas'], (res) => {
    if (res.estudaai_disciplinas && res.estudaai_disciplinas.length > 0) {
      try {
        localStorage.setItem('estudaai_disciplinas', JSON.stringify(res.estudaai_disciplinas));
        if (res.estudaai_student) {
          const currentUser = {
            id: `user-${Date.now()}`,
            name: res.estudaai_student.name,
            email: `${res.estudaai_student.name.toLowerCase().replace(/\s+/g, '.')}@aluno.anhanguera.edu.br`,
            role: 'aluno',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            course: 'Direito',
            semester: 5,
            studyGoalMinutes: 60,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('estudaai_current_user', JSON.stringify(currentUser));
        }
        window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
        window.dispatchEvent(new Event('estudaai_auth_changed'));
        console.log('✅ Dados da extensão injetados no EstudaAI com sucesso!');
      } catch (e) {
        console.error('Erro ao injetar dados:', e);
      }
    }
  });

  // ============================================================
  // 2. ESCUTAR NOVAS SINCRONIZAÇÕES EM TEMPO REAL
  // ============================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'INJECT_SYNCED_DATA') {
      const { student, disciplinas } = request.payload;
      try {
        localStorage.setItem('estudaai_disciplinas', JSON.stringify(disciplinas));
        if (student) {
          const currentUser = {
            id: `user-${Date.now()}`,
            name: student.name,
            email: `${student.name.toLowerCase().replace(/\s+/g, '.')}@aluno.anhanguera.edu.br`,
            role: 'aluno',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            course: 'Direito',
            semester: 5,
            studyGoalMinutes: 60,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('estudaai_current_user', JSON.stringify(currentUser));
        }
        window.dispatchEvent(new Event('estudaai_disciplinas_changed'));
        window.dispatchEvent(new Event('estudaai_auth_changed'));
        sendResponse({ success: true });
      } catch (err) {
        console.error('Erro na injeção em tempo real:', err);
      }
    }

    // (Opcional) Recebe mensagens de progresso se houver
    if (request.action === 'AUTOPILOT_PROGRESS') {
      // Ignorado no MVP
    }
  });

  // ============================================================
  // 3. INTERCEPTAR COMANDOS DE AUTO-PILOT DO PAINEL WEB
  // O painel web dispara 'estudaai_autopilot_command' via window event
  // O bridge captura e envia para o background que executa no AVA
  // ============================================================
  window.addEventListener('estudaai_autopilot_command', (event) => {
    const { task, disciplinaId, disciplinaNome, url, disciplinasPendentes } = event.detail || {};
    console.log(`🤖 EstudaAI Bridge: Recebeu comando Auto-Pilot: task=${task}, disciplina=${disciplinaNome}`);

    chrome.runtime.sendMessage({
      action: 'AUTOPILOT_EXECUTE',
      payload: { task, disciplinaId, disciplinaNome, url, disciplinasPendentes }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erro ao executar Auto-Pilot:', chrome.runtime.lastError.message);
        window.dispatchEvent(new CustomEvent('estudaai_autopilot_error', {
          detail: { error: 'Erro de comunicação com a extensão.' }
        }));
        return;
      }
      console.log('✅ Auto-Pilot concluído pelo background:', response);
      window.dispatchEvent(new CustomEvent('estudaai_autopilot_done', {
        detail: response
      }));
    });
  });

  // ============================================================
  // 4. SINCRONIZAR DE VOLTA QUANDO O PAINEL WEB ATUALIZAR
  // ============================================================
  window.addEventListener('estudaai_disciplinas_changed', () => {
    try {
      const raw = localStorage.getItem('estudaai_disciplinas');
      if (raw) {
        const discs = JSON.parse(raw);
        chrome.storage.local.set({ estudaai_disciplinas: discs });
      }
    } catch (e) {
      console.warn('Erro ao salvar atualização no storage da extensão:', e);
    }
  });

  // ============================================================
  // 5. EXPOR STATUS DE LOGIN PARA A EXTENSÃO
  // ============================================================
  function syncLoginStatus() {
    const isLoggedIn = localStorage.getItem('estudaai_is_logged_in') === 'true';
    chrome.storage.local.set({ estudaai_is_logged_in: isLoggedIn });
  }

  window.addEventListener('estudaai_auth_changed', syncLoginStatus);
  // Sincroniza periodicamente para garantir
  setInterval(syncLoginStatus, 3000);
  syncLoginStatus();
})();
