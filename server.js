const express = require('express');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads'),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const requiredByType = {
  base: ['tipoManifestacao'],
  geral: [
    'identificacao',
    'areaDepartamento',
    'descricao',
    'reportouAntes',
    'retorno',
    'termoCiencia',
    'consentimentoDados'
  ],
  denuncia: ['areaDepartamento', 'descricao', 'dataOcorrido', 'possuiEvidencias', 'reportouAntes']
};

function normalizeBoolean(input) {
  return input === 'sim' || input === true || input === 'true';
}

function validateByType(body) {
  const tipo = body.tipoManifestacao;
  if (!tipo) return 'Tipo de manifestação é obrigatório.';

  if (tipo === 'denuncia') {
    for (const field of requiredByType.denuncia) {
      if (!body[field]) return `Campo obrigatório ausente: ${field}`;
    }
  } else {
    for (const field of requiredByType.geral) {
      if (!body[field]) return `Campo obrigatório ausente: ${field}`;
    }
  }

  return null;
}

function buildEmailHtml(data, files) {
  const arquivos = files?.length
    ? `<ul>${files.map((f) => `<li>${f.originalname}</li>`).join('')}</ul>`
    : '<p>Sem anexos.</p>';

  const identificacao = normalizeBoolean(data.identificacao)
    ? `<p><strong>Nome:</strong> ${data.nome || '-'}<br>
       <strong>E-mail:</strong> ${data.email || '-'}<br>
       <strong>Telefone:</strong> ${data.telefone || '-'}</p>`
    : '<p>Manifestação anônima.</p>';

  return `
    <h2>Nova manifestação recebida</h2>
    <p><strong>Tipo:</strong> ${data.tipoManifestacao}</p>
    <p><strong>Área/Departamento:</strong> ${data.areaDepartamento || '-'}</p>
    <p><strong>Nome(s) envolvido(s):</strong> ${data.nomesEnvolvidos || '-'}</p>
    <p><strong>Descrição:</strong><br>${(data.descricao || '').replace(/\n/g, '<br>')}</p>
    <p><strong>Data do ocorrido:</strong> ${data.dataOcorrido || '-'}</p>
    <p><strong>Local:</strong> ${data.localOcorrido || '-'}</p>
    <p><strong>Possui evidências:</strong> ${data.possuiEvidencias || '-'}</p>
    <p><strong>Já reportou antes:</strong> ${data.reportouAntes || '-'}</p>
    <p><strong>Quando/Para quem:</strong> ${data.detalheReporte || '-'}</p>
    <p><strong>Retorno desejado:</strong> ${data.retorno || '-'}</p>
    <p><strong>Termo de ciência:</strong> ${data.termoCiencia || '-'}</p>
    <p><strong>Consentimento LGPD:</strong> ${data.consentimentoDados || '-'}</p>
    <h3>Identificação</h3>
    ${identificacao}
    <h3>Anexos</h3>
    ${arquivos}
  `;
}

app.post('/api/manifestacoes', upload.array('evidencias', 5), async (req, res) => {
  try {
    const validationError = validateByType(req.body);
    if (validationError) {
      return res.status(400).json({ ok: false, message: validationError });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE) === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO || 'gestaopessoas@olsenbusiness.com.br',
      subject: `[Ouvidoria] ${req.body.tipoManifestacao.toUpperCase()}`,
      html: buildEmailHtml(req.body, req.files),
      attachments: (req.files || []).map((file) => ({
        filename: file.originalname,
        path: file.path
      }))
    });

    return res.json({ ok: true, message: 'Manifestação enviada com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Erro ao enviar manifestação.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});
