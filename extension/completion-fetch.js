/**
 * Injetado via <script src> (não inline, por causa do CSP da página) dentro do
 * documento real do AVA para buscar a API de conclusão como se fosse JS nativo
 * do site — necessário porque a AWS bloqueia (CORS/WAF) fetch feito a partir do
 * contexto isolado da extensão.
 */
(function () {
  var s = document.currentScript;
  var apiUrl = s.dataset.apiUrl;
  var jwt = s.dataset.jwt;
  var apiKey = s.dataset.apiKey;
  var eventName = s.dataset.event;

  fetch(apiUrl + '/token/' + jwt, {
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var completions = (data && data.course && Array.isArray(data.course.completions))
        ? data.course.completions
        : null;
      document.dispatchEvent(new CustomEvent(eventName, { detail: completions }));
    })
    .catch(function () {
      document.dispatchEvent(new CustomEvent(eventName, { detail: null }));
    });
})();
