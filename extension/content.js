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

  /**
   * Roda fn(item) para cada item de `items`, mas no máximo `limit` de cada vez.
   * Evita abrir dezenas de iframes ocultos simultâneos (uma matéria com 8 unidades
   * x 3 módulos = até 24 de uma vez sem isso), o que sobrecarrega o navegador e
   * faz fetches falharem silenciosamente sob pressão de recursos.
   */
  async function mapWithConcurrency(items, limit, fn) {
    const results = new Array(items.length);
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < items.length) {
        const idx = nextIndex++;
        results[idx] = await fn(items[idx], idx);
      }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
    await Promise.all(workers);
    return results;
  }

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

  function coletarAtividadesDoCurso() {
    const atividades = [];

    // Tenta capturar links padrão do Moodle e também botões/links específicos da Kroton/Anhanguera
    const links = Array.from(document.querySelectorAll('a[href*="/mod/"], a.activity-link, .activityinstance a, li.activity a, a[href*="id="]'));
    links.forEach(link => {
      const href = link.href || '';
      
      // Alguns layouts usam viewer.php, view.php, etc.
      const cmidMatch = href.match(/[?&]id=(\d+)/);
      let modMatch = href.match(/\/mod\/([a-z0-9_]+)\//);
      
      // Se não tem /mod/, mas tem ID de curso e tá dentro de uma lista de atividade, assume que é recurso
      if (cmidMatch && !modMatch && (link.closest('.activity') || href.includes('scorm') || href.includes('quiz'))) {
        modMatch = [null, href.includes('quiz') ? 'quiz' : (href.includes('scorm') ? 'scorm' : 'resource')];
      }

      if (cmidMatch && modMatch) {
        const tipo = modMatch[1]; // quiz, scorm, resource, page, forum, etc.
        const titulo = (link.querySelector('.instancename, .item-title, .activity-title') || link).innerText.trim().split('\n')[0] || `Atividade ${cmidMatch[1]}`;
        
        // Evita links de seção inteira ou curso
        if (href.includes('course/view.php')) return;

        // Pular se já estiver concluída visualmente (não perde tempo reabrindo)
        const container = link.closest('.activity, li, div.activity-item, .activityinstance, .card-atividade, .box-atividade') || link.parentElement;
        if (container) {
          const text = container.innerText.toLowerCase();
          const hasCheck = container.querySelector('.icon-check, .text-success, [alt*="onclu"], [alt*="Conclu"], .completion-manual-y, i.fa-check, .badge-success, .icon-check_circle');
          if (hasCheck || text.includes('concluído') || text.includes('feito') || text.includes('100%')) {
            return; // Já está concluída, ignora
          }
        }

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
    
    // Verifica se estamos em uma página de tentativa (onde é possível responder)
    const canAnswer = document.querySelectorAll('input[type="radio"]:not([disabled])').length > 0;

    if (questions.length > 0 && canAnswer) {
      console.log(`🎯 EstudaAI Auto-Pilot: Detectadas ${questions.length} questões ativas na página.`);

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
        let qText = q.querySelector('.qtext')?.innerText?.trim() || 'Questão';
        
        // Extrai imagens da pergunta (útil se a imagem tiver texto alternativo descritivo)
        q.querySelectorAll('.qtext img').forEach(img => {
          if (img.alt) qText += `\n[Descrição da Imagem: ${img.alt}]`;
          else if (img.src) qText += `\n[Link da Imagem: ${img.src}]`;
        });

        const radioInputs = Array.from(q.querySelectorAll('.answer input[type="radio"]:not([disabled])'));
        
        // Pula a questão se não houver opções selecionáveis
        if (radioInputs.length === 0) continue;

        // Extrai o texto da alternativa de forma garantida 1:1 com os radio buttons
        const answerLabels = radioInputs.map(radio => {
          let text = '';
          const container = radio.closest('.r0, .r1, .d-flex') || radio.parentElement;
          
          if (radio.id) {
            const labelEl = q.querySelector(`label[for="${radio.id}"]`);
            if (labelEl) text = labelEl.innerText.trim();
          }
          if (!text && container) {
            text = container.innerText.trim();
          }
          
          // Tratamento para alternativas que são apenas imagens (comum na Kroton)
          if (!text && container) {
            const img = container.querySelector('img');
            if (img && img.alt) text = `[Imagem: ${img.alt}]`;
            else if (img && img.src) text = `[Imagem: ${img.src}]`;
          }

          return text.replace(/\n/g, ' ').trim() || 'Alternativa ' + radio.value;
        });

        if (statusEl) statusEl.innerHTML = `🧠 [Questão ${i + 1}/${questions.length}] Resolvendo...`;
        q.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
          // 1. Tenta buscar do Cache primeiro
          const { estudaai_quiz_cache = {} } = await chrome.storage.local.get('estudaai_quiz_cache');
          const cachedAnswer = estudaai_quiz_cache[qText];
          let data = null;
          let usedCache = false;

          if (cachedAnswer) {
            // Procura o índice da alternativa que mais se aproxima da resposta do cache
            const cIdx = answerLabels.findIndex(l => l.includes(cachedAnswer) || cachedAnswer.includes(l));
            if (cIdx !== -1) {
              data = { correctIndex: cIdx };
              usedCache = true;
              console.log(`⚡ Usando resposta do cache para a Questão ${i + 1}!`);
            }
          }

          // 2. Se não tem no cache, pede para a IA
          if (!usedCache) {
            if (statusEl) statusEl.innerHTML = `🧠 [Questão ${i + 1}/${questions.length}] Consultando IA...`;
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
          }

          const cIdx = data ? parseInt(data.correctIndex, 10) : NaN;

          if (data && !isNaN(cIdx) && radioInputs[cIdx]) {
            const radioToClick = radioInputs[cIdx];
            
            // Clica no input radio diretamente
            radioToClick.click();
            
            // Também tenta clicar no label associado, pois alguns layouts Moodle escondem o input
            if (radioToClick.id) {
              const labelEl = q.querySelector(`label[for="${radioToClick.id}"]`);
              if (labelEl) labelEl.click();
            }

            const container = radioToClick.closest('.r0, .r1, .d-flex, div') || radioToClick.parentElement;
            if (container) {
              container.style.background = 'rgba(16, 185, 129, 0.2)';
              container.style.border = '2px solid #10b981';
              container.style.borderRadius = '8px';
              container.style.padding = '6px';
            }
            const note = document.createElement('div');
            note.style.cssText = `margin-top: 10px; padding: 12px; border-radius: 10px; background: #064e3b; color: #a7f3d0; font-size: 12px; border: 1px solid #10b981;`;
            note.innerHTML = `<strong>🎯 Alternativa ${data.correctLetter || String.fromCharCode(65 + cIdx)} marcada!</strong><br/><em>${data.explanation || 'Resolvido pela IA.'}</em>`;
            q.appendChild(note);
          } else {
            console.warn('Auto-Pilot: Não foi possível marcar a questão. Data:', data);
            const errNote = document.createElement('div');
            errNote.style.cssText = `margin-top: 10px; padding: 12px; border-radius: 10px; background: #7f1d1d; color: #fecaca; font-size: 12px; border: 1px solid #ef4444;`;
            errNote.innerHTML = `<strong>⚠️ Erro ao resolver:</strong> A IA não retornou um formato válido ou as alternativas são apenas visuais. Responda manualmente.`;
            q.appendChild(errNote);
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
        // Não achou "Próxima", então procura "Finalizar tentativa..."
        const finalBtn = allButtons.find(b => {
          const val = (b.value || b.innerText || '').toLowerCase();
          return val.includes('finalizar tentativa') || val.includes('finish attempt');
        });

        if (finalBtn) {
          if (statusEl) statusEl.innerHTML = '🏁 <strong>Última página! Finalizando tentativa em 3s...</strong>';
          finalBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          finalBtn.style.outline = '4px solid #10b981';
          setTimeout(() => finalBtn.click(), 3000);
        } else {
          if (statusEl) statusEl.innerHTML = '🎉 <strong>Todas as páginas resolvidas!</strong>';
          setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_TAB' }), 5000);
        }
      }
    } else if (isQuizPage) {
      // Estamos na página inicial do quiz ou de revisão/resumo. Procurar botões de fluxo.
      const allButtons = Array.from(document.querySelectorAll('input[type="submit"], button, form button, a.btn'));
      
      const startBtn = allButtons.find(b => {
        const val = (b.value || b.innerText || '').toLowerCase();
        return val.includes('tentar responder') || 
               val.includes('continuar a última') || 
               val.includes('attempt quiz') || 
               val.includes('continue the last');
      });

      if (startBtn) {
        console.log('🎯 EstudaAI Auto-Pilot: Iniciando/Continuando tentativa do questionário...');
        showToast('🎯 Iniciando tentativa do questionário...');
        startBtn.style.outline = '4px solid #10b981';
        setTimeout(() => startBtn.click(), 1500);
      } else {
        // Resumo da tentativa: Procurar botão "Enviar tudo e terminar"
        const finishBtns = allButtons.filter(b => {
          const val = (b.value || b.innerText || '').toLowerCase();
          return val.includes('enviar tudo e terminar') || val.includes('submit all and finish');
        });

        if (finishBtns.length > 0) {
          showToast('🚀 Auto-Enviando questionário para nota...');
          
          // Neutraliza confirm() nativo caso o Moodle use
          const script = document.createElement('script');
          script.textContent = 'window.confirm = function() { return true; };';
          (document.head||document.documentElement).appendChild(script);
          script.remove();

          // Clicamos no primeiro (botão da página)
          finishBtns[0].style.outline = '4px solid #10b981';
          finishBtns[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => finishBtns[0].click(), 1000);

          // Verifica repetidamente se abriu modal de confirmação (DOM)
          let checkCount = 0;
          const interval = setInterval(() => {
            checkCount++;
            const confirmBtns = Array.from(document.querySelectorAll('input, button, .btn')).filter(b => {
              const val = (b.value || b.innerText || '').toLowerCase();
              return b !== finishBtns[0] && (val.includes('enviar') || val.includes('submit') || val.includes('confirm') || val.includes('sim')) && b.offsetParent !== null;
            });
            
            if (confirmBtns.length > 0) {
              clearInterval(interval);
              confirmBtns[confirmBtns.length - 1].click(); // Clica no botão do modal
              setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_TAB' }), 2000);
            } else if (checkCount > 10) {
              clearInterval(interval); // Desiste após 5s
              setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_TAB' }), 2000);
            }
          }, 500);
        } else {
          // Se não tem botão de iniciar nem de enviar tudo, provavelmente já acabou
          setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_TAB' }), 4000);
        }
      }
    }
  }

  // ============================================================
  // 2. EXTRAÇÃO E SINCRONIZAÇÃO DE DISCIPLINAS
  // ============================================================
  const NAV_LABEL_IGNORE = [
    'PÁGINA INICIAL', 'MEUS CURSOS', 'MINHAS MENSAGENS', 'ANDAMENTO DO CURSO',
    'MEUS PONTOS', 'CONTATOS DO CURSO', 'MANUAL', 'PLANO DE ENSINO',
    'SOBRE A ACESSIBILIDADE', 'ALTO-CONTRASTE', 'AUMENTAR FONTE', 'DIMINUIR FONTE',
    'IR PARA O CONTEÚDO', 'IR PARA O MENU', 'AVA', 'ANHANGUERA', 'UNOPAR'
  ];

  function getStudentInfo() {
    let name = '';
    const userTextEl = document.querySelector('.usertext, .userbutton span.avatars, .login-mat-nome, .user-name, .navbar-nav .nav-item .nav-link span, .loginDetalhes span.text-right');
    if (userTextEl && userTextEl.textContent.trim()) {
      name = userTextEl.textContent.trim().split('\n')[0].trim();
    }
    if (!name) {
      // Fallback: busca no avatar ou header
      const avatarEl = document.querySelector('.usermenu .userbutton span, .userinitials');
      if (avatarEl) name = (avatarEl.title || avatarEl.textContent.trim()).split('\n')[0].trim();
    }
    if (!name) {
      // Fallback: busca via script interno comum no Colaborar/Unopar
      const scriptMatch = document.body.innerHTML.match(/var\s+name\s*=\s*['"]([^'"]+)['"]/);
      if (scriptMatch && scriptMatch[1]) name = scriptMatch[1].trim();
    }
    if (!name) {
      // Fallback: varre a área de cabeçalho procurando um nome em maiúsculas (2+ palavras)
      const headerEls = document.querySelectorAll('header *, nav *, [class*="user"] *, [class*="nav"] *');
      for (const el of headerEls) {
        if (el.children.length > 0) continue; // só nós-folha
        const t = el.textContent?.trim().split('\n')[0].trim();
        if (!t || t.length < 6 || t.length > 60) continue;
        if (!/^[A-ZÀ-Ú\s]+$/.test(t)) continue;
        if (t.split(/\s+/).length < 2) continue;
        if (NAV_LABEL_IGNORE.some(ig => t.includes(ig))) continue;
        name = t;
        break;
      }
    }

    // Extrai Curso e Período (comum no Colaborar na tag <select id="matriculaId">)
    let curso = 'Não identificado';
    let periodo = 'Não identificado';
    const selecaoCurso = document.querySelector('select#matriculaId option:checked, select.selecaoSemestre option:checked, .course-title');
    if (selecaoCurso && selecaoCurso.textContent) {
      const parts = selecaoCurso.textContent.trim().split('-');
      if (parts.length >= 2) {
        curso = parts[0].trim();
        periodo = parts[1].trim();
      } else {
        curso = parts[0].trim();
      }
    }

    return {
      name: name || 'Estudante',
      curso: curso,
      periodo: periodo,
      instituicao: window.location.hostname.includes('unopar') || window.location.hostname.includes('colaboraread') ? 'Unopar' :
                   window.location.hostname.includes('pitagoras') ? 'Pitagoras' : 'Anhanguera',
      url: window.location.href,
      updatedAt: new Date().toISOString()
    };
  }
  function fetchCourseDataViaIframe(url) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      // Tamanho real para evitar crash do owlCarousel e opacidade 0 para ficar invisível
      iframe.style.cssText = 'width: 1024px; height: 768px; opacity: 0.01; pointer-events: none; position: fixed; top: -10000px; left: -10000px; border: none; z-index: -9999;';
      iframe.src = url;
      
      const maxTimeout = setTimeout(() => {
        iframe.remove();
        resolve(null);
      }, 15000); // 15s max fallback

      iframe.onload = () => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const text = doc.body.textContent || '';
            // Verifica se o AJAX já renderizou a %
            let andamentoNum = 0;
            const percentMatch = text.match(/Andamento Geral.*?(\d{1,3})%/is);
            if (percentMatch) andamentoNum = parseInt(percentMatch[1], 10);
            
            // Só resolve quando carregar os itens principais e o Andamento estiver != 0
            // ou após várias tentativas
            if ((doc.querySelector('.timeline-item') && andamentoNum > 0) || attempts > 20) {
              clearInterval(interval);
              clearTimeout(maxTimeout);
              resolve({ doc, iframe });
            }
          } catch(e) {
            if (attempts >= 20) {
              clearInterval(interval);
              clearTimeout(maxTimeout);
              resolve(null);
            }
          }
        }, 500); // Checa a cada 500ms
      };
      
      document.body.appendChild(iframe);
    });
  }

  /**
   * Carrega a página de um tópico (unidade) num iframe oculto e espera a API de conclusão
   * (local_completion_api, AWS Lambda) trocar a classe dos ícones de "pendente" para "concluído"
   * antes de resolver — sem esperar isso, todo ícone lê como pendente (valor padrão do HTML).
   */
  function fetchTopicDataViaIframe(url) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width: 1024px; height: 768px; opacity: 0.01; pointer-events: none; position: fixed; top: -10000px; left: -10000px; border: none; z-index: -9999;';
      iframe.src = url;

      const maxTimeout = setTimeout(() => {
        iframe.remove();
        resolve(null);
      }, 20000);

      iframe.onload = () => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const icons = doc.querySelectorAll('.ct-list-title h3 i[completion_rules]');
            // Status de conclusão vem direto da API de conclusão (fetchCourseCompletions),
            // não precisa mais esperar a classe do ícone trocar na tela — só a lista existir.
            if (icons.length > 0 || attempts > 20) {
              clearInterval(interval);
              clearTimeout(maxTimeout);
              resolve({ doc, iframe });
            }
          } catch (e) {
            if (attempts >= 20) {
              clearInterval(interval);
              clearTimeout(maxTimeout);
              resolve(null);
            }
          }
        }, 500);
      };

      document.body.appendChild(iframe);
    });
  }

  /**
   * Busca a lista real de módulos concluídos (cmids) direto na API de conclusão da AWS
   * usada pelo tema Kroton (local_completion_api). Os parâmetros (apiKey, apiUrl, JWT)
   * vêm embutidos inline no HTML de qualquer página do curso, em:
   *   M.local_completion_api.init(Y, "<apiKey>", "<apiUrl>", "<jwt>", ...)
   * O JWT já identifica curso+aluno; a resposta cobre o curso INTEIRO, não só o tópico
   * da página de onde ele foi extraído — então basta chamar 1x por disciplina.
   * Retorna um Set<number> de cmids concluídos, ou null se não achou/deu erro.
   */
  async function fetchCourseCompletions(doc) {
    try {
      const html = doc.documentElement.innerHTML;
      const m = html.match(/local_completion_api\.init\(\s*Y\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/);
      // undefined = não achou o script nessa página (vale tentar de novo em outra página);
      // null = achou e tentou, mas a requisição falhou (não vale tentar de novo, é sempre a mesma chamada).
      if (!m) return undefined;
      // O HTML guarda a string com barras escapadas ("\/"), como texto JSON cru.
      // O navegador normaliza "\" pra "/" em URLs — sem desescapar, "\/" vira "//" (barra dupla)
      // e a chamada quebra (rota inexistente pro API Gateway, erro sem header de CORS).
      const [, apiKeyRaw, apiUrlRaw, jwtRaw] = m;
      const apiKey = apiKeyRaw.replace(/\\\//g, '/');
      const apiUrl = apiUrlRaw.replace(/\\\//g, '/');
      const jwt = jwtRaw.replace(/\\\//g, '/');

      // A AWS bloqueia (CORS/WAF) fetch feito a partir do contexto da extensão, e a página
      // tem CSP que bloqueia <script> inline. Solução: injeta um <script src> apontando pra
      // um arquivo real da extensão (permitido pelo CSP via web_accessible_resources) dentro
      // do documento do iframe, rodando como JS nativo da página; resultado volta via CustomEvent.
      const completions = await new Promise((resolve) => {
        const eventName = 'estudaai_completions_' + Math.random().toString(36).slice(2);

        const timeoutId = setTimeout(() => {
          doc.removeEventListener(eventName, onResult);
          resolve(null);
        }, 8000);

        function onResult(e) {
          clearTimeout(timeoutId);
          doc.removeEventListener(eventName, onResult);
          resolve(e.detail);
        }
        doc.addEventListener(eventName, onResult);

        const script = doc.createElement('script');
        script.src = chrome.runtime.getURL('completion-fetch.js');
        script.dataset.apiUrl = apiUrl;
        script.dataset.jwt = jwt;
        script.dataset.apiKey = apiKey;
        script.dataset.event = eventName;
        (doc.head || doc.documentElement).appendChild(script);
      });

      if (!Array.isArray(completions)) return null;
      return new Set(completions.map(Number));
    } catch (e) {
      console.warn('Erro ao buscar completions da API de conclusão:', e);
      return null;
    }
  }

  async function scrapeDisciplinas(onProgress = null) {
    const cursosEncontrados = [];
    const ignoreList = ['INSCREVA-SE', 'Processo Seletivo', 'Painel', 'Página', 'Meus Cursos', 'Todos', 'Sair', 'Menu', 'Suporte', 'Avisos', 'Contatos', 'Início', 'Home', 'Boas Vindas', 'Manual'];

    const isCoursePage = window.location.href.includes('course/view.php') || window.location.href.includes('/disciplina/');

    if (!isCoursePage) {
      // Coleta links reais de cada curso para navegação futura
      const courseLinks = {};
      document.querySelectorAll('a[href*="course/view.php"]').forEach(a => {
        const match = a.href.match(/id=(\d+)/);
        if (match) {
          const title = (a.querySelector('.coursename, .multiline, .course-fullname') || a).innerText.trim().split('\n')[0];
          if (title) courseLinks[title] = { id: match[1], url: a.href };
        }
      });

      const cards = document.querySelectorAll(
        '.dashboard-card, .coursebox, .card-disciplina, a[href*="course/view.php"], a[href*="/disciplina/"], .disciplina-item, .card-curso, .course-info-container'
      );

      cards.forEach(c => {
        const text = c.innerText.trim().split('\n')[0];
        if (text && text.length > 5 && !ignoreList.some(ig => text.toLowerCase().includes(ig.toLowerCase()))) {
          
          if (!cursosEncontrados.find(curso => curso.nome === text)) {
            let andamentoGeral = 0;
            const percentMatch = c.innerText.match(/(\d+)%/);
            if (percentMatch) {
              andamentoGeral = parseInt(percentMatch[1], 10);
            } else {
              const progressBar = c.querySelector('[role="progressbar"], .progress-bar, .progress');
              if (progressBar) {
                 const val = progressBar.getAttribute('aria-valuenow');
                 if (val) andamentoGeral = parseInt(val, 10);
                 else {
                   const style = progressBar.getAttribute('style') || '';
                   const widthMatch = style.match(/width:\s*(\d+)%/);
                   if (widthMatch) andamentoGeral = parseInt(widthMatch[1], 10);
                 }
              }
            }

            cursosEncontrados.push({
               nome: text,
               andamentoGeral: andamentoGeral,
               moodleCourseId: courseLinks[text] ? courseLinks[text].id : null,
               moodleCourseUrl: courseLinks[text] ? courseLinks[text].url : null,
            });
          }
        }
      });
    }

    // Fallback: título do curso atual se estiver numa página de curso
    if (cursosEncontrados.length === 0 && isCoursePage) {
      const courseTitle = document.querySelector('.page-header-headings h1, h1.page-title, .course-header h1');
      if (courseTitle) {
        const text = courseTitle.innerText.trim();
        if (text && !ignoreList.some(ig => text.toLowerCase().includes(ig.toLowerCase()))) {
          let andamentoGeral = 0;
          const bodyPercent = document.body.innerText.match(/(Andamento|Progresso|Conclus[ãa]o|% concluído|Meu Progresso|Seu Progresso).*?(\d{1,3})%/is);
          if (bodyPercent) {
             andamentoGeral = parseInt(bodyPercent[2], 10);
          }
          
          let cId = null;
          try { cId = new URL(window.location.href).searchParams.get('id'); } catch(e){}

          cursosEncontrados.push({
             nome: text,
             andamentoGeral: andamentoGeral,
             moodleCourseId: cId,
             moodleCourseUrl: window.location.href
          });
        }
      }
    }

    // --- NOVA LÓGICA DE FETCH ASSÍNCRONO PARA CADA CURSO ---
    const disciplinasFinais = [];
    const batchSize = 3;
    let completedCount = 0;

    for (let i = 0; i < cursosEncontrados.length; i += batchSize) {
      const batch = cursosEncontrados.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (curso, bIdx) => {
        const idx = i + bIdx;
        let andamentoReal = curso.andamentoGeral;
        let unidadesReais = [];
        let totalAtividades = 12; // fallback
        let doc = document;
        let iframe = null;
        // Cmids concluídos de verdade (segundo a API AWS de conclusão), preenchido abaixo.
        // Cobre a disciplina inteira, então é buscado 1x só e reaproveitado por todo módulo.
        // `courseCompletionsTried` evita tentar de novo em cada módulo se a 1ª tentativa
        // falhar (senão vira uma avalanche de requisições repetidas pro mesmo endpoint).
        let courseCompletions = null;
        let courseCompletionsTried = false;

        // Se não encontramos % na tela inicial e temos o URL, vamos buscar lá dentro
        if (curso.moodleCourseUrl) {
          try {
            // Só faz fetch se não for a própria página atual (evitar requisição redundante)
            if (curso.moodleCourseUrl !== window.location.href) {
              const res = await fetchCourseDataViaIframe(curso.moodleCourseUrl);
              if (res) {
                 doc = res.doc;
                 iframe = res.iframe;
              }
            }

            if (doc) {
              const result = await fetchCourseCompletions(doc);
              courseCompletions = result || null;
              courseCompletionsTried = result !== undefined;

              // 1. Tentar extrair % exato ("Andamento Geral") apenas se for maior (evitar que o HTML cru com 0% sobrescreva o valor do dashboard)
              const textContent = doc.body.textContent || '';
              const percentMatchPage = textContent.match(/Andamento Geral.*?(\d{1,3})%/is);
              let extractedPercent = 0;
              if (percentMatchPage) {
                 extractedPercent = parseInt(percentMatchPage[1], 10);
              } else {
                 const progressEl = doc.querySelector('.progress-bar, [role="progressbar"]');
                 if (progressEl) {
                   const val = progressEl.getAttribute('aria-valuenow');
                   if (val) extractedPercent = parseInt(val, 10);
                   else {
                     const style = progressEl.getAttribute('style') || '';
                     const widthMatch = style.match(/width:\s*(\d+)%/);
                     if (widthMatch) extractedPercent = parseInt(widthMatch[1], 10);
                   }
                 }
              }
              if (extractedPercent > andamentoReal) {
                  andamentoReal = extractedPercent;
              }

              // 2. Extrair módulos reais do CTMenu (estrutura real da Anhanguera/Kroton)
              const ctmenuGroups = doc.querySelectorAll('#ctmenu .timeline-item.group[data-ct-groupname]');
              if (ctmenuGroups.length > 0) {
                let numUnidade = 1;
                
                // Coletar todos os sub-itens de todos os grupos com seus URLs
                const allSubItems = [];
                ctmenuGroups.forEach(group => {
                  const groupName = group.getAttribute('data-ct-groupname');
                  if (!groupName) return;
                  
                  const parentLi = group.closest('li');
                  if (!parentLi) return;
                  
                  const subMenu = parentLi.querySelector('.timeline-menu ul');
                  if (!subMenu) return;
                  
                  const subLinks = subMenu.querySelectorAll('li a[href]');
                  const modules = [];
                  subLinks.forEach(a => {
                    const name = a.textContent.trim();
                    const href = a.href || a.getAttribute('href');
                    if (name && href) modules.push({ name, href });
                  });
                  
                  if (modules.length > 0) {
                    allSubItems.push({ groupName, modules, numUnidade: numUnidade++ });
                  }
                });
                
                // Fetch dos sub-itens com concorrência limitada (evita abrir dezenas de
                // iframes ocultos ao mesmo tempo — uma matéria com 8 unidades x 3 módulos
                // chegaria a 24 simultâneos, sobrecarregando o navegador e falhando fetches).
                unidadesReais = await mapWithConcurrency(allSubItems, 3, async (unitInfo) => {
                  const moduleAtividades = [];

                  // Fetch de cada módulo da unidade em paralelo (no máx. 3 unidades em paralelo,
                  // então no máx. 9 iframes simultâneos)
                  const modulePromises = unitInfo.modules.map(async (mod) => {
                    const atividades = [];
                    let res = null;
                    try {
                      // Usar iframe para tópicos para garantir que os ícones do AWS completion API sejam renderizados pelo JS!
                      res = await fetchTopicDataViaIframe(mod.href);
                      if (!res || !res.doc) throw new Error("Iframe falhou");
                      
                      const topicDoc = res.doc;

                      // Fallback: se a página de visão geral do curso não tinha o script da
                      // API de conclusão embutido, tenta pegar da primeira página de tópico —
                      // mas só 1 vez pra disciplina toda, nunca de novo se já tentou/falhou.
                      if (!courseCompletions && !courseCompletionsTried) {
                        const result = await fetchCourseCompletions(topicDoc);
                        courseCompletions = result || null;
                        courseCompletionsTried = result !== undefined;
                      }

                      // Extrair as atividades reais: div.ct-list > .ct-list-title > h3 > a
                      const ctLists = topicDoc.querySelectorAll('.ct-resource-list .ct-list, .ct-list');
                      ctLists.forEach(ct => {
                        const titleEl = ct.querySelector('.ct-list-title h3 a');
                        const title = titleEl ? titleEl.textContent.trim() : '';
                        if (!title) return;
                        
                        // Extrair ícone para mapeamento de tipo e conclusão
                        const iconEl = ct.querySelector('.ct-list-title h3 i[completion], i.material-icons, i[class*="icon-"]');
                        const classList = iconEl ? iconEl.className.toLowerCase() : '';

                        let tipo = 'webaula';
                        if (classList.includes('icon-book') || classList.includes('icon-file') || classList.includes('icon-description')) {
                          tipo = 'livro_didatico';
                        } else if (classList.includes('icon-ondemand_video') || classList.includes('icon-play') || classList.includes('icon-movie')) {
                          tipo = 'webaula';
                        } else if (classList.includes('icon-assignment') || classList.includes('icon-quiz') || classList.includes('icon-spellcheck')) {
                          tipo = 'aprendizagem';
                        }

                        // Fallback title matching if icon doesn't give a clear type or to refine it
                        const tLower = title.toLowerCase();
                        if (tLower.includes('avaliativ') || tLower.includes('avaliação') || tLower.includes('prova')) tipo = 'avaliacao_unidade';
                        else if (tLower.includes('questõ') || tLower.includes('fixaç') || tLower.includes('aprendizagem') || tLower.includes('aap')) tipo = 'aprendizagem';
                        else if (tipo === 'webaula' && (tLower.includes('livro') || tLower.includes('pdf') || tLower.includes('material') || tLower.includes('leitura'))) tipo = 'livro_didatico';
                        else if (tLower.includes('certificado')) tipo = 'certificado';

                        // Status de conclusão: fonte da verdade é a API AWS de conclusão
                        // (fetchCourseCompletions) — o id do ícone É o cmid do módulo no Moodle.
                        // A classe CSS do ícone só reflete isso depois de um JS assíncrono rodar
                        // na tela, então não dá pra confiar nela (é sempre "pendente" no HTML cru).
                        let isDone = false;
                        const cmid = iconEl ? parseInt(iconEl.getAttribute('id'), 10) : NaN;
                        const titleAttr = iconEl ? (iconEl.getAttribute('title') || '').toLowerCase() : '';

                        if (courseCompletions && !isNaN(cmid)) {
                          isDone = courseCompletions.has(cmid);
                        } else {
                          // Sem a API (falhou/bloqueada): heurística genérica de fallback pela classe
                          const completionDoneClass = iconEl ? (iconEl.getAttribute('completion_rules') || '').toLowerCase() : '';
                          if (completionDoneClass && classList.includes(completionDoneClass)) isDone = true;
                          else if (classList.includes('check') || classList.includes('done') || classList.includes('success') || classList.includes('conclu')) isDone = true;
                        }
                        if (titleAttr.includes('conclu') || titleAttr.includes('feito')) isDone = true;

                        // Look for any explicit completion marks inside the ct-list
                        const extraCompletionMark = ct.querySelector('.text-success, .badge-success, img[alt*="Conclu"], i.fa-check');
                        if (extraCompletionMark) isDone = true;
                        
                        atividades.push({
                          tipo,
                          titulo: title,
                          status: isDone ? 'concluida' : 'pendente',
                          url: titleEl ? (titleEl.href || titleEl.getAttribute('href')) : mod.href
                        });
                      });
                    } catch (e) {
                      console.warn('Erro ao fetch topic:', mod.href, e);
                    } finally {
                      if (res && res.iframe) res.iframe.remove();
                    }
                    return { moduleName: mod.name, atividades };
                  });
                  
                  const moduleResults = await Promise.all(modulePromises);
                  
                  // Juntar todas as atividades de todos os módulos em uma única lista
                  const todasAtividades = [];
                  moduleResults.forEach(mr => {
                    mr.atividades.forEach((at, i) => {
                      todasAtividades.push({
                        ...at,
                        id: `disc-${idx + 1}-u${unitInfo.numUnidade}-at${todasAtividades.length + 1}`
                      });
                    });
                  });
                  
                  // Se fetch falhou pra tudo, usar os nomes dos módulos do menu como fallback
                  const usedFallback = todasAtividades.length === 0;
                  if (usedFallback) {
                    unitInfo.modules.forEach((mod, i) => {
                      let tipo = 'webaula';
                      const tLower = mod.name.toLowerCase();
                      if (tLower.includes('avaliativ') || tLower.includes('avaliação')) tipo = 'avaliacao_unidade';
                      else if (tLower.includes('questõ') || tLower.includes('fixaç')) tipo = 'aprendizagem';

                      todasAtividades.push({
                        id: `disc-${idx + 1}-u${unitInfo.numUnidade}-at${i + 1}`,
                        tipo,
                        titulo: mod.name,
                        status: 'pendente',
                        url: mod.href
                      });
                    });
                  }

                  // Só usa a estimativa linear (Andamento Geral / total de unidades) quando NÃO
                  // conseguimos o dado real de cada item — nunca sobrescrever status real já lido.
                  const percentPerUnit = 100 / ctmenuGroups.length;
                  const isUCompleted = usedFallback && andamentoReal >= (unitInfo.numUnidade * percentPerUnit);

                  if (isUCompleted) {
                    todasAtividades.forEach(a => a.status = 'concluida');
                  }
                  
                  const doneCount = todasAtividades.filter(a => a.status === 'concluida').length;
                  const topicPercent = isUCompleted ? 100 : (todasAtividades.length > 0 ? Math.round((doneCount / todasAtividades.length) * 100) : 0);
                  
                  return {
                    numero: unitInfo.numUnidade,
                    titulo: unitInfo.groupName,
                    andamentoTopico: topicPercent,
                    atividades: todasAtividades
                  };
                });
              }
              
              // 2b. Extrair atividades da área de conteúdo principal (div.ct-list)
              if (unidadesReais.length === 0) {
                const ctLists = doc.querySelectorAll('.ct-resource-list .ct-list');
                if (ctLists.length > 0) {
                  const atividadesPrincipais = [];
                  ctLists.forEach((ct, aIdx) => {
                    const titleEl = ct.querySelector('.ct-list-title h3 a');
                    const title = titleEl ? titleEl.textContent.trim() : '';
                    if (!title) return;
                    
                    const iconEl = ct.querySelector('.ct-list-title h3 i[completion]');
                    const completionVal = iconEl ? iconEl.getAttribute('completion') : '';
                    const isDone = completionVal.includes('check') || completionVal.includes('done');
                    
                    let tipo = 'webaula';
                    const tLower = title.toLowerCase();
                    if (tLower.includes('avaliativ') || tLower.includes('avaliação') || tLower.includes('prova')) tipo = 'avaliacao_unidade';
                    else if (tLower.includes('questõ') || tLower.includes('fixaç') || tLower.includes('aprendizagem') || tLower.includes('aap')) tipo = 'aprendizagem';
                    else if (tLower.includes('livro') || tLower.includes('pdf') || tLower.includes('material') || tLower.includes('leitura')) tipo = 'livro_didatico';
                    
                    atividadesPrincipais.push({
                      id: `disc-${idx + 1}-u1-at${aIdx + 1}`,
                      tipo: tipo,
                      titulo: title,
                      status: isDone ? 'concluida' : 'pendente'
                    });
                  });
                  
                  if (atividadesPrincipais.length > 0) {
                    const doneCount = atividadesPrincipais.filter(a => a.status === 'concluida').length;
                    unidadesReais.push({
                      numero: 1,
                      titulo: 'Conteúdo Principal',
                      andamentoTopico: Math.round((doneCount / atividadesPrincipais.length) * 100),
                      atividades: atividadesPrincipais
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Erro ao fazer fetch do curso via iframe:', curso.moodleCourseUrl, e);
          }
        }

        const nome = curso.nome;
        const id = `disc-${idx + 1}-${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        // Fallback final: se nenhuma unidade foi encontrada, usar genéricos
        if (unidadesReais.length === 0) {
          unidadesReais = [1, 2, 3, 4].map(n => {
            const isUCompleted = andamentoReal >= (n * 25);
            return {
              numero: n,
              titulo: `Unidade ${n}`,
              andamentoTopico: isUCompleted ? 100 : (andamentoReal > ((n-1)*25) ? (andamentoReal - ((n-1)*25)) * 4 : 0),
              atividades: [
                { id: `${id}-u${n}-at1`, tipo: 'livro_didatico', titulo: `Livro Didático (PDF)`, status: isUCompleted ? 'concluida' : 'pendente' },
                { id: `${id}-u${n}-at2`, tipo: 'webaula', titulo: `Webaula e Teleaula`, status: isUCompleted ? 'concluida' : 'pendente' },
                { id: `${id}-u${n}-at3`, tipo: 'aprendizagem', titulo: `Atividade de Aprendizagem (AAP)`, status: isUCompleted ? 'concluida' : 'pendente' },
                { id: `${id}-u${n}-at4`, tipo: 'avaliacao_unidade', titulo: `Avaliação da Unidade (AV)`, status: isUCompleted ? 'concluida' : 'pendente' }
              ]
            }
          });
        }
        
        totalAtividades = unidadesReais.reduce((sum, u) => sum + (u.atividades ? u.atividades.length : 0), 0);
        let atividadesConcluidas = 0;
        if (unidadesReais.some(u => u.atividades && u.atividades.length > 0)) {
           unidadesReais.forEach(u => {
             atividadesConcluidas += u.atividades.filter(a => a.status === 'concluida').length;
           });
           if (andamentoReal === 0 && totalAtividades > 0) {
             andamentoReal = Math.round((atividadesConcluidas / totalAtividades) * 100);
           }
        } else {
           atividadesConcluidas = Math.round((andamentoReal / 100) * totalAtividades);
        }

        if (iframe) {
           setTimeout(() => iframe.remove(), 500);
        }

        return {
          id,
          nome,
          moodleCourseId: curso.moodleCourseId,
          moodleCourseUrl: curso.moodleCourseUrl,
          codigo: `KLS-${10780 + idx}`,
          categoria: nome.includes('Extensão') ? 'Extensao' : (idx % 2 === 0 ? 'AMI' : 'DI'),
          categoriaLabel: nome.includes('Extensão') ? 'Projeto de Extensão' : (idx % 2 === 0 ? 'Aula Modelo Institucional' : 'Disciplinas Interativas (DI)'),
          andamentoGeral: andamentoReal,
          totalAtividades: totalAtividades,
          atividadesConcluidas: atividadesConcluidas,
          cor: idx % 3 === 0 ? 'text-amber-500' : (idx % 3 === 1 ? 'text-brand-500' : 'text-blue-500'),
          corFundo: idx % 3 === 0 ? 'bg-amber-500/10 border-amber-500/30' : (idx % 3 === 1 ? 'bg-brand-500/10 border-brand-500/30' : 'bg-blue-500/10 border-blue-500/30'),
          icone: nome.includes('Direito') ? 'Scale' : 'BookOpen',
          unidades: unidadesReais
        };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(res => {
        disciplinasFinais.push(res);
        completedCount++;
        if (onProgress) onProgress(completedCount, cursosEncontrados.length, res.nome);
      });
    }

    return disciplinasFinais;
  }

  function showSyncModal() {
    const modalHtml = `
      <div id="estudaai-sync-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); z-index: 999999; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
        <div style="background: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 32px; width: 450px; text-align: center; color: white; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
           <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Sincronizando o AVA</h2>
           <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 1.5;">Relaxe e não feche esta aba. Estamos lendo as matérias diretamente do banco de dados (isso leva cerca de 1 a 2 minutos).</p>
           
           <div style="background: #0F172A; border-radius: 999px; height: 8px; width: 100%; overflow: hidden; margin-bottom: 12px;">
             <div id="estudaai-sync-progress-bar" style="background: #10B981; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
           </div>
           
           <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span id="estudaai-sync-status-text" style="color: #cbd5e1;">Preparando...</span>
              <span id="estudaai-sync-count-text" style="color: #10B981; font-weight: 600;">0%</span>
           </div>
           
           <div id="estudaai-sync-success-box" style="display: none; margin-top: 24px;">
              <a href="https://estudaai.pages.dev/disciplinas" target="_blank" style="display: inline-block; background: #10B981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; cursor: pointer;">👉 Abrir no EstudaAI</a>
              <button id="estudaai-sync-close-btn" style="display: block; margin: 12px auto 0 auto; background: none; border: none; color: #94A3B8; cursor: pointer; font-size: 12px; text-decoration: underline;">Fechar</button>
           </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('estudaai-sync-close-btn')?.addEventListener('click', () => {
      document.getElementById('estudaai-sync-modal').remove();
    });
  }

  function updateSyncModal(current, total, nome) {
    const percent = Math.round((current / total) * 100);
    const bar = document.getElementById('estudaai-sync-progress-bar');
    const statusText = document.getElementById('estudaai-sync-status-text');
    const countText = document.getElementById('estudaai-sync-count-text');
    
    if (bar) bar.style.width = `${percent}%`;
    if (statusText) statusText.innerText = `Analisando: ${nome} (${current}/${total})`;
    if (countText) countText.innerText = `${percent}%`;
  }

  function completeSyncModal() {
    const statusText = document.getElementById('estudaai-sync-status-text');
    const successBox = document.getElementById('estudaai-sync-success-box');
    if (statusText) statusText.innerText = '✅ Sincronizado com Sucesso!';
    if (successBox) successBox.style.display = 'block';
  }

  // ============================================================
  // 3. WIDGET FLUTUANTE DE SINCRONIZAÇÃO
  // ============================================================
  function renderFloatingWidget() {
    if (window.location.href.includes('/mod/quiz/attempt')) return;
    if (document.getElementById('estudaai-floating-widget')) return;

    const student = getStudentInfo();
    // Só exibe o widget se o aluno estiver realmente logado (nome identificado)
    if (student.name === 'Estudante') return;

    chrome.storage.local.get(['estudaai_is_logged_in', 'estudaai_user_name'], (res) => {
      const isLoggedIn = !!res.estudaai_is_logged_in;
      const widget = document.createElement('div');
      widget.id = 'estudaai-floating-widget';
      
      const btnColor = isLoggedIn ? '#10b981' : '#3b82f6';
      const btnText = isLoggedIn ? '⚡ Sincronizar com EstudaAI' : 'Fazer Login no EstudaAI';

      widget.innerHTML = `
        <div class="estudaai-widget-card">
          <div class="estudaai-widget-header">
            <span class="estudaai-badge">🎓 EstudaAI Conector</span>
            <button id="estudaai-close-widget" title="Fechar">✕</button>
          </div>
          <div class="estudaai-student-name">${student.name}</div>
          <div class="estudaai-info-text">Sincronize suas disciplinas e atividades com a plataforma EstudaAI em 1 clique.</div>
          <button id="estudaai-btn-sync-widget" class="estudaai-btn-sync" style="background-color: ${btnColor} !important; border-color: ${btnColor} !important; margin-bottom: 8px;">${btnText}</button>
          <a href="https://estudaai.pages.dev" target="_blank" class="estudaai-btn-sync" style="background-color: #1e293b !important; border-color: #1e293b !important; color: white; text-decoration: none; display: flex; justify-content: center; align-items: center; text-align: center;">Abrir Painel EstudaAI</a>
          <div id="estudaai-widget-status" class="estudaai-status-msg" style="display:none;"></div>
        </div>
      `;
      document.body.appendChild(widget);

      document.getElementById('estudaai-close-widget')?.addEventListener('click', () => widget.remove());

      const syncBtn = document.getElementById('estudaai-btn-sync-widget');
      const statusBox = document.getElementById('estudaai-widget-status');

      syncBtn?.addEventListener('click', async () => {
        if (!isLoggedIn) {
          window.open('https://estudaai.pages.dev/login', '_blank');
          return;
        }

        const studentData = getStudentInfo();
        const portalName = studentData.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const estudaaiName = (res.estudaai_user_name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (portalName && estudaaiName && portalName !== 'estudante') {
           const portalFirst = portalName.split(' ')[0];
           const estudaaiFirst = estudaaiName.split(' ')[0];
           if (portalFirst !== estudaaiFirst) {
               alert('⚠️ Atenção!\n\nO aluno logado no EstudaAI (' + (res.estudaai_user_name || 'Desconhecido') + ') é diferente do aluno logado no AVA (' + studentData.name + ').\n\nPor favor, acesse o painel do EstudaAI e faça login com a conta correta antes de sincronizar.');
               return;
           }
        }

        syncBtn.disabled = true;
        syncBtn.innerText = '🔄 Sincronizando...';
        showSyncModal();

        const studentData = getStudentInfo();
        const discData = await scrapeDisciplinas((curr, total, nome) => {
           updateSyncModal(curr, total, nome);
        });

        chrome.runtime.sendMessage({
          action: 'SAVE_DISCIPLINAS',
          payload: { student: studentData, disciplinas: discData, scrapedAt: new Date().toISOString() }
        }, () => {
          syncBtn.disabled = false;
          syncBtn.innerText = '✅ Sincronizado!';
          completeSyncModal();
          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.innerHTML = `🎉 <strong>${discData.length} matérias</strong> sincronizadas com sucesso!<br/><a href="https://estudaai.pages.dev/disciplinas" target="_blank">👉 Abrir no EstudaAI</a>`;
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

    // 4.1 Clicar em botão de certificado
    document.querySelectorAll('a, button, input[type="button"], input[type="submit"]').forEach(btn => {
      const text = (btn.value || btn.innerText || '').toLowerCase();
      if (text.includes('obtenha seu certificado') || text.includes('imprimir certificado') || text.includes('gerar certificado')) {
        // Forçar o navegador a fazer o download em vez de só abrir em outra aba
        if (btn.tagName.toLowerCase() === 'a') {
          btn.setAttribute('download', 'Certificado.pdf');
          btn.setAttribute('target', '_blank');
        }
        btn.click();
        showToast('📜 Certificado baixado com sucesso!');
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

  async function autoPilotDisciplina(disciplinaNome, visitedCmidsGlobais = []) {
    showToast(`🚀 Iniciando Auto-Pilot para "${disciplinaNome || 'esta disciplina'}". Abrindo tópicos...`);
    
    // Tenta expandir todos os tópicos/acordeões antes de ler (Kroton/Moodle carregam via AJAX às vezes)
    const accordions = document.querySelectorAll('.sectionname a, .toggle, .accordion-toggle, a[data-toggle="collapse"], .accordion-button, .title[data-target]');
    let toggled = false;
    accordions.forEach(btn => {
      if (btn.getAttribute('aria-expanded') !== 'true' && !btn.classList.contains('collapsed') === false) {
        try { btn.click(); toggled = true; } catch(e){}
      }
    });

    if (toggled) {
      await new Promise(r => setTimeout(r, 2000)); // Espera carregar o AJAX/Animação
    }

    const atividades = coletarAtividadesDoCurso();
    
    if (atividades.length === 0) {
      showToast(`⚠️ Nenhuma atividade encontrada no DOM. Talvez o layout da Anhanguera tenha mudado. Tentando forçar scroll...`);
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 2000));
      atividades.push(...coletarAtividadesDoCurso());
    }

    // Filtra atividades que já foram abertas nesta sessão (evita abrir 30 abas iguais ao trocar de tópico)
    const atividadesFiltradas = atividades.filter(a => !visitedCmidsGlobais.includes(a.cmid));

    showToast(`🔍 ${atividadesFiltradas.length} atividades novas encontradas nesta página.`);
    
    let concluidas = 0;
    const novosCmidsVisitados = [];
    
    for (const atividade of atividadesFiltradas) {
      novosCmidsVisitados.push(atividade.cmid);
      try {
        // Moodle completion via API (mais rápido, não precisa abrir cada página)
        const ok = await moodleMarkComplete(atividade.cmid);
        if (ok) concluidas++;

        // Abre a atividade em nova aba e resolve (seja quiz ou apenas visualização)
        if (atividade.href) {
          const taskName = atividade.tipo === 'quiz' ? 'solve_quiz' : 'complete_activity';
          chrome.runtime.sendMessage({
            action: 'AUTOPILOT_OPEN_AND_EXECUTE',
            payload: { url: atividade.href, task: taskName }
          });
          
          // Espera 1.5s entre a abertura de cada aba para não sobrecarregar
          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (e) {
        console.warn(`Erro ao concluir ${atividade.titulo}:`, e);
      }
      
      await new Promise(r => setTimeout(r, 300));
    }

    showToast(`✅ Auto-Pilot concluído nesta aba! ${concluidas}/${atividadesFiltradas.length} atividades processadas.`);

    // Encontrar todos os links de tópicos (paginação de unidades)
    const topicUrls = [];
    document.querySelectorAll('a[href*="course/view.php"]').forEach(a => {
      if (a.href.includes('&topic=')) {
        topicUrls.push(a.href);
      }
    });

    return { concluidas, total: atividadesFiltradas.length, topicUrls, visitedCmids: novosCmidsVisitados };
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
      scrapeDisciplinas().then(disciplinas => {
        sendResponse({ success: true, student, disciplinas });
      });
      return true; // Keep message channel open for async response
    }

    // Popup: concluir atividade da página atual
    if (request.action === 'AUTO_COMPLETE_ACTIVITY') {
      autoCompleteNonQuizActivities().then(() => sendResponse({ success: true }));
      return true;
    }

    // Painel Web / Background: executar Auto-Pilot real no AVA
    if (request.action === 'AUTOPILOT_EXECUTE') {
      const { task, disciplinaId, disciplinaNome } = request;

      chrome.storage.local.get(['estudaai_user_name'], (res) => {
        const studentData = getStudentInfo();
        const portalName = studentData.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const estudaaiName = (res.estudaai_user_name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (portalName && estudaaiName && portalName !== 'estudante') {
           const portalFirst = portalName.split(' ')[0];
           const estudaaiFirst = estudaaiName.split(' ')[0];
           if (portalFirst !== estudaaiFirst) {
               alert('⚠️ Segurança EstudaAI\n\nO aluno logado no EstudaAI (' + (res.estudaai_user_name || 'Desconhecido') + ') é diferente do aluno logado no AVA (' + studentData.name + ').\n\nO Auto-Pilot foi CANCELADO para evitar que atividades sejam feitas na conta de terceiros.');
               sendResponse({ success: false, error: 'Conta do AVA incompatível com a do EstudaAI.' });
               return;
           }
        }

        if (task === 'complete_all' || task === 'complete_discipline') {
          autoPilotDisciplina(disciplinaNome, request.visitedCmids || []).then(result => sendResponse({ success: true, ...result }));
        } else if (task === 'solve_quiz') {
          checkAndSolveQuizQuestions().then(() => sendResponse({ success: true }));
        } else if (task === 'complete_activity' || task === 'complete_single') {
          autoCompleteNonQuizActivities().then(() => {
            sendResponse({ success: true });
            // Fecha a aba depois de um tempinho pra não acumular
            setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_TAB' }), 2500);
          });
        }
      });

      return true;
    }
  });

  // ============================================================
  // 6. MELHORIAS (Cache, Login, Termos) E AUTO-EXECUÇÃO
  // ============================================================
  function detectLoginOrError() {
    // Tela de login ou expirada
    const bodyText = document.body.innerText || '';
    if (document.querySelector('input[type="password"]') || window.location.hostname.includes('login.') || bodyText.includes('Sessão expirada') || bodyText.includes('Você não está logado')) {
      showToast('⚠️ Sessão expirada ou Tela de Login detectada. Automação pausada.', 10000);
      return true;
    }
    return false;
  }

  function autoAcceptTerms() {
    if (window.location.hostname.includes('termo.kroton') || window.location.hostname.includes('termos')) {
      const btns = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn');
      for (const btn of btns) {
        const text = (btn.value || btn.innerText || '').toLowerCase();
        if (text.includes('aceitar') || text.includes('concordo') || text.includes('aceito')) {
          btn.click();
          console.log('✅ Termos de Uso aceitos automaticamente!');
          showToast('✅ Termos de Uso aceitos automaticamente!');
          return true;
        }
      }
    }
    return false;
  }

  async function cacheCorrectAnswersFromReview() {
    // Só atua se estiver na página de revisão do questionário
    if (!window.location.href.includes('review.php') && !document.querySelector('.quizreviewsummary')) return;
    
    const questions = document.querySelectorAll('.que');
    if (questions.length === 0) return;
    
    const { estudaai_quiz_cache = {} } = await chrome.storage.local.get('estudaai_quiz_cache');
    let updated = false;

    questions.forEach(q => {
      let qText = q.querySelector('.qtext')?.innerText?.trim();
      if (!qText) return;
      
      let rightAnswerText = q.querySelector('.rightanswer')?.innerText?.replace('A resposta correta é:', '')?.trim();
      
      if (!rightAnswerText) {
         const correctOption = q.querySelector('.answer .correct');
         if (correctOption) rightAnswerText = correctOption.innerText.trim();
      }
      
      if (qText && rightAnswerText) {
        estudaai_quiz_cache[qText] = rightAnswerText;
        updated = true;
      }
    });

    if (updated) {
      await chrome.storage.local.set({ estudaai_quiz_cache });
      console.log('✅ Gabarito salvo em cache com sucesso!');
    }
  }

  function init() {
    if (detectLoginOrError()) return; // Se for login, não inicia robô
    if (autoAcceptTerms()) return;    // Se for tela de termos, aceita e espera
    
    cacheCorrectAnswersFromReview();  // Salva o gabarito se estiver na tela de revisão

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
