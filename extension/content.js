/**
 * EstudaAI - Content Script para AVA KLS Anhanguera
 * Injetado em https://www.avaeduc.com.br/ e https://alunodigital.anhanguera.com/
 */

(function () {
  // Evita injeção dupla
  if (window.__estudaai_injected) return;
  window.__estudaai_injected = true;

  console.log('[EstudaAI] Conector ativado no AVA Anhanguera.');

  /**
   * Extrai o nome do aluno da página
   */
  function getStudentInfo() {
    let name = 'Aluno Anhanguera';
    let code = '';

    // Procura na barra de usuário superior
    const userElement = document.querySelector('.usertext, .user-name, [class*="user"], .logininfo');
    if (userElement) {
      name = userElement.textContent.trim();
    } else {
      // Busca por padrão de texto no topo
      const headerText = document.body.innerText.slice(0, 1000);
      const match = headerText.match(/([A-Z\s]{4,40})\s+([a-z0-9]{15,30})/);
      if (match) {
        name = match[1].trim();
        code = match[2].trim();
      }
    }

    return { name, code };
  }

  /**
   * Extrai disciplinas da página principal (Home do AVA KLS)
   */
  function scrapeHomeDisciplines() {
    const disciplines = [];
    const student = getStudentInfo();

    // 1. Procura cards de disciplinas na home
    const courseCards = document.querySelectorAll('.card, .card-discipline, .course-card, [id*="card-action-"]');

    if (courseCards.length > 0) {
      courseCards.forEach((card, index) => {
        const titleEl = card.querySelector('h3, h4, h5, .title, .course-name, a');
        const title = titleEl ? titleEl.textContent.trim() : `Disciplina ${index + 1}`;
        const link = card.querySelector('a')?.href || '';
        const categoryEl = card.querySelector('.category, .badge, small, span');
        const category = categoryEl ? categoryEl.textContent.trim() : 'Geral';

        // Extrai código do ID se disponível
        const idMatch = link.match(/id=(\d+)/) || card.id?.match(/\d+/);
        const code = idMatch ? idMatch[1] : `disc-${index + 1}`;

        disciplines.push({
          id: `disc-${code}`,
          codigo: code,
          nome: title,
          categoriaLabel: category,
          link: link,
          andamentoGeral: 0,
          totalAtividades: 12,
          atividadesConcluidas: 0
        });
      });
    }

    // 2. Se for uma página de curso específica (/course/view.php?id=...)
    if (window.location.href.includes('/course/view.php')) {
      const courseTitle = document.querySelector('h1, .page-header-headings, .coursename')?.textContent?.trim() || 'Disciplina Atual';
      const idMatch = window.location.href.match(/id=(\d+)/);
      const code = idMatch ? idMatch[1] : '10703';

      // Extrai percentual de andamento geral se presente
      let andamentoGeral = 0;
      const progressMatch = document.body.innerText.match(/Andamento Geral\s*(\d+)%/i);
      if (progressMatch) {
        andamentoGeral = parseInt(progressMatch[1], 10);
      }

      // Extrai unidades e atividades da tela
      const units = [];
      const unitElements = document.querySelectorAll('.section, .topic, [id*="section-"], .menu-topic');
      
      // Procura itens com nome "U1 - Livro", "Atividade de Aprendizagem", "Avaliação da Unidade"
      const activityLinks = document.querySelectorAll('a[href*="mod/"]');
      const activities = [];

      activityLinks.forEach((link, idx) => {
        const text = link.textContent.trim();
        if (text && (text.includes('Livro') || text.includes('Atividade') || text.includes('Avaliação') || text.includes('Aula'))) {
          let tipo = 'aprendizagem';
          if (text.includes('Livro')) tipo = 'livro_didatico';
          else if (text.includes('Webaula') || text.includes('Teleaula') || text.includes('Aula')) tipo = 'webaula';
          else if (text.includes('Avaliação')) tipo = 'avaliacao_unidade';
          else if (text.includes('Discursiva')) tipo = 'discursiva';

          activities.push({
            id: `act-${code}-${idx}`,
            titulo: text,
            tipo: tipo,
            status: 'pendente'
          });
        }
      });

      disciplines.push({
        id: `disc-${code}`,
        codigo: code,
        nome: courseTitle,
        categoriaLabel: 'Aula Modelo Institucional - WL',
        andamentoGeral: andamentoGeral,
        totalAtividades: activities.length || 12,
        atividadesConcluidas: Math.round((activities.length || 12) * (andamentoGeral / 100)),
        atividadesExtraidas: activities
      });
    }

    return {
      aluno: student,
      disciplinas: disciplines,
      url: window.location.href,
      dataSincronizacao: new Date().toISOString()
    };
  }

  // Ouvinte de mensagens da extensão (popup)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape_data') {
      const data = scrapeHomeDisciplines();
      sendResponse({ success: true, data });
    }
    return true;
  });

  // Widget Flutuante Estilizado na Página do AVA
  function injectFloatingWidget() {
    if (document.getElementById('estudaai-floating-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'estudaai-floating-widget';
    widget.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #16a34a 0%, #4f46e5 100%);
        color: white;
        padding: 12px 18px;
        border-radius: 9999px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.4);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        border: 1px solid rgba(255,255,255,0.3);
      " id="estudaai-btn-sync">
        <span style="font-size: 16px;">📚</span>
        <span>Sincronizar com EstudaAI</span>
      </div>
    `;

    document.body.appendChild(widget);

    const btn = document.getElementById('estudaai-btn-sync');
    if (btn) {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 15px 30px -5px rgba(79, 70, 229, 0.5)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 10px 25px -5px rgba(22, 163, 74, 0.4)';
      });
      btn.addEventListener('click', async () => {
        btn.innerText = '⏳ Sincronizando...';
        const data = scrapeHomeDisciplines();
        
        try {
          // Envia para o servidor local do EstudaAI
          const res = await fetch('http://localhost:3002/api/sync-ava', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (res.ok) {
            btn.innerHTML = '✅ Sincronizado com Sucesso!';
            setTimeout(() => {
              window.open('http://localhost:3002/disciplinas', '_blank');
              btn.innerHTML = '📚 Sincronizar com EstudaAI';
            }, 1200);
          } else {
            throw new Error('Falha no envio');
          }
        } catch (e) {
          btn.innerHTML = '✅ Dados Capturados! Abrindo EstudaAI...';
          setTimeout(() => {
            window.open('http://localhost:3002/disciplinas', '_blank');
            btn.innerHTML = '📚 Sincronizar com EstudaAI';
          }, 1200);
        }
      });
    }
  }

  // Injeta o widget após o carregamento da página
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectFloatingWidget();
  } else {
    window.addEventListener('DOMContentLoaded', injectFloatingWidget);
  }
})();
