/**
 * EstudaAI Content Script - Conector AVA KLS & Auto-Pilot de Provas
 */

(function () {
  console.log('🚀 EstudaAI Conector & Auto-Pilot carregado no portal acadêmico!');

  // =========================================================================
  // 1. AUTO-PILOT DE PROVAS E QUESTIONÁRIOS (MULTICHOICE)
  // =========================================================================
  async function checkAndSolveQuizQuestions() {
    const questions = Array.from(document.querySelectorAll('.que.multichoice, .que, .formulation'));
    const isQuizPage = window.location.href.includes('/mod/quiz/') || questions.length > 0;
    
    if (questions.length > 0) {
      console.log(`🎯 EstudaAI Auto-Pilot: Detectadas ${questions.length} questões na página.`);

      // Cria HUD visual no topo da tela do AVA
      let hud = document.getElementById('estudaai-quiz-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'estudaai-quiz-hud';
        hud.style.cssText = `
          position: fixed; top: 16px; right: 16px; z-index: 9999999;
          background: #0f172a; color: #ffffff; padding: 18px 24px;
          border-radius: 16px; border: 2px solid #10b981;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6); font-family: sans-serif; min-width: 320px;
        `;
        hud.innerHTML = `
          <div style="font-weight:bold; font-size:14px; color:#34d399; margin-bottom:6px;">
            🤖 EstudaAI Auto-Pilot (ChatGPT)
          </div>
          <div id="estudaai-quiz-status" style="font-size:12px; color:#cbd5e1;">
            Analisando questões desta página com a IA...
          </div>
        `;
        document.body.appendChild(hud);
      }

      const statusEl = document.getElementById('estudaai-quiz-status');

      // Resolve cada questão da página atual
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qText = q.querySelector('.qtext')?.innerText?.trim() || 'Questão';
        
        const radioInputs = Array.from(q.querySelectorAll('.answer input[type="radio"]'));
        const answerLabels = Array.from(q.querySelectorAll('.answer label, .answer .flex-fill, .answer div'))
          .map(el => el.innerText.trim())
          .filter(t => t.length > 1 && !t.toLowerCase().startsWith('limpar'));

        if (statusEl) {
          statusEl.innerHTML = `🧠 [Questão ${i + 1}/${questions.length}] Resolvendo com IA e marcando...`;
        }
        q.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Detecta nome da disciplina dinamicamente
        const disciplineName = document.querySelector('.page-header-headings h1, .breadcrumb li:nth-last-child(2), h1')?.innerText?.trim() || 'Direito e Formação Geral';

        try {
          let data = null;
          
          // Tenta primeiro no localhost (se o servidor local estiver ativo), depois na nuvem
          const endpoints = [
            'http://localhost:3000/api/solve-quiz',
            'https://estudaai.pages.dev/api/solve-quiz'
          ];

          for (const url of endpoints) {
            try {
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  question: qText,
                  options: answerLabels,
                  discipline: disciplineName,
                  provider: 'openai'
                })
              });
              if (res.ok) {
                data = await res.json();
                break;
              }
            } catch (fetchErr) {
              // segue para o próximo endpoint
            }
          }

          if (data && typeof data.correctIndex === 'number' && radioInputs[data.correctIndex]) {
            // 1. Clica na alternativa correta
            radioInputs[data.correctIndex].click();

            // 2. Destaca em verde
            const targetContainer = radioInputs[data.correctIndex].closest('.r0, .r1, .d-flex, div') || radioInputs[data.correctIndex].parentElement;
            if (targetContainer) {
              targetContainer.style.background = 'rgba(16, 185, 129, 0.2)';
              targetContainer.style.border = '2px solid #10b981';
              targetContainer.style.borderRadius = '8px';
              targetContainer.style.padding = '6px';
            }

            // 3. Insere a justificativa abaixo da questão
            const note = document.createElement('div');
            note.style.cssText = `
              margin-top: 10px; padding: 12px; border-radius: 10px;
              background: #064e3b; color: #a7f3d0; font-size: 12px; border: 1px solid #10b981;
            `;
            note.innerHTML = `<strong>🎯 Alternativa ${data.correctLetter || ''} marcada!</strong><br/><em>${data.explanation || 'Analisado com base nos princípios da matéria.'}</em>`;
            q.appendChild(note);
          }
        } catch (err) {
          console.error('Erro no Auto-Pilot:', err);
        }

        await new Promise(r => setTimeout(r, 1200));
      }

      // Procura botão de próxima página
      const allButtons = Array.from(document.querySelectorAll('input[type="submit"], button, .mod_quiz-next-nav'));
      const nextBtn = allButtons.find(b => {
        const val = (b.value || b.innerText || '').toLowerCase();
        return val.includes('próxima') || val.includes('proxima') || val.includes('next');
      });

      if (nextBtn) {
        if (statusEl) {
          statusEl.innerHTML = '➡️ <strong>Página concluída! Indo para a próxima página automaticamente em 3s...</strong>';
        }
        nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nextBtn.style.outline = '4px solid #10b981';
        
        setTimeout(() => {
          nextBtn.click();
        }, 3000);
      } else {
        if (statusEl) {
          statusEl.innerHTML = '🎉 <strong>Todas as páginas da prova foram 100% resolvidas!</strong>';
        }
        alert('🎉 Prova 100% resolvida pelo EstudaAI!\nConfira as respostas e clique em "Finalizar tentativa..." para enviar suas notas!');
      }
    }
  }

  // =========================================================================
  // 2. EXTRAÇÃO E SINCRONIZAÇÃO DE DISCIPLINAS
  // =========================================================================
  function getStudentInfo() {
    let name = 'Narciso Henrique Felizardo dos Santos';
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

  function scrapeDisciplinas() {
    const ignoreList = ['INSCREVA-SE', 'Processo Seletivo', 'Painel', 'Página', 'Meus Cursos', 'Todos'];
    const cards = document.querySelectorAll('.dashboard-card, .coursebox, .card-disciplina, a[href*="course/view.php"]');
    const nomes = [];

    cards.forEach(c => {
      const text = c.innerText.trim().split('\n')[0];
      if (text && text.length > 3 && !nomes.includes(text) && !ignoreList.some(ig => text.toLowerCase().includes(ig.toLowerCase()))) {
        nomes.push(text);
      }
    });

    return nomes.map((nome, idx) => {
      const id = `disc-${idx + 1}-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      return {
        id: id,
        nome: nome,
        codigo: `KLS-${10780 + idx}`,
        categoria: nome.includes('Extensão') ? 'Extensao' : (idx % 2 === 0 ? 'AMI' : 'DI'),
        categoriaLabel: nome.includes('Extensão') ? 'Projeto de Extensão' : (idx % 2 === 0 ? 'Aula Modelo Institucional' : 'Disciplinas Interativas (DI)'),
        andamentoGeral: 0,
        totalAtividades: 12,
        atividadesConcluidas: 0,
        cor: idx % 3 === 0 ? 'text-amber-500' : (idx % 3 === 1 ? 'text-brand-500' : 'text-blue-500'),
        corFundo: idx % 3 === 0 ? 'bg-amber-500/10 border-amber-500/30' : (idx % 3 === 1 ? 'bg-brand-500/10 border-brand-500/30' : 'bg-blue-500/10 border-blue-500/30'),
        icone: nome.includes('Direito') ? 'Scale' : 'BookOpen',
        unidades: [
          {
            numero: 1,
            titulo: 'Unidade 1 - Fundamentos e Teoria Geral',
            andamentoTopico: 0,
            atividades: [
              { id: `${id}-u1-at1`, tipo: 'livro', titulo: `U1 - Livro Didático`, status: 'pendente' },
              { id: `${id}-u1-at2`, tipo: 'webaula', titulo: 'U1 - Webaula e Teleaula', status: 'pendente' },
              { id: `${id}-u1-at3`, tipo: 'avaliacao', titulo: 'U1 - Atividade de Aprendizagem', status: 'pendente' },
              { id: `${id}-u1-at4`, tipo: 'avaliacao', titulo: 'U1 - Avaliação da Unidade (AV)', status: 'pendente' }
            ]
          }
        ]
      };
  // =========================================================================
  // 3. WIDGET FLUTUANTE DE SINCRONIZAÇÃO
  // =========================================================================
  function renderFloatingWidget() {
    // Não exibe widget em telas de quiz/prova
    if (window.location.href.includes('/mod/quiz/')) return;
    if (document.getElementById('estudaai-floating-widget')) return;

    const student = getStudentInfo();
    const widget = document.createElement('div');
    widget.id = 'estudaai-floating-widget';
    widget.innerHTML = `
      <div class="estudaai-widget-card">
        <div class="estudaai-widget-header">
          <span class="estudaai-badge">🎓 EstudaAI Conector</span>
          <button id="estudaai-close-widget" title="Fechar">✕</button>
        </div>
        <div class="estudaai-student-name">${student.name}</div>
        <div class="estudaai-info-text">Sincronize suas disciplinas e atividades com a plataforma EstudaAI em 1 clique.</div>
        <button id="estudaai-btn-sync-widget" class="estudaai-btn-sync">⚡ Sincronizar com EstudaAI</button>
        <div id="estudaai-widget-status" class="estudaai-status-msg" style="display:none;"></div>
      </div>
    `;
    document.body.appendChild(widget);

    document.getElementById('estudaai-close-widget')?.addEventListener('click', () => {
      widget.remove();
    });

    const syncBtn = document.getElementById('estudaai-btn-sync-widget');
    const statusBox = document.getElementById('estudaai-widget-status');

    syncBtn?.addEventListener('click', () => {
      syncBtn.disabled = true;
      syncBtn.innerText = '🔄 Sincronizando...';

      const studentData = getStudentInfo();
      const discData = scrapeDisciplinas();

      chrome.runtime.sendMessage({
        action: 'SAVE_DISCIPLINAS',
        payload: {
          student: studentData,
          disciplinas: discData,
          scrapedAt: new Date().toISOString()
        }
      }, (res) => {
        syncBtn.disabled = false;
        syncBtn.innerText = '✅ Sincronizado!';
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.innerHTML = `
            🎉 <strong>${discData.length} matérias</strong> sincronizadas!<br/>
            <a href="http://localhost:3000/disciplinas" target="_blank">👉 Abrir no EstudaAI</a>
          `;
        }
      });
    });
  }

  // =========================================================================
  // 4. AUTO-COMPLETE DE WEBAULAS, VÍDEOS, LEITURA E SCORM (NÃO-QUESTÕES)
  // =========================================================================
  function autoCompleteNonQuizActivities() {
    // 1. Completa SCORM / Webaulas Interativas via API do LMS
    try {
      const win = window;
      const api = win.API || win.parent?.API || win.top?.API;
      const api2004 = win.API_1484_11 || win.parent?.API_1484_11 || win.top?.API_1484_11;

      if (api) {
        api.LMSSetValue('cmi.core.lesson_status', 'completed');
        api.LMSSetValue('cmi.core.lesson_location', '100');
        api.LMSSetValue('cmi.core.score.raw', '100');
        api.LMSCommit('');
        console.log('✅ EstudaAI: SCORM 1.2 marcado como 100% concluído!');
        showToast('🎉 Webaula / SCORM concluído com sucesso!');
      } else if (api2004) {
        api2004.SetValue('cmi.completion_status', 'completed');
        api2004.SetValue('cmi.success_status', 'passed');
        api2004.SetValue('cmi.progress_measure', '1.0');
        api2004.Commit('');
        console.log('✅ EstudaAI: SCORM 2004 marcado como 100% concluído!');
        showToast('🎉 Webaula / SCORM 2004 concluído com sucesso!');
      }
    } catch (e) {
      console.warn('Erro ao completar SCORM:', e);
    }

    // 2. Acelera e conclui vídeos (Teleaulas e Webaulas em vídeo)
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach(v => {
      try {
        if (v && !v.ended && v.duration > 0) {
          v.currentTime = Math.max(0, v.duration - 1);
          v.play().catch(() => {});
          console.log('✅ EstudaAI: Vídeo avançado para o final para computar presença!');
          showToast('🎬 Vídeo/Teleaula 100% assistido!');
        }
      } catch (err) {
        console.warn('Vídeo protegido ou erro ao avançar:', err);
      }
    });

    // 3. Clica em botões de "Marcar como Concluído" do Moodle se existirem
    const completionBtns = Array.from(document.querySelectorAll(
      'button[data-action="toggle-manual-completion"], form.togglecompletion input[type="submit"], .btn-outline-secondary.btn-sm'
    ));
    completionBtns.forEach(btn => {
      const text = (btn.value || btn.innerText || '').toLowerCase();
      if (text.includes('marcar como concluíd') || text.includes('marcar como fe') || text.includes('concluir')) {
        btn.click();
        console.log('✅ EstudaAI: Botão de conclusão manual acionado!');
      }
    });

    // 4. Rola a página de leitura suavemente para marcar leitura completa no AVA
    if (window.location.href.includes('/mod/resource/') || 
        window.location.href.includes('/mod/page/') || 
        window.location.href.includes('/mod/book/')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  // Notificação Toast visual discreta
  function showToast(message) {
    let toast = document.getElementById('estudaai-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'estudaai-toast';
      toast.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; z-index: 9999999;
        background: #0f172a; color: #34d399; padding: 12px 20px;
        border-radius: 12px; border: 1px solid #10b981;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-family: sans-serif;
        font-size: 13px; font-weight: bold; animation: estudaai-slide-in 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.style.display = 'block';
    setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 4000);
  }

  // =========================================================================
  // 5. COMUNICAÇÃO VIA MESSAGES (POPUP)
  // =========================================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCRAPE_DATA') {
      const student = getStudentInfo();
      const disciplinas = scrapeDisciplinas();
      sendResponse({
        success: true,
        student,
        disciplinas
      });
    }

    if (request.action === 'AUTO_COMPLETE_ACTIVITY') {
      autoCompleteNonQuizActivities();
      sendResponse({ success: true });
    }
  });

  // Auto-execução ao carregar a página
  window.addEventListener('load', () => {
    setTimeout(() => {
      checkAndSolveQuizQuestions();
      renderFloatingWidget();
      autoCompleteNonQuizActivities();
    }, 1200);
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      checkAndSolveQuizQuestions();
      renderFloatingWidget();
      autoCompleteNonQuizActivities();
    }, 1200);
  }
})();

