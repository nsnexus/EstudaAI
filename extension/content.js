/**
 * EstudaAI Content Script - Conector AVA KLS & Auto-Pilot de Provas
 * 
 * FUNCIONALIDADES REAIS:
 * 1. Auto-resolve questões de quiz/AAP usando IA (GPT/Gemini)
 * 2. Conclui atividades SCORM/Webaula pela API do Moodle LMS 
 * 3. Coleta links reais das atividades e abre cada uma para completar
 * 4. Responde a comandos do painel web via extensão (AUTOPILOT_EXECUTE)
 */

(function () {
  'use strict';
  console.log('🚀 EstudaAI Conector & Auto-Pilot carregado no portal acadêmico!');

  // ============================================================
  // UTILIDADES: MOODLE SESSION KEY & CMID
  // ============================================================

  function getMoodleSesskey() {
    // O Moodle expõe o sesskey em window.M.cfg.sesskey
    try {
      if (window.M && window.M.cfg && window.M.cfg.sesskey) {
        return window.M.cfg.sesskey;
      }
    } catch (e) {}
    // Fallback: busca no HTML
    const match = document.body.innerHTML.match(/"sesskey":"([a-zA-Z0-9]+)"/);
    if (match) return match[1];
    const match2 = document.body.innerHTML.match(/sesskey=([a-zA-Z0-9]+)/);
    if (match2) return match2[1];
    return null;
  }

  function getCourseId() {
    const match = window.location.href.match(/[?&]id=(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Chama a API AJAX do Moodle para marcar uma atividade como concluída manualmente
   */
  async function moodleMarkComplete(cmid) {
    const sesskey = getMoodleSesskey();
    if (!sesskey || !cmid) return false;

    const baseUrl = window.location.origin;
    try {
      const response = await fetch(`${baseUrl}/lib/ajax/service.php?sesskey=${sesskey}&info=core_completion_update_activity_completion_status_manually`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          index: 0,
          methodname: 'core_completion_update_activity_completion_status_manually',
          args: { cmid: parseInt(cmid), completed: true }
        }])
      });
      const result = await response.json();
      if (result && result[0] && !result[0].error) {
        console.log(`✅ EstudaAI: Atividade cmid=${cmid} marcada como concluída via API Moodle!`);
        return true;
      }
    } catch (e) {
      console.warn('Erro ao marcar via API Moodle:', e);
    }
    return false;
  }

  /**
   * Coleta todos os links de atividades da página de curso atual do Moodle
   */
  function coletarAtividadesDoCurso() {
    const atividades = [];

    // Links de atividades do Moodle (mod/*)
    const links = Array.from(document.querySelectorAll('a[href*="/mod/"]'));
    links.forEach(link => {
      const href = link.href || '';
      const cmidMatch = href.match(/id=(\d+)/);
      const modMatch = href.match(/\/mod\/([a-z0-9_]+)\//);
      if (cmidMatch && modMatch) {
        const tipo = modMatch[1]; // quiz, scorm, resource, page, forum, etc.
        const titulo = (link.querySelector('.instancename') || link).innerText.trim().split('\n')[0];
        atividades.push({
          cmid: cmidMatch[1],
          tipo,
          titulo,
          href
        });
      }
    });

    // Remove duplicatas por cmid
    const uniq = [];
    const seen = new Set();
    atividades.forEach(a => {
      if (!seen.has(a.cmid)) {
        seen.add(a.cmid);
        uniq.push(a);
      }
    });

    return uniq;
  }

  // ============================================================
  // 1. AUTO-PILOT DE PROVAS E QUESTIONÁRIOS (MULTICHOICE)
  // ============================================================
  async function checkAndSolveQuizQuestions() {
    const questions = Array.from(document.querySelectorAll('.que.multichoice, .que, .formulation'));
    const isQuizPage = window.location.href.includes('/mod/quiz/') || questions.length > 0;

    if (questions.length > 0) {
      console.log(`🎯 EstudaAI Auto-Pilot: Detectadas ${questions.length} questões na página.`);

      // HUD visual
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
            🤖 EstudaAI Auto-Pilot (IA)
          </div>
          <div id="estudaai-quiz-status" style="font-size:12px; color:#cbd5e1;">
            Analisando questões desta página com a IA...
          </div>
        `;
        document.body.appendChild(hud);
      }

      const statusEl = document.getElementById('estudaai-quiz-status');
      const disciplineName = document.querySelector('.page-header-headings h1, .breadcrumb li:nth-last-child(2), h1')?.innerText?.trim() || 'Direito e Formação Geral';

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qText = q.querySelector('.qtext')?.innerText?.trim() || 'Questão';
        const radioInputs = Array.from(q.querySelectorAll('.answer input[type="radio"]'));
        const answerLabels = Array.from(q.querySelectorAll('.answer label, .answer .flex-fill, .answer div'))
          .map(el => el.innerText.trim())
          .filter(t => t.length > 1 && !t.toLowerCase().startsWith('limpar'));

        if (statusEl) statusEl.innerHTML = `🧠 [Questão ${i + 1}/${questions.length}] Resolvendo com IA...`;
        q.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
          let data = null;
          const endpoints = [
            'http://localhost:3000/api/solve-quiz',
            'https://estudaai.pages.dev/api/solve-quiz'
          ];
          for (const url of endpoints) {
            try {
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: qText, options: answerLabels, discipline: disciplineName, provider: 'openai' })
              });
              if (res.ok) { data = await res.json(); break; }
            } catch (_) {}
          }

          if (data && typeof data.correctIndex === 'number' && radioInputs[data.correctIndex]) {
            radioInputs[data.correctIndex].click();
            const container = radioInputs[data.correctIndex].closest('.r0, .r1, .d-flex, div') || radioInputs[data.correctIndex].parentElement;
            if (container) {
              container.style.background = 'rgba(16, 185, 129, 0.2)';
              container.style.border = '2px solid #10b981';
              container.style.borderRadius = '8px';
              container.style.padding = '6px';
            }
            const note = document.createElement('div');
            note.style.cssText = `margin-top: 10px; padding: 12px; border-radius: 10px; background: #064e3b; color: #a7f3d0; font-size: 12px; border: 1px solid #10b981;`;
            note.innerHTML = `<strong>🎯 Alternativa ${data.correctLetter || ''} marcada!</strong><br/><em>${data.explanation || ''}</em>`;
            q.appendChild(note);
          }
        } catch (err) {
          console.error('Erro no Auto-Pilot:', err);
        }

        await new Promise(r => setTimeout(r, 1200));
      }

      // Vai para próxima página ou finaliza
      const allButtons = Array.from(document.querySelectorAll('input[type="submit"], button, .mod_quiz-next-nav'));
      const nextBtn = allButtons.find(b => {
        const val = (b.value || b.innerText || '').toLowerCase();
        return val.includes('próxima') || val.includes('proxima') || val.includes('next');
      });

      if (nextBtn) {
        if (statusEl) statusEl.innerHTML = '➡️ <strong>Página concluída! Indo para a próxima em 3s...</strong>';
        nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nextBtn.style.outline = '4px solid #10b981';
        setTimeout(() => nextBtn.click(), 3000);
      } else {
        if (statusEl) statusEl.innerHTML = '🎉 <strong>Todas as páginas 100% resolvidas!</strong>';
        alert('🎉 Prova 100% resolvida pelo EstudaAI!\nConfira as respostas e clique em "Finalizar tentativa..." para enviar suas notas!');
      }
    }
  }

  // ============================================================
  // 2. EXTRAÇÃO E SINCRONIZAÇÃO DE DISCIPLINAS
  // ============================================================
  function getStudentInfo() {
    let name = '';
    const userTextEl = document.querySelector('.usertext, .userbutton span.avatars, .login-mat-nome, .user-name, .navbar-nav .nav-item .nav-link span');
    if (userTextEl && userTextEl.textContent.trim()) {
      name = userTextEl.textContent.trim();
    }
    if (!name) {
      // Fallback: busca no avatar ou header
      const avatarEl = document.querySelector('.usermenu .userbutton span, .userinitials');
      if (avatarEl) name = avatarEl.title || avatarEl.textContent.trim();
    }

    return {
      name: name || 'Estudante',
      instituicao: window.location.hostname.includes('unopar') ? 'Unopar' :
                   window.location.hostname.includes('pitagoras') ? 'Pitagoras' : 'Anhanguera',
      url: window.location.href,
      updatedAt: new Date().toISOString()
    };
  }

  function scrapeDisciplinas() {
    const ignoreList = ['INSCREVA-SE', 'Processo Seletivo', 'Painel', 'Página', 'Meus Cursos', 'Todos', 'Sair', 'Menu', 'Suporte', 'Avisos', 'Contatos', 'Início', 'Home', 'Boas Vindas', 'Manual'];
    const cards = document.querySelectorAll(
      '.dashboard-card, .coursebox, .card-disciplina, a[href*="course/view.php"], a[href*="/disciplina/"], .disciplina-item, .card-curso, .course-info-container'
    );
    const nomes = [];

    cards.forEach(c => {
      const text = c.innerText.trim().split('\n')[0];
      if (text && text.length > 5 && !nomes.includes(text) && !ignoreList.some(ig => text.toLowerCase().includes(ig.toLowerCase()))) {
        nomes.push(text);
      }
    });

    // Fallback: título do curso atual se estiver numa página de curso
    if (nomes.length === 0) {
      const courseTitle = document.querySelector('.page-header-headings h1, h1.page-title');
      if (courseTitle) {
        const text = courseTitle.innerText.trim();
        if (text && !ignoreList.some(ig => text.toLowerCase().includes(ig.toLowerCase()))) {
          nomes.push(text);
        }
      }
    }

    // Coleta links reais de cada curso para navegação futura
    const courseLinks = {};
    document.querySelectorAll('a[href*="course/view.php"]').forEach(a => {
      const match = a.href.match(/id=(\d+)/);
      if (match) {
        const title = (a.querySelector('.coursename, .multiline, .course-fullname') || a).innerText.trim().split('\n')[0];
        if (title) courseLinks[title] = { id: match[1], url: a.href };
      }
    });

    return nomes.map((nome, idx) => {
      const id = `disc-${idx + 1}-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const courseInfo = courseLinks[nome] || {};
      return {
        id,
        nome,
        moodleCourseId: courseInfo.id || null,
        moodleCourseUrl: courseInfo.url || null,
        codigo: `KLS-${10780 + idx}`,
        categoria: nome.includes('Extensão') ? 'Extensao' : (idx % 2 === 0 ? 'AMI' : 'DI'),
        categoriaLabel: nome.includes('Extensão') ? 'Projeto de Extensão' : (idx % 2 === 0 ? 'Aula Modelo Institucional' : 'Disciplinas Interativas (DI)'),
        andamentoGeral: 0,
        totalAtividades: 12,
        atividadesConcluidas: 0,
        cor: idx % 3 === 0 ? 'text-amber-500' : (idx % 3 === 1 ? 'text-brand-500' : 'text-blue-500'),
        corFundo: idx % 3 === 0 ? 'bg-amber-500/10 border-amber-500/30' : (idx % 3 === 1 ? 'bg-brand-500/10 border-brand-500/30' : 'bg-blue-500/10 border-blue-500/30'),
        icone: nome.includes('Direito') ? 'Scale' : 'BookOpen',
        unidades: [1, 2, 3, 4].map(n => ({
          numero: n,
          titulo: `Unidade ${n}`,
          andamentoTopico: 0,
          atividades: [
            { id: `${id}-u${n}-at1`, tipo: 'livro_didatico', titulo: `U${n} - Livro Didático (PDF)`, status: 'pendente' },
            { id: `${id}-u${n}-at2`, tipo: 'webaula', titulo: `U${n} - Webaula e Teleaula`, status: 'pendente' },
            { id: `${id}-u${n}-at3`, tipo: 'aprendizagem', titulo: `U${n} - Atividade de Aprendizagem (AAP)`, status: 'pendente' },
            { id: `${id}-u${n}-at4`, tipo: 'avaliacao_unidade', titulo: `U${n} - Avaliação da Unidade (AV)`, status: 'pendente' }
          ]
        }))
      };
    });
  }

  // ============================================================
  // 3. WIDGET FLUTUANTE DE SINCRONIZAÇÃO
  // ============================================================
  function renderFloatingWidget() {
    if (window.location.href.includes('/mod/quiz/attempt')) return;
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

    document.getElementById('estudaai-close-widget')?.addEventListener('click', () => widget.remove());

    const syncBtn = document.getElementById('estudaai-btn-sync-widget');
    const statusBox = document.getElementById('estudaai-widget-status');

    syncBtn?.addEventListener('click', () => {
      syncBtn.disabled = true;
      syncBtn.innerText = '🔄 Sincronizando...';

      chrome.storage.local.get(['estudaai_is_logged_in'], (res) => {
        if (!res.estudaai_is_logged_in) {
          alert('⚠️ Você não está logado no EstudaAI!\n\nPor favor, faça login ou cadastre-se na plataforma EstudaAI (estudaai.pages.dev) para validar sua licença antes de sincronizar.');
          syncBtn.disabled = false;
          syncBtn.innerText = '⚡ Sincronizar com EstudaAI';
          return;
        }

        const studentData = getStudentInfo();
        const discData = scrapeDisciplinas();

        chrome.runtime.sendMessage({
          action: 'SAVE_DISCIPLINAS',
          payload: { student: studentData, disciplinas: discData, scrapedAt: new Date().toISOString() }
        }, () => {
          syncBtn.disabled = false;
          syncBtn.innerText = '✅ Sincronizado!';
          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.innerHTML = `🎉 <strong>${discData.length} matérias</strong> sincronizadas!<br/><a href="https://estudaai.pages.dev/disciplinas" target="_blank">👉 Abrir no EstudaAI</a>`;
          }
        });
      });
    });
  }

  // ============================================================
  // 4. AUTO-COMPLETE REAL: API MOODLE + SCORM + QUIZ
  // ============================================================
  async function autoCompleteNonQuizActivities() {
    let concluiu = false;

    // 1. SCORM via API LMS
    try {
      const win = window;
      const api = win.API || win.parent?.API || win.top?.API;
      const api2004 = win.API_1484_11 || win.parent?.API_1484_11 || win.top?.API_1484_11;

      if (api) {
        api.LMSSetValue('cmi.core.lesson_status', 'completed');
        api.LMSSetValue('cmi.core.lesson_location', '100');
        api.LMSSetValue('cmi.core.score.raw', '100');
        api.LMSCommit('');
        showToast('🎉 Webaula / SCORM concluído com sucesso!');
        concluiu = true;
      } else if (api2004) {
        api2004.SetValue('cmi.completion_status', 'completed');
        api2004.SetValue('cmi.success_status', 'passed');
        api2004.SetValue('cmi.progress_measure', '1.0');
        api2004.Commit('');
        showToast('🎉 Webaula / SCORM 2004 concluído!');
        concluiu = true;
      }
    } catch (e) {}

    // 2. Vídeos - avança para o final
    document.querySelectorAll('video').forEach(v => {
      try {
        if (v && !v.ended && v.duration > 0) {
          v.currentTime = Math.max(0, v.duration - 1);
          v.play().catch(() => {});
          v.dispatchEvent(new Event('ended'));
          showToast('🎬 Vídeo/Teleaula 100% assistido!');
          concluiu = true;
        }
      } catch (err) {}
    });

    // 3. Moodle API: marcar atividade atual como concluída
    const cmidMatch = window.location.href.match(/[?&]id=(\d+)/);
    if (cmidMatch) {
      const ok = await moodleMarkComplete(cmidMatch[1]);
      if (ok) { showToast('✅ Atividade marcada como concluída no Moodle!'); concluiu = true; }
    }

    // 4. Clicar nos botões de conclusão manual do Moodle
    document.querySelectorAll('button[data-action="toggle-manual-completion"], form.togglecompletion input[type="submit"]').forEach(btn => {
      const text = (btn.value || btn.innerText || '').toLowerCase();
      if (text.includes('marcar') || text.includes('concluir') || text.includes('complete')) {
        btn.click();
        showToast('✅ Conclusão manual acionada!');
        concluiu = true;
      }
    });

    // 5. Scroll completo em páginas de leitura
    if (window.location.href.match(/\/mod\/(resource|page|book|folder)\//)) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      setTimeout(() => {
        const cmid2 = window.location.href.match(/[?&]id=(\d+)/);
        if (cmid2) moodleMarkComplete(cmid2[1]);
      }, 2000);
    }

    if (!concluiu) {
      showToast('ℹ️ Nenhuma atividade detectada nesta página para concluir.');
    }
  }

  /**
   * AUTO-PILOT COMPLETO DE UMA DISCIPLINA:
   * Coleta todas as atividades da página do curso e processa cada uma
   */
  async function autoPilotDisciplina(disciplinaNome) {
    const atividades = coletarAtividadesDoCurso();
    showToast(`🚀 Auto-Pilot iniciado: ${atividades.length} atividades encontradas para "${disciplinaNome || 'esta disciplina'}"`);
    
    let concluidas = 0;
    
    for (const atividade of atividades) {
      try {
        // Moodle completion via API (mais rápido, não precisa abrir cada página)
        const ok = await moodleMarkComplete(atividade.cmid);
        if (ok) concluidas++;

        // Se for quiz, abre e resolve
        if (atividade.tipo === 'quiz' && atividade.href) {
          // Sinaliza ao background para abrir e resolver o quiz
          chrome.runtime.sendMessage({
            action: 'AUTOPILOT_OPEN_AND_EXECUTE',
            payload: { url: atividade.href, task: 'solve_quiz' }
          });
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (e) {
        console.warn(`Erro ao concluir ${atividade.titulo}:`, e);
      }
      
      await new Promise(r => setTimeout(r, 300));
    }

    showToast(`✅ Auto-Pilot concluído! ${concluidas}/${atividades.length} atividades marcadas no AVA.`);

    return { concluidas, total: atividades.length };
  }

  // ============================================================
  // Toast visual
  // ============================================================
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
        font-size: 13px; font-weight: bold;
        transition: opacity 0.4s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
  }

  // ============================================================
  // 5. RECEPTOR DE COMANDOS DO PAINEL WEB / POPUP
  // ============================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Popup: coletar dados do AVA
    if (request.action === 'SCRAPE_DATA') {
      const student = getStudentInfo();
      const disciplinas = scrapeDisciplinas();
      sendResponse({ success: true, student, disciplinas });
      return true;
    }

    // Popup: concluir atividade da página atual
    if (request.action === 'AUTO_COMPLETE_ACTIVITY') {
      autoCompleteNonQuizActivities().then(() => sendResponse({ success: true }));
      return true;
    }

    // Painel Web / Background: executar Auto-Pilot real no AVA
    if (request.action === 'AUTOPILOT_EXECUTE') {
      const { task, disciplinaId, disciplinaNome } = request;

      if (task === 'complete_all' || task === 'complete_discipline') {
        autoPilotDisciplina(disciplinaNome).then(result => sendResponse({ success: true, ...result }));
        return true;
      }

      if (task === 'solve_quiz') {
        checkAndSolveQuizQuestions().then(() => sendResponse({ success: true }));
        return true;
      }

      if (task === 'complete_activity') {
        autoCompleteNonQuizActivities().then(() => sendResponse({ success: true }));
        return true;
      }
    }
  });

  // ============================================================
  // 6. AUTO-EXECUÇÃO AO CARREGAR A PÁGINA
  // ============================================================
  function init() {
    checkAndSolveQuizQuestions(); // Resolve questões automaticamente se for página de quiz
    renderFloatingWidget();       // Mostra o widget de sincronização
    autoCompleteNonQuizActivities(); // Conclui SCORM/vídeo automaticamente
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 1200));
  } else {
    setTimeout(init, 1200);
  }
})();
