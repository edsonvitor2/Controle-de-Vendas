class Cadastro {
    constructor(){
        this.formOpcao = 'cadastrar';
        this.produtoId = null; // Para armazenar o ID do produto que está sendo editado
        this.iniciarBotoes();   // Inicializa os botões
        this.listarProdutos();  // Lista os produtos existentes ao iniciar
    }

    iniciarBotoes(){
        let cadastrar = document.querySelector("#cadastrar");

        cadastrar.addEventListener("click", e => {
            e.preventDefault();
            this.obterProdutos();
        });
    }

    obterProdutos() {
        var nome = document.querySelector("#produto").value; 
        var quantidade = document.querySelector("#quantidade").value; 
        var valor = document.querySelector("#valor").value.trim(); 
    
        // Verifica se o valor contém ',' ou '.' e formata corretamente
        if (valor.includes(",")) {
            valor = valor.replace(",", ".");  
        } else if (!valor.includes(".")) {
            valor = valor + ".00";  
        }
    
        var Produto = {
            nome,
            quantidade,
            valor
        };
    
        if(this.formOpcao == 'cadastrar'){
            this.cadastrarProduto(Produto);
        }else if (this.formOpcao == 'editar'){
            this.editarProduto(Produto);
        }else if(this.formOpcao == 'adicionar'){
            this.adicionarProduto(Produto);
        }else if(this.formOpcao == 'excluir'){
            this.excluirProduto();
        }
    }

    cadastrarProduto(Produto){
        firebase.database().ref('produtos').push(Produto, error => {
            if (error) {
                console.error("Erro ao cadastrar o produto no Firebase:", error);
            } else {
                console.log("Produto cadastrado com sucesso no Firebase:", Produto);
                this.limparFormulario();
                this.listarProdutos();
            }
        });
    }
    
    editarProduto(Produto){
        // Verifica se o ID do produto está definido
        if (this.produtoId) {
            firebase.database().ref('produtos/' + this.produtoId).update(Produto, error => {
                if (error) {
                    console.error("Erro ao editar o produto no Firebase:", error);
                } else {
                    console.log("Produto editado com sucesso no Firebase:", Produto);
                    this.limparFormulario();
                    this.listarProdutos();
                    this.formOpcao = 'cadastrar'; // Resetar a opção após a edição
                }
            });
        }
    }
    
    adicionarProduto(Produto) {
        // Aumenta a quantidade do produto
        if (this.produtoId) {
            firebase.database().ref('produtos/' + this.produtoId).once('value', snapshot => {
                if (snapshot.exists()) {
                    let produtoExistente = snapshot.val();
                    let novaQuantidade = parseInt(produtoExistente.quantidade) + parseInt(Produto.quantidade);
                    firebase.database().ref('produtos/' + this.produtoId).update({ quantidade: novaQuantidade }, error => {
                        if (error) {
                            console.error("Erro ao adicionar quantidade do produto no Firebase:", error);
                        } else {
                            console.log("Quantidade do produto adicionada com sucesso no Firebase.");
                            this.limparFormulario();
                            this.listarProdutos();
                        }
                    });
                }
            });
        }
    }

    excluirProduto() {
        if (this.produtoId) {
            firebase.database().ref('produtos/' + this.produtoId).remove(error => {
                if (error) {
                    console.error("Erro ao excluir o produto no Firebase:", error);
                } else {
                    console.log("Produto excluído com sucesso no Firebase.");
                    this.limparFormulario();
                    this.listarProdutos();
                    this.formOpcao = 'cadastrar'; // Resetar a opção após a exclusão
                }
            });
        }
    }

    limparFormulario() {
        document.querySelector("#produto").value = "";
        document.querySelector("#quantidade").value = "";
        document.querySelector("#valor").value = "";
        this.produtoId = null; // Limpa o ID do produto após operação
        this.formOpcao = 'cadastrar'; // Reseta a opção para cadastrar
    }
    
    listarProdutos() {
        document.querySelector("#legend").innerHTML = `Cadastrar Produtos`;
        document.querySelector("#cadastrar").value = `Cadastrar`;

        let tabelaProdutos = document.querySelector("#corpo-tabela-estoque"); 
        tabelaProdutos.innerHTML = "";  
    
        firebase.database().ref('produtos').once('value', snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const produto = childSnapshot.val();
                    const tr = document.createElement("tr"); 

                    tr.innerHTML = `
                        <td>${produto.nome}</td>
                        <td>${produto.quantidade}</td>
                        <td>R$ ${produto.valor}</td>
                        <td class="editar botoes"> Editar </td>
                        <td class="adicionar botoes"> Adicionar </td>
                        <td class="excluir botoes"> Excluir </td>
                    `;
    
                    // Adiciona o ID do produto na linha
                    tr.dataset.id = childSnapshot.key;

                    // Adiciona o evento de clique para o botão Editar
                    tr.querySelector(".editar").addEventListener("click", e => {
                        this.produtoId = tr.dataset.id; // Armazena o ID do produto
                        document.querySelector("#legend").innerHTML = `Editar ${produto.nome}`;
                        document.querySelector("#cadastrar").value = `Editar ${produto.nome}`;
                        this.formOpcao = 'editar'; // Define a opção como editar
                        document.querySelector("#produto").value = produto.nome;
                        document.querySelector("#quantidade").value = produto.quantidade;
                        document.querySelector("#valor").value = produto.valor;
                    });
    
                    // Adiciona o evento de clique para o botão Adicionar
                    tr.querySelector(".adicionar").addEventListener("click", e => {
                        this.produtoId = tr.dataset.id; // Armazena o ID do produto
                        document.querySelector("#legend").innerHTML = `Adicionar ${produto.nome}`;
                        document.querySelector("#cadastrar").value = `Adicionar ${produto.nome}`;
                        document.querySelector("#produto").value = produto.nome;
                        document.querySelector("#quantidade").value = 0;
                        document.querySelector("#valor").value = produto.valor;
                        this.formOpcao = 'adicionar'; // Define a opção como adicionar
                    });
    
                    // Adiciona o evento de clique para o botão Excluir
                    tr.querySelector(".excluir").addEventListener("click", e => {
                        this.produtoId = tr.dataset.id; // Armazena o ID do produto
                        if (confirm(`Você tem certeza que deseja excluir ${produto.nome}?`)) {
                            this.excluirProduto();
                        }
                    });
    
                    tabelaProdutos.appendChild(tr);  
                });
            } 
        });
    }
}

var cadastrar = new Cadastro();
