const fs = require('fs');

const filePath = 'c:/Users/01543230/Documents/projeto_anhanguera/src/lib/mock-data.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace status: 'concluida' with status: 'pendente'
content = content.replace(/status:\s*'concluida'/g, "status: 'pendente'");

// Replace andamentoGeral: X with andamentoGeral: 0
content = content.replace(/andamentoGeral:\s*\d+/g, 'andamentoGeral: 0');

// Replace atividadesConcluidas: X with atividadesConcluidas: 0
content = content.replace(/atividadesConcluidas:\s*\d+/g, 'atividadesConcluidas: 0');

// Replace andamentoTopico: X with andamentoTopico: 0
content = content.replace(/andamentoTopico:\s*\d+/g, 'andamentoTopico: 0');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Todas as matérias resetadas para 0% concluídas (tudo pendente)!');
