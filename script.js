// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCX27cLtJwL83RYYiedbVjulWEpoZ7xpnE",
  authDomain: "tvlivre-7442e.firebaseapp.com",
  databaseURL: "https://tvlivre-7442e-default-rtdb.firebaseio.com",
  projectId: "tvlivre-7442e",
  storageBucket: "tvlivre-7442e.appspot.com",
  messagingSenderId: "446276310209",
  appId: "1:446276310209:web:fca582c294dcc20a577040"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

let userData = {};

// ===== LOGIN =====
function fazerLogin() {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  if (email.toLowerCase() === "iraci@admin.com" && senha === "Igor#2011") {
    window.location.href = "admin.html";
    return;
  }

  auth.signInWithEmailAndPassword(email, senha)
    .then(() => window.location.href = "cliente.html")
    .catch(() => alert("Usuário ou senha inválidos"));
}

// ===== CRIAR OU ATUALIZAR CONTA =====
function criarOuAtualizarConta() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const cep = document.getElementById("cep").value.trim();
  const endereco = document.getElementById("endereco").value.trim();

  if (!nome || !email || (!senha && !auth.currentUser)) {
    alert("Preencha os campos obrigatórios");
    return;
  }

  if (!auth.currentUser) {
    // Criar conta
    auth.createUserWithEmailAndPassword(email, senha)
      .then(cred => {
        db.ref("clientes/" + cred.user.uid).set({ nome, email, cpf, cep, endereco });
        alert("Conta criada!");
        window.location.href = "cliente.html";
      })
      .catch(e => alert("Erro ao criar conta: " + e.message));
  } else {
    // Atualizar dados
    const user = auth.currentUser;
    let updates = { nome, email, cpf, cep, endereco };

    db.ref("clientes/" + user.uid).update(updates)
      .then(() => {
        if (senha) user.updatePassword(senha).catch(e => alert("Erro na senha: " + e.message));
        alert("Dados atualizados!");
        window.location.href = "cliente.html";
      });
  }
}

// ===== CARREGAR DADOS DO USUÁRIO (Editar Conta) =====
function carregarDadosUsuario() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    db.ref("clientes/" + user.uid).once("value").then(snap => {
      const d = snap.val() || {};
      document.getElementById("nome").value = d.nome || "";
      document.getElementById("email").value = d.email || "";
      document.getElementById("cpf").value = d.cpf || "";
      document.getElementById("cep").value = d.cep || "";
      document.getElementById("endereco").value = d.endereco || "";
    });
  });
}

// ===== ADICIONAR PRODUTO (ADMIN) =====
function adicionarProduto() {
  const nome = document.getElementById("nomeProduto").value.trim();
  const estoque = parseInt(document.getElementById("estoqueProduto").value);
  const preco = parseFloat(document.getElementById("precoProduto").value);
  const descricao = document.getElementById("descricaoProduto").value.trim();
  const imagemFile = document.getElementById("imagemProduto").files[0];

  if (!nome || isNaN(estoque) || isNaN(preco) || !descricao || !imagemFile) {
    alert("Preencha todos os campos do produto");
    return;
  }

  const id = Date.now().toString();

  const uploadTask = storage.ref('produtos/' + id).put(imagemFile);

  uploadTask.on('state_changed', 
    snapshot => {},
    error => alert("Erro no upload da imagem: " + error.message),
    () => {
      uploadTask.snapshot.ref.getDownloadURL().then(url => {
        db.ref('produtos/' + id).set({ nome, estoque, preco, descricao, imagem: url })
          .then(() => {
            alert("Produto adicionado!");
            document.getElementById("nomeProduto").value = "";
            document.getElementById("estoqueProduto").value = "";
            document.getElementById("precoProduto").value = "";
            document.getElementById("descricaoProduto").value = "";
            document.getElementById("imagemProduto").value = "";
            carregarProdutosAdmin();
          });
      });
    }
  );
}

