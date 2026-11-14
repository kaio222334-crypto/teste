const CHAVE_REGISTROS = "emprestimos:registros";
const CHAVE_MATERIAIS = "emprestimos:materiais";
const MATERIAIS_PADRAO = ["Notebook", "Projetor", "Cabo HDMI", "Caixa de som", "Livro", "Calculadora"];

const $ = (id) => document.getElementById(id);
const form = $("form");

function carregar(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch (e) {
    return padrao;
  }
}
function salvar(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
}

let registros = carregar(CHAVE_REGISTROS, []);
let materiais = carregar(CHAVE_MATERIAIS, MATERIAIS_PADRAO);

function hoje() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function desenharMateriais() {
  const atual = $("material").value;
  $("material").innerHTML = '<option value="" disabled selected>Selecione o material</option>' +
    materiais.map((m) => `<option>${escapar(m)}</option>`).join("");
  if (materiais.includes(atual)) $("material").value = atual;
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function desenharLista() {
  const termo = $("busca").value.trim().toLowerCase();
  const visiveis = registros.filter((r) =>
    [r.id, r.nome, r.material].some((v) => v.toLowerCase().includes(termo))
  );

  $("lista").innerHTML = visiveis.map((r) => `
    <tr class="${r.devolvido ? "devolvido" : ""}">
      <td>${escapar(r.id)}</td>
      <td>${escapar(r.nome)}</td>
      <td>${formatarData(r.data)}</td>
      <td>${escapar(r.material)}</td>
      <td><span class="etiqueta ${r.devolvido ? "devolvido" : "emprestado"}">${r.devolvido ? "Devolvido" : "Emprestado"}</span></td>
      <td class="acoes">
        <button type="button" data-acao="devolver" data-codigo="${r.codigo}">${r.devolvido ? "Reabrir" : "Devolver"}</button>
        <button type="button" class="excluir" data-acao="excluir" data-codigo="${r.codigo}">Excluir</button>
      </td>
    </tr>`).join("");

  $("vazio").style.display = visiveis.length ? "none" : "block";
  $("vazio").textContent = registros.length
    ? "Nenhum registro encontrado para essa busca."
    : "Nenhum empréstimo registrado ainda. Preencha o formulário para começar.";

  const abertos = registros.filter((r) => !r.devolvido).length;
  $("resumo").textContent = `${abertos} em aberto · ${registros.length} no total`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  registros.unshift({
    codigo: Date.now().toString(),
    id: $("idPessoa").value.trim(),
    nome: $("nome").value.trim(),
    data: $("data").value,
    material: $("material").value,
    devolvido: false
  });
  salvar(CHAVE_REGISTROS, registros);
  form.reset();
  $("data").value = hoje();
  desenharMateriais();
  desenharLista();
  $("idPessoa").focus();
});

// Se o ID já foi usado, preenche o nome automaticamente
$("idPessoa").addEventListener("change", () => {
  const achado = registros.find((r) => r.id === $("idPessoa").value.trim());
  if (achado && !$("nome").value) $("nome").value = achado.nome;
});

$("lista").addEventListener("click", (e) => {
  const botao = e.target.closest("button");
  if (!botao) return;
  const registro = registros.find((r) => r.codigo === botao.dataset.codigo);
  if (!registro) return;
  if (botao.dataset.acao === "devolver") {
    registro.devolvido = !registro.devolvido;
  } else if (confirm(`Excluir o registro de ${registro.nome}?`)) {
    registros = registros.filter((r) => r !== registro);
  }
  salvar(CHAVE_REGISTROS, registros);
  desenharLista();
});

$("addMaterial").addEventListener("click", () => {
  const novo = $("novoMaterial").value.trim();
  if (!novo || materiais.some((m) => m.toLowerCase() === novo.toLowerCase())) return;
  materiais.push(novo);
  salvar(CHAVE_MATERIAIS, materiais);
  $("novoMaterial").value = "";
  desenharMateriais();
  $("material").value = novo;
});

$("busca").addEventListener("input", desenharLista);

$("data").value = hoje();
desenharMateriais();
desenharLista();