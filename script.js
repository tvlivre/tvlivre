// script.js

// Pre-cadastro do admin Iraci
if(!localStorage.getItem("usuarios")){
  const usuarios = [{
    user: "iraci",
    senha: "Igor#2011",
    nome: "Iraci",
    cpfCnpj: "00000000000",
    cep: "00000-000",
    endereco: "Sede TV Livre+"
  }];
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  // Primeiro verifica login especial do admin direto:
  if (user === "iraci" && pass === "Igor#2011") {
    localStorage.setItem("userLogado", user);
    localStorage.setItem("tipo", "admin");
    window.location.href = "admin.html";
    return;
  }

  // Depois tenta no localStorage normal:
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuario = usuarios.find(u => u.user === user && u.senha === pass);
  if (!usuario) {
    alert("Usuário ou senha inválidos.");
    return;
  }

  localStorage.setItem("userLogado", user);
  localStorage.setItem("tipo", "cliente");
  window.location.href = "cliente.html";
}


function registrar() {
  const user = document.getElementById("novoUser").value.trim();
  const senha = document.getElementById("novaSenha").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const cpfCnpj = document.getElementById("cpfCnpj").value.trim();
  const cep = document.getElementById("cep").value.trim();
  const endereco = document.getElementById("endereco").value.trim();

  if (!user || !senha || !nome || !cpfCnpj || !cep || !endereco) {
    alert("Preencha todos os campos.");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  if (usuarios.find(u => u.user === user)) {
    alert("Usuário já existe.");
    return;
  }

  usuarios.push({ user, senha, nome, cpfCnpj, cep, endereco });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  alert("Conta criada! Faça login.");
  window.location.href = "login.html";
}
