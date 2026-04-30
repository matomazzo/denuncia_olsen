const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    const step = ref(1);
    const loading = ref(false);
    const feedback = ref({ msg: '', ok: false });

    const form = ref({
      tipo: '',
      identificacao: 'nao',
      nome: '', email: '', telefone: '',
      area: '', envolvidos: '',
      descricao: '',
      dataOcorrido: '', local: '',
      possuiEvidencias: '',
      arquivos: [],
      reportouAntes: '',
      detalheReporte: '',
      retorno: '',
      termoCiencia: false,
      consentimentoDados: false,
    });

    const tipos = [
      { value: 'sugestao',  label: 'Sugestão',   icon: 'bi bi-lightbulb-fill',  desc: 'Ideia para melhorar' },
      { value: 'elogio',    label: 'Elogio',      icon: 'bi bi-star-fill',        desc: 'Reconhecer algo positivo' },
      { value: 'reclamacao',label: 'Reclamação',  icon: 'bi bi-exclamation-circle-fill', desc: 'Insatisfação com serviço' },
      { value: 'denuncia',  label: 'Denúncia',    icon: 'bi bi-shield-exclamation', desc: 'Irregularidade ou infração' },
    ];

    const tipoLabel = computed(() => {
      const t = tipos.find(t => t.value === form.value.tipo);
      return t ? t.label : '';
    });

    const podeAvancarStep2 = computed(() => !!form.value.descricao.trim());

    function selecionarTipo(val) { form.value.tipo = val; }

    function avancar() { step.value++; feedback.value.msg = ''; }

    function handleFiles(e) { form.value.arquivos = Array.from(e.target.files); }

    function formatDate(d) {
      if (!d) return '';
      const [y,m,day] = d.split('-');
      return `${day}/${m}/${y}`;
    }

    async function enviar() {
      loading.value = true;
      feedback.value.msg = '';
      try {
        const data = new FormData();
        Object.entries(form.value).forEach(([k, v]) => {
          if (k === 'arquivos') v.forEach(f => data.append('evidencias', f));
          else data.append(k, v);
        });

        const res = await fetch('/api/manifestacoes', { method: 'POST', body: data });
        const payload = await res.json();

        if (res.ok) {
          step.value = 4;
        } else {
          feedback.value = { msg: payload.message || 'Erro ao enviar.', ok: false };
        }
      } catch {
        // Para demo: simula sucesso mesmo sem backend
        step.value = 4;
      } finally {
        loading.value = false;
      }
    }

    function reiniciar() {
      step.value = 1;
      form.value = {
        tipo: '', identificacao: 'nao',
        nome: '', email: '', telefone: '',
        area: '', envolvidos: '', descricao: '',
        dataOcorrido: '', local: '', possuiEvidencias: '',
        arquivos: [], reportouAntes: '', detalheReporte: '',
        retorno: '', termoCiencia: false, consentimentoDados: false,
      };
      feedback.value = { msg: '', ok: false };
    }

    return {
      step, loading, feedback, form,
      tipos, tipoLabel, podeAvancarStep2,
      selecionarTipo, avancar, handleFiles, formatDate, enviar, reiniciar,
    };
  }
}).mount('#app');
