/**
 * Validador Oficial de CPF (Algoritmo dos dígitos verificadores da Receita Federal)
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  const clean = cpf.replace(/\D/g, '');
  
  // Deve ter exatamente 11 dígitos
  if (clean.length !== 11) return false;
  
  // Bloqueia CPFs com todos os dígitos iguais (ex: 111.111.111-11, 000.000.000-00)
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  // Validação do 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rest = 11 - (sum % 11);
  let digit1 = (rest === 10 || rest === 11) ? 0 : rest;
  if (digit1 !== parseInt(clean.charAt(9))) return false;
  
  // Validação do 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rest = 11 - (sum % 11);
  let digit2 = (rest === 10 || rest === 11) ? 0 : rest;
  if (digit2 !== parseInt(clean.charAt(10))) return false;
  
  return true;
}
