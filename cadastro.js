class Cadastro {
    constructor(){
        this.formOpcao = 'cadastrar';
        this.produtoId = null; // Para armazenar o ID do produto que está sendo editado
        this.valor = null;
        this.iniciarBotoes();   // Inicializa os botões
        this.listarProdutos();  // Lista os produtos existentes ao iniciar
        this.listarVendas();
    }

    iniciarBotoes(){
        document.querySelector("#tabela-vendas").style.display = 'none';
        let cadastrar = document.querySelector("#cadastrar");
        let vender = document.querySelector("#Vender");
        let quantidadeVendas = document.querySelector("#venda-quantidade");
        let buscarRelatorioVendas = document.querySelector("#buscar-relatorio");

        buscarRelatorioVendas.addEventListener("click", e => {
            e.preventDefault();
           
            let data = document.querySelector("#data").value;
            let partesData = data.split("-");
            let dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
            
            this.listarVendas(dataFormatada);
        });

        quantidadeVendas.addEventListener("keyup", e => {
            this.valor
            var quantidade = document.querySelector("#venda-quantidade").value;
            let qtd = parseFloat(quantidade);
            let valor = parseFloat(this.valor);
            var result = valor * qtd;
            
            document.querySelector("#venda-valor").value = result;
        });

        cadastrar.addEventListener("click", e => {
            e.preventDefault();
            this.obterProdutos();
        });

        vender.addEventListener("click", e => {
            e.preventDefault();
            this.venderProduto();
        });

        document.querySelector("#relatorio-produtos").addEventListener("click",e =>{
            this.ocultarRelatorioVendas();
        });

        document.querySelector("#relatorio-vendas").addEventListener("click",e =>{
           this.mostrarRelatorioVendas();
        });

    }
    ocultarRelatorioVendas(){
        const tabelaVendas = document.querySelector("#tabela-vendas");
        const tabelaProdutos = document.querySelector("#tabela-estoque");

        tabelaProdutos.style.display = 'block';
        tabelaVendas.style.display = 'none';
    }
    mostrarRelatorioVendas(){
        const tabelaVendas = document.querySelector("#tabela-vendas");
        const tabelaProdutos = document.querySelector("#tabela-estoque");
        
        tabelaProdutos.style.display = 'none';
        tabelaVendas.style.display = 'block';
    }
    venderProduto(){
        var nome = document.querySelector("#venda-produto").value; 
        var quantidadeVendida = parseInt(document.querySelector("#venda-quantidade").value); 
        var valor = document.querySelector("#venda-valor").value.trim(); 
        var dataAtual = new Date();
        var data = dataAtual.toLocaleDateString('pt-BR');
        var hora = dataAtual.toLocaleTimeString('pt-BR');
        
        var Produto = {
            nome,
            quantidade: quantidadeVendida,
            valor,
            data,
            hora
        };
    
        firebase.database().ref('vendas').push(Produto, error => {
            if (error) {
                console.error("Erro ao vender o produto no Firebase:", error);
            } else {
                console.log("Produto vendido com sucesso no Firebase:", Produto);
                
                // Agora subtraímos a quantidade do produto correspondente na chave 'produtos'
                var produtoRef = firebase.database().ref('produtos').orderByChild('nome').equalTo(nome);
                
                produtoRef.once('value', snapshot => {
                    if (snapshot.exists()) {
                        snapshot.forEach(childSnapshot => {
                            var produtoKey = childSnapshot.key; // Chave do produto no Firebase
                            var produtoData = childSnapshot.val(); // Dados do produto
    
                            var quantidadeAtual = parseInt(produtoData.quantidade);
                            var novaQuantidade = quantidadeAtual - quantidadeVendida;
    
                            if (novaQuantidade < 0) {
                                console.warn("A quantidade vendida excede o estoque disponível.");
                                return;
                            }
    
                            // Atualizar a quantidade do produto no Firebase
                            firebase.database().ref('produtos').child(produtoKey).update({
                                quantidade: novaQuantidade
                            }, error => {
                                if (error) {
                                    console.error("Erro ao atualizar a quantidade do produto no Firebase:", error);
                                } else {
                                    console.log("Quantidade do produto atualizada com sucesso no Firebase.");
                                }
                            });
                        });
                    } else {
                        console.warn("Produto não encontrado na chave 'produtos'.");
                    }
                });
    
                this.limparFormulario();
                this.listarProdutos();
                this.listarVendas();
            }
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
                        <td class="adicionar botoes"> ADD </td>
                        <td class="excluir botoes"> Excluir </td>
                        <td class="venda botoes"> Vender </td>
                    `;
        
                    // Adiciona o ID do produto na linha
                    tr.dataset.id = childSnapshot.key;
    
                    tr.querySelector(".venda").addEventListener("click", e => {
                        this.produtoId = tr.dataset.id; // Armazena o ID do produto
                        document.querySelector("#venda-produto").value = produto.nome;
                        document.querySelector("#venda-quantidade").value = 1;
                        this.valor = produto.valor;
                        document.querySelector("#venda-valor").value = produto.valor;
    
                        document.querySelector(".form-venda").style.display = 'block';
                        document.querySelector(".form-cadastro").style.display = 'none';
                    });
    
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
    

    listarVendas(data) {
        if(data == undefined){
            var dataAtual = new Date();
            var date = dataAtual.toLocaleDateString('pt-BR');
            data = date;
        }

        let tabelaVendas = document.querySelector("#corpo-tabela-vendas"); 
        tabelaVendas.innerHTML = "";  
    
        let valorTotal = 0; // Iniciar o valor total como 0

        firebase.database().ref('vendas').once('value', snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const produto = childSnapshot.val();
                    const tr = document.createElement("tr"); 
                    
                    if(data == produto.data){
                        valorTotal += parseFloat(produto.valor); // Somar o valor do produto ao total
                        console.log(valorTotal);

                        tr.innerHTML = `
                        <td>${produto.nome}</td>
                        <td>${produto.quantidade}</td>
                        <td>R$ ${produto.valor}</td>
                        <td>${produto.data}</td>
                        <td>${produto.hora}</td>
                    `;
                    tabelaVendas.appendChild(tr);  
                    }
    
                    
                });
            } 
            // Define o valor total no campo total-dia
            document.querySelector("#total-dia").value = `R$ ${valorTotal.toFixed(2)}`; // Mostra o total formatado
        });
    }
}

var cadastrar = new Cadastro();
