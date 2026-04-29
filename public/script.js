const tipoManifestacao = document.getElementById('tipoManifestacao');
const blocoGeral = document.getElementById('blocoGeral');
const blocoDenuncia = document.getElementById('blocoDenuncia');
const identificacaoCampos = document.getElementById('identificacaoCampos');
const form = document.getElementById('formManifestacao');
const feedback = document.getElementById('feedback');

function atualizarVisibilidade() {
  const tipo = tipoManifestacao.value;
  blocoGeral.classList.toggle('hidden', tipo === 'denuncia' || !tipo);
  blocoDenuncia.classList.toggle('hidden', tipo !== 'denuncia');
}

document.querySelectorAll('input[name="identificacao"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    identificacaoCampos.classList.toggle('hidden', radio.value !== 'sim' || !radio.checked);
  });
});

tipoManifestacao.addEventListener('change', atualizarVisibilidade);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedback.textContent = 'Enviando...';

  const data = new FormData(form);

  if (tipoManifestacao.value === 'denuncia') {
    data.set('areaDepartamento', data.get('areaDepartamentoDenuncia') || '');
    data.set('nomesEnvolvidos', data.get('nomesEnvolvidosDenuncia') || '');
    data.set('descricao', data.get('descricaoDenuncia') || '');
    data.set('reportouAntes', data.get('reportouAntesDenuncia') || '');
    data.set('detalheReporte', data.get('detalheReporteDenuncia') || '');
  }

  try {
    const response = await fetch('/api/manifestacoes', {
      method: 'POST',
      body: data
    });

    const payload = await response.json();
    feedback.textContent = payload.message;
    feedback.className = response.ok ? 'ok' : 'error';

    if (response.ok) form.reset();
    atualizarVisibilidade();
  } catch (error) {
    feedback.textContent = 'Erro de conexão ao enviar manifestação.';
    feedback.className = 'error';
  }
});

atualizarVisibilidade();