// ===== CARREGAR PRODUTOS PARA A LOJA =====
function carregarProdutos() {
  const container = document.getElementById("produtos");
  if (!container) return;

  db.ref("produtos").on("value", snapshot => {
    container.innerHTML = "";
    snapshot.forEach(prodSnap => {
      const p = prodSnap.val();
      const id = prodSnap.key;

      const prodDiv = document.createElement("div");
      prodDiv.style.border = "1px solid #0f0";
      prodDiv.style.margin = "10px";
      prodDiv.style.padding = "10px";
      prodDiv.style.borderRadius = "8px";
      prodDiv.style.display = "inline-block";
      prodDiv.style.width = "150px";
      prodDiv.style.verticalAlign = "top";
      prodDiv.style.cursor = p.estoque <= 0 ? "not-allowed" : "pointer";

      const img = document.createElement("img");
      img.src = p.imagem;
      img.style.width = "100%";
      img.style.filter = p.estoque <= 0 ? "grayscale(100%)" : "none";
      prodDiv.appendChild(img);

      const nome = document.createElement("h4");
      nome.textContent = p.nome;
      prodDiv.appendChild(nome);

      const preco = document.createElement("p");
      preco.textContent = `R$${p.preco.toFixed(2)}`;
      prodDiv.appendChild(preco);

      prodDiv.onclick = () => {
        if (p.estoque > 0) {
          localStorage.setItem("produtoSelecionado", id);
          window.location.href = "produto.html";
        } else {
          alert("Produto sem estoque");
        }
      };

      container.appendChild(prodDiv);
    });
  });
}

// ===== CARREGAR PRODUTO NA PÁGINA DE DETALHES =====
function carregarDetalhesProduto() {
  const id = localStorage.getItem("produtoSelecionado");
  const container = document.getElementById("detalhesProduto");
  if (!id || !container) return;

  db.ref("produtos/" + id).once("value").then(snap => {
    const p = snap.val();
    if (!p) {
      container.innerHTML = "Produto não encontrado";
      return;
    }
    container.innerHTML = `
      <img src="${p.imagem}" style="max-width:300px"><br>
      <h2>${p.nome}</h2>
      <p>${p.descricao}</p>
      <p><b>Preço:</b> R$${p.preco.toFixed(2)}</p>
      <p><b>Estoque:</b> ${p.estoque}</p>
      <input type="number" id="qtd" placeholder="Quantidade" min="1" max="${p.estoque}" value="1">
      <button onclick="comprarProduto('${id}')">Comprar</button>
    `;
  });
}

// ===== COMPRAR PRODUTO =====
function comprarProduto(id) {
  const qtd = parseInt(document.getElementById("qtd").value);
  if (isNaN(qtd) || qtd < 1) {
    alert("Quantidade inválida");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Você precisa estar logado");
    window.location.href = "index.html";
    return;
  }

  db.ref("produtos/" + id).once("value").then(prodSnap => {
    const produto = prodSnap.val();
    if (!produto || produto.estoque < qtd) {
      alert("Estoque insuficiente");
      return;
    }

    db.ref("clientes/" + user.uid).once("value").then(cliSnap => {
      const cliente = cliSnap.val();

      const pedidoId = Date.now().toString();

      const pedido = {
        cliente: cliente.nome,
        uid: user.uid,
        produtoId: id,
        produtoNome: produto.nome,
        quantidade: qtd,
        precoUnitario: produto.preco,
        data: new Date().toLocaleString(),
        status: "Despachando",
        cep: cliente.cep,
        endereco: cliente.endereco,
        cpf: cliente.cpf
      };

      db.ref("pedidos/" + pedidoId).set(pedido);

      // Atualizar estoque com transação segura
      db.ref("produtos/" + id + "/estoque").transaction(current => {
        if (current === null) return 0;
        if (current < qtd) {
          alert("Estoque insuficiente");
          return; // cancela
        }
        return current - qtd;
      }).then(() => {
        alert("Compra registrada!");
        window.location.href = "cliente-pedidos.html";
      });
    });
  });
}

