/**
 * Bridge entre a Extensão e a WebApp EstudaAI (estudaai.pages.dev)
 */

(function () {
  console.log('🔗 EstudaAI Bridge conectado à plataforma!');

  // Ao abrir o EstudaAI, checa se existem dados sincronizados da extensão para injetar
  chrome.storage.local.get(['estudaai_student', 'estudaai_disciplinas'], (res) => {
    if (res.estudaai_disciplinas && res.estudaai_disciplinas.length > 0) {
      // Injeta no LocalStorage da página web
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

  // Escuta novas sincronizações em tempo real
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
      } catch (err) {
        console.error('Erro na injeção em tempo real:', err);
      }
    }
  });

  // Sincroniza de volta para a extensão quando o painel web atualizar
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
})();

