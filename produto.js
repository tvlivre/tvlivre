function getQueryParam(param) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function voltar() {
  window.location.href = "cliente.html";
}

function carregarProduto() {
  let id = getQueryParam("id");
  if (id === null) {
    alert("Produto não especificado");
    voltar();
    return;
  }

  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  let produto = produtos[id];

  if (!produto) {
    alert("Produto não encontrado");
    voltar();
    return;
  }

  document.getElementById("nomeProduto").textContent = produto.nome;
  document.getElementById("imagemProduto").src = produto.imagem;
  document.getElementById("precoProduto").textContent = produto.preco.toFixed(2);
  document.getElementById("estoqueProduto").textContent = produto.estoque;
  document.getElementById("descricaoProduto").textContent = produto.descricao || "Descrição não disponível.";
}

function comprarProduto() {
  let quantidade = parseInt(document.getElementById("quantidade").value);
  let status = document.getElementById("statusCompra");
  if (isNaN(quantidade) || quantidade < 1) {
    status.style.color = "#ff5555";
    status.textContent = "Informe uma quantidade válida!";
    return;
  }

  let id = getQueryParam("id");
  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  let produto = produtos[id];

  if (!produto) {
    status.style.color = "#ff5555";
    status.textContent = "Produto não encontrado!";
    return;
  }

  if (produto.estoque < quantidade) {
    status.style.color = "#ff5555";
    status.textContent = "Estoque insuficiente!";
    return;
  }

  // Pega usuário logado e seus dados completos
  let userLogado = localStorage.getItem("userLogado");
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  let clienteInfo = usuarios.find(u => u.user === userLogado);

  if (!clienteInfo) {
    status.style.color = "#ff5555";
    status.textContent = "Usuário não encontrado.";
    return;
  }

  // Atualiza estoque
  produto.estoque -= quantidade;
  produtos[id] = produto;
  localStorage.setItem("produtos", JSON.stringify(produtos));

  // Salva pedido com dados do cliente (menos senha)
  let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  pedidos.push({
    cliente: clienteInfo.nomeCompleto || clienteInfo.user,
    cpfCnpj: clienteInfo.cpfCnpj || "N/A",
    endereco: clienteInfo.endereco || "N/A",
    cep: clienteInfo.cep || "N/A",
    produto: produto.nome,
    quantidade,
    data: new Date().toLocaleString()
  });
  localStorage.setItem("pedidos", JSON.stringify(pedidos));

  status.style.color = "#0f0";
  status.textContent = `Compra de ${quantidade} "${produto.nome}" registrada com sucesso!`;

  document.getElementById("estoqueProduto").textContent = produto.estoque;
}

window.onload = carregarProduto;
