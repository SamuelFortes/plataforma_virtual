const padraoSql = /(union|select|insert|update|delete|drop|;|--|\/\*|\*\/|xp_)/i;
const padraoXss = /(<script|<iframe|javascript:|onerror=|onload=)/i;

export function temRiscoSql(texto = "") {
  return padraoSql.test(texto);
}

export function temRiscoXss(texto = "") {
  return padraoXss.test(texto);
}

export function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcularDigito = (cpfParcial, pesoInicial) => {
    const total = cpfParcial
      .split("")
      .reduce((soma, digito, indice) => soma + parseInt(digito) * (pesoInicial - indice), 0);
    const resto = total % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(cpf.substring(0, 9), 10);
  if (primeiroDigito !== parseInt(cpf[9])) return false;

  const segundoDigito = calcularDigito(cpf.substring(0, 10), 11);
  if (segundoDigito !== parseInt(cpf[10])) return false;

  return true;
}

export function validarSenha(senha) {
  const erros = [];
  if (senha.length < 8) erros.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(senha)) erros.push("Uma letra maiúscula");
  if (!/[a-z]/.test(senha)) erros.push("Uma letra minúscula");
  if (!/\d/.test(senha)) erros.push("Um número");
  return erros;
}

export function validarCadastro(formulario) {
  const erros = {};
  
  if (!formulario.nome || formulario.nome.trim().length < 2) {
    erros.nome = "Nome deve ter no mínimo 2 caracteres.";
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formulario.nome)) {
    erros.nome = "Nome deve conter apenas letras.";
  }
  
  if (!formulario.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
    erros.email = "Email inválido.";
  }
  
  if (!formulario.cpf || !validarCPF(formulario.cpf)) {
    erros.cpf = "CPF inválido.";
  }
  
  const errosSenha = validarSenha(formulario.senha);
  if (errosSenha.length > 0) {
    erros.senha = `Senha deve ter: ${errosSenha.join(", ")}.`;
  }
  
  if (formulario.senha !== formulario.confirmarSenha) {
    erros.confirmarSenha = "Senhas não conferem.";
  }

  const suspeito = [formulario.nome, formulario.email].some(
    (campo) => temRiscoSql(campo) || temRiscoXss(campo)
  );
  if (suspeito) {
    erros.seguranca = "Entrada contém padrão suspeito.";
  }

  return erros;
}
