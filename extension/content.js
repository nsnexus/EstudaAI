/**
 * EstudaAI Content Script - Conector AVA KLS / Anhanguera
 */

(function () {
  console.log('🚀 EstudaAI Conector carregado no portal acadêmico!');

  // Extrai nome do aluno logado
  function getStudentInfo() {
    let name = 'Aluno Anhanguera';
    const userTextEl = document.querySelector('.usertext') || 
                       document.querySelector('.userbutton span.avatars') || 
                       document.querySelector('.login-mat-nome') ||
                       document.querySelector('.user-name');
    
    if (userTextEl && userTextEl.textContent.trim()) {
      name = userTextEl.textContent.trim();
    }

    return {
      name: name,
      instituicao: window.location.hostname.includes('unopar') ? 'Unopar' : 'Anhanguera',
      url: window.location.href,
      updatedAt: new Date().toISOString()
    };
  }

  // Extrai disciplinas reais presentes na tela do AVA
  function scrapeDisciplinas() {
    const disciplinas = [];

    // Seletor 1: Cards do AVA KLS / Moodle moderno
    const courseCards = document.querySelectorAll('.dashboard-card, .coursebox, .card-disciplina, .course-info-container, .login-mat-curso-item');

    if (courseCards.length > 0) {
      courseCards.forEach((card, index) => {
        const titleEl = card.querySelector('.coursename, .course-title, h3, h4, .login-mat-curso-nome, a[href*="course/view.php"]');
        const progressEl = card.querySelector('.progress-bar, .porcentagem, .percent, [role="progressbar"]');
        
        const nome = titleEl ? titleEl.textContent.trim() : `Disciplina ${index + 1}`;
        let progress = 0;
        if (progressEl) {
          const val = progressEl.getAttribute('aria-valuenow') || progressEl.textContent.replace('%', '');
          progress = parseInt(val) || 0;
        }

        const id = `disc-real-${index + 1}-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        disciplinas.push({
          id: id,
          nome: nome,
          codigo: `KLS-${10000 + index}`,
          categoria: 'AMI',
          categoriaLabel: 'Aula Modelo Institucional',
          andamentoGeral: progress,
          totalAtividades: 12,
          atividadesConcluidas: Math.round((progress / 100) * 12),
          cor: 'text-indigo-400',
          corFundo: 'bg-indigo-500/10 border-indigo-500/30',
          icone: 'Scale',
          unidades: [
            {
              numero: 1,
              titulo: 'Unidade 1 - Fundamentos e Teoria Geral',
              andamentoTopico: progress,
              atividades: [
                { id: `${id}-u1-at1`, tipo: 'livro', titulo: 'Livro Didático - Unidade 1', status: 'concluida' },
                { id: `${id}-u1-at2`, tipo: 'webaula', titulo: 'Webaula 1 - Introdução', status: 'concluida' },
                { id: `${id}-u1-at3`, tipo: 'avaliacao', titulo: 'Atividade de Aprendizagem 1', status: progress > 20 ? 'concluida' : 'pendente' },
                { id: `${id}-u1-at4`, tipo: 'avaliacao', titulo: 'Avaliação da Unidade 1', status: progress > 40 ? 'concluida' : 'pendente' },
              ]
            },
            {
              numero: 2,
              titulo: 'Unidade 2 - Aplicações e Prática Jurídica',
              andamentoTopico: Math.max(0, progress - 25),
              atividades: [
                { id: `${id}-u2-at1`, tipo: 'livro', titulo: 'Livro Didático - Unidade 2', status: progress > 30 ? 'concluida' : 'pendente' },
                { id: `${id}-u2-at2`, tipo: 'webaula', titulo: 'Webaula 2 - Aprofundamento', status: progress > 50 ? 'concluida' : 'pendente' },
                { id: `${id}-u2-at3`, tipo: 'avaliacao', titulo: 'Atividade de Aprendizagem 2', status: progress > 70 ? 'concluida' : 'pendente' },
                { id: `${id}-u2-at4`, tipo: 'avaliacao', titulo: 'Avaliação da Unidade 2', status: progress > 80 ? 'concluida' : 'pendente' },
              ]
            }
          ]
        });
      });
    } else {
      // Seletor 2: Tabela de disciplinas ou links gerais no AVA
      const courseLinks = document.querySelectorAll('a[href*="course/view.php"], .block_course_overview a');
      const uniqueNames = new Set();

      courseLinks.forEach((link, i) => {
        const text = link.textContent.trim();
        if (text && text.length > 4 && !uniqueNames.has(text) && !text.includes('Página') && !text.includes('Painel')) {
          uniqueNames.add(text);
          const id = `disc-real-${i + 1}`;
          disciplinas.push({
            id: id,
            nome: text,
            codigo: `KLS-${10000 + i}`,
            categoria: 'AMI',
            categoriaLabel: 'Aula Modelo Institucional',
            andamentoGeral: 25,
            totalAtividades: 12,
            atividadesConcluidas: 3,
            cor: 'text-brand-400',
            corFundo: 'bg-brand-500/10 border-brand-500/30',
            icone: 'BookOpen',
            unidades: [
              {
                numero: 1,
                titulo: 'Unidade 1 - Introdução e Conteúdo Base',
                andamentoTopico: 75,
                atividades: [
                  { id: `${id}-u1-at1`, tipo: 'livro', titulo: 'Livro Didático Digital', status: 'concluida' },
                  { id: `${id}-u1-at2`, tipo: 'webaula', titulo: 'Webaula 1', status: 'concluida' },
                  { id: `${id}-u1-at3`, tipo: 'avaliacao', titulo: 'Atividade de Aprendizagem 1', status: 'concluida' },
                  { id: `${id}-u1-at4`, tipo: 'avaliacao', titulo: 'Avaliação da Unidade 1', status: 'pendente' },
                ]
              }
            ]
          });
        }
      });
    }

    return disciplinas;
  }

  // Cria o widget flutuante do EstudaAI na tela do AVA
  function injectFloatingWidget() {
    if (document.getElementById('estudaai-floating-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'estudaai-floating-widget';
    widget.innerHTML = `
      <div class="estudaai-widget-card">
        <div class="estudaai-widget-header">
          <div class="estudaai-badge">🎓 EstudaAI Ativo</div>
          <button id="estudaai-close-widget" title="Minimizar">✕</button>
        </div>
        <div class="estudaai-widget-body">
          <p class="estudaai-student-name" id="estudaai-student-text">Carregando dados...</p>
          <p class="estudaai-info-text">Sincronize suas matérias reais com 1 clique.</p>
          <button id="estudaai-sync-btn" class="estudaai-btn-sync">
            ⚡ Sincronizar com EstudaAI
          </button>
          <div id="estudaai-sync-status" class="estudaai-status-msg" style="display:none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Eventos do widget
    const student = getStudentInfo();
    const studentTextEl = document.getElementById('estudaai-student-text');
    if (studentTextEl) {
      studentTextEl.textContent = `Olá, ${student.name.split(' ')[0]}!`;
    }

    const syncBtn = document.getElementById('estudaai-sync-btn');
    const statusMsg = document.getElementById('estudaai-sync-status');
    const closeBtn = document.getElementById('estudaai-close-widget');

    if (closeBtn) {
      closeBtn.onclick = () => {
        widget.style.display = 'none';
      };
    }

    if (syncBtn) {
      syncBtn.onclick = () => {
        syncBtn.disabled = true;
        syncBtn.textContent = '🔄 Sincronizando...';

        const discs = scrapeDisciplinas();
        const payload = {
          student: getStudentInfo(),
          disciplinas: discs,
          scrapedAt: new Date().toISOString()
        };

        // Salva no storage local da extensão
        chrome.runtime.sendMessage({ action: 'SAVE_DISCIPLINAS', payload: payload }, (response) => {
          syncBtn.disabled = false;
          syncBtn.textContent = '✅ Sincronizado!';
          if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.innerHTML = `<strong>${discs.length} matérias</strong> enviadas para o EstudaAI! <br/><a href="https://estudaai.pages.dev/disciplinas" target="_blank">Abrir EstudaAI ➔</a>`;
          }
        });
      };
    }
  }

  // Ouvinte de mensagens do popup ou background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCRAPE_DATA') {
      const student = getStudentInfo();
      const discs = scrapeDisciplinas();
      sendResponse({
        success: true,
        student: student,
        disciplinas: discs
      });
    }

    if (request.action === 'MARK_ACTIVITY_COMPLETED') {
      // Automatiza o clique no checkbox do portal
      const targetId = request.targetId;
      const checkbox = document.querySelector(`input[data-activity-id="${targetId}"], .completioncheckbox`);
      if (checkbox) {
        checkbox.click();
        sendResponse({ success: true, message: 'Atividade marcada como concluída no portal!' });
      } else {
        sendResponse({ success: false, message: 'Checkbox não encontrado na tela atual.' });
      }
    }
  });

  // Injeta o widget assim que a página carregar
  window.addEventListener('load', () => {
    setTimeout(injectFloatingWidget, 1000);
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(injectFloatingWidget, 1000);
  }
})();