// ===== LISTAR PEDIDOS DO CLIENTE =====
function verPedidosCliente() {
  const user = auth.currentUser;
  const ul = document.getElementById("listaPedidos");
  if (!user || !ul) return;

  db.ref("pedidos").orderByChild("uid").equalTo(user.uid).on("value", snap => {
    ul.innerHTML = "";
    snap.forEach(pedSnap => {
      const p = pedSnap.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${p.produtoNome}</b> - Quantidade: ${p.quantidade} - Status: <i>${p.status}</i><br>
        Data: ${p.data}
      `;
      ul.appendChild(li);
    });
  });
}

// ===== LISTAR PEDIDOS E ALERTAS ADMIN =====
function listarPedidosAdmin() {
  const ul = document.getElementById("pedidosLista");
  const alerta = document.getElementById("alertaEstoque");

  // Avisos para produtos sem estoque
  db.ref("produtos").once("value", snap => {
    alerta.innerHTML = "";
    snap.forEach(prodSnap => {
      const p = prodSnap.val();
      if (p.estoque <= 0) {
        alerta.innerHTML += `⚠️ Produto <b>${p.nome}</b> está sem estoque!<br>`;
      }
    });
  });

  // Listar pedidos com todas infos
  db.ref("pedidos").on("value", snap => {
    ul.innerHTML = "";
    snap.forEach(pedSnap => {
      const p = pedSnap.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${p.cliente}</b> comprou <b>${p.quantidade}</b> de <b>${p.produtoNome}</b> em ${p.data}<br>
        Endereço: ${p.endereco} / CEP: ${p.cep} / CPF/CNPJ: ${p.cpf}<br>
        Status: <input type="text" value="${p.status}" onblur="editarStatus('${pedSnap.key}', this.value)">
        <button onclick="removerPedido('${pedSnap.key}')">Remover Pedido</button>
        <hr>
      `;
      ul.appendChild(li);
    });
  });
}

// ===== EDITAR STATUS DO PEDIDO =====
function editarStatus(id, novoStatus) {
  if (!novoStatus) return;
  db.ref("pedidos/" + id + "/status").set(novoStatus);
}

// ===== REMOVER PEDIDO (ADMIN) =====
function removerPedido(id) {
  if (confirm("Remover pedido?")) {
    db.ref("pedidos/" + id).remove();
  }
}

// ===== CARREGAR PRODUTOS NO ADMIN (COM OPÇÃO REMOVER) =====
function carregarProdutosAdmin() {
  const container = document.getElementById("produtosAdmin");
  if (!container) return;

  db.ref("produtos").on("value", snapshot => {
    container.innerHTML = "";
    snapshot.forEach(prodSnap => {
      const p = prodSnap.val();
      const id = prodSnap.key;

      const prodDiv = document.createElement("div");
      prodDiv.style.border = "1px solid #0f0";
      prodDiv.style.margin = "10px";
      prodDiv.style.padding = "10px";
      prodDiv.style.borderRadius = "8px";

      prodDiv.innerHTML = `
        <img src="${p.imagem}" style="max-width: 100px; filter: ${p.estoque <= 0 ? 'grayscale(100%)' : 'none'};">
        <b>${p.nome}</b><br>
        Estoque: ${p.estoque}<br>
        Preço: R$${p.preco.toFixed(2)}<br>
        <button onclick="removerProduto('${id}')">Remover Produto</button>
      `;

      container.appendChild(prodDiv);
    });
  });
}

// ===== REMOVER PRODUTO (ADMIN) =====
function removerProduto(id) {
  if (confirm("Remover produto?")) {
    db.ref("produtos/" + id).remove();
  }
}

// ===== INICIAR FUNÇÕES DE CADA PÁGINA =====
function initPagina(pagina) {
  auth.onAuthStateChanged(user => {
    if (!user && pagina !== "index") {
      window.location.href = "index.html";
      return;
    }

    switch(pagina) {
      case "cliente-editar":
        carregarDadosUsuario();
        break;
      case "cliente":
        carregarProdutos();
        break;
      case "produto":
        carregarDetalhesProduto();
        break;
      case "cliente-pedidos":
        verPedidosCliente();
        break;
      case "admin":
        listarPedidosAdmin();
        carregarProdutosAdmin();
        break;
    }
  });
}

// Chamada no script de cada página (exemplo: initPagina("cliente"))
