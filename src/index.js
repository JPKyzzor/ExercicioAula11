const express = require("express");
const app = express();
const routes = require("./api/routes");
const Axios = require("axios");
const readline = require("readline");

app.use(express.json());  // Adicione este middleware para processar JSON no corpo das requisições

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/api", routes);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function gerarDados(num) {
  const dados = [];
  for (let i = 1; i <= num; i++) {
    dados.push({
      nome: `album ${i}`,
      artista: `Artista ${i}`,
      ano: `Ano ${i}`,
      generos: [`Gênero ${i}`],
      faixas: [`Faixa ${i}`],
      lancamento: new Date(),
    });
  }
  return dados;
}

const dadosMockados = gerarDados(2000);

async function inserirDados(rota, plataforma) {
  console.log(`Inserindo dados no ${plataforma}...`);
  const batchSize = 100;
  const totalRecords = dadosMockados.length;
  const startTime = new Date();
  try {
    for (let i = 0; i < totalRecords; i += batchSize) {
      const batch = dadosMockados.slice(i, i + batchSize);
      const batchStartTime = new Date();
      await Axios.post(`http://localhost:8080/api/${rota}`, {
        albums: batch,
      });
      const batchEndTime = new Date();
      const batchTime = batchEndTime - batchStartTime;
      console.log(
        `Lote ${i / batchSize + 1} de ${Math.ceil(
          totalRecords / batchSize
        )} inserido em ${batchTime}ms`
      );
    }
  } catch (error) {
    console.error(`Erro ao inserir álbuns no ${plataforma}:`, error.message);
  }
  const endTime = new Date();
  const totalTime = endTime - startTime;
  console.log(
    `Tempo total para inserir ${totalRecords} registros no ${plataforma}: ${totalTime}ms`
  );
}

async function removerDados(rota, plataforma) {
  console.log("Deletando dados na plataforma: " + plataforma);
  const startTime = new Date();
  await Axios.delete(`http://localhost:8080/api/${rota}`);
  const endTime = new Date();
  const totalTime = endTime - startTime;
  console.log(`Tempo total para remover todos registros no ${plataforma}: ${totalTime}ms`)
}

async function contarDados(rota, plataforma) {
  console.log(`Contando dados no ${plataforma}...`);
  const startTime = new Date();
  try {
    const response = await Axios.get(`http://localhost:8080/api/${rota}`);
    const endTime = new Date();
    const albums = response.data;
    console.log(albums);
    const totalTime = endTime - startTime;
    console.log(`Total de álbuns resgatados no ${plataforma}: ${albums.length}`);
    console.log(`Tempo total para resgatar os álbuns: ${totalTime}ms`);
  } catch (error) {
    console.error(`Erro ao contar álbuns no ${plataforma}:, error.message`);
  }
}

async function buscarIndex(rota, plataforma, artista){
  console.log(`Buscando dados através do index no ${plataforma}...`);
  const startTime = new Date();
  try {
    const response = await Axios.get(`http://localhost:8080/api/${rota}/buscaIndex/${artista}`);
    const endTime = new Date();
    const dados = response.data;
    console.log(dados);
    const totalTime = endTime - startTime;
    console.log(`Dados resgatados no ${plataforma}: ${dados.length}`);
    console.log(`Tempo total para resgatar os dados: ${totalTime}ms`);
  } catch (error) {
    console.error(`Erro ao buscar o index no ${plataforma}:`, error.message);
  }
}

async function buscarAlbum(rota, plataforma, album){
  console.log(`Buscando dados através do nome do Álbum no ${plataforma}...`);
  const startTime = new Date();
  try {
    const response = await Axios.get(`http://localhost:8080/api/${rota}/buscaAlbum/${album}`);
    const endTime = new Date();
    const dados = response.data;
    console.log(dados);
    const totalTime = endTime - startTime;
    console.log(`Dados resgatados no ${plataforma}: ${dados.length}`);
    console.log(`Tempo total para resgatar os dados: ${totalTime}ms`);
  } catch (error) {
    console.error(`Erro ao buscar o album no ${plataforma}:`, error.message);
  }
}

const question = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function updateAlbum(rota, plataforma) {
  try {
    const nomeAlbum = await question("Nome do álbum a ser atualizado: ");

    const response = await Axios.get(`http://localhost:8080/api/${rota}/buscaAlbum/${nomeAlbum}`);
    const album = response.data[0];

    if (!album) {
      console.log(`Álbum com o nome '${nomeAlbum}' não encontrado.`);
      rl.close();
      return;
    }

    // Pedir novos dados do álbum
    const nome = await question("Novo nome: ");
    const artista = await question("Novo artista: ");
    const ano = await question("Novo ano: ");
    const genero = await question("Novo genero: ");
    const faixa = await question("Nova faixa: ");
    const lancamento = await question("Nova data de lançamento: ");

    const dadosAtualizados = {
      nome,
      artista,
      ano,
      generos: [genero],  // Supondo que genero é uma string única
      faixas: [faixa],    // Supondo que faixa é uma string única
      lancamento: lancamento  // Convertendo a data de lançamento para objeto Date
    };

    console.log(`Atualizando dados do álbum '${nomeAlbum}' no ${plataforma}...`);
    const startTime = new Date();

    // Atualizar o álbum usando o ID
    const updateResponse = await Axios.put(`http://localhost:8080/api/${rota}/atualizaAlbum/${album.id}`, dadosAtualizados);
    const endTime = new Date();
    const totalTime = endTime - startTime;

    console.log(`Dados Atualizados no ${plataforma}: ${JSON.stringify(dadosAtualizados)}`);
    console.log('Dados atualizados:', updateResponse.data);
    console.log(`Tempo total para atualizar os dados: ${totalTime}ms`);

  } catch (error) {
    console.error(`Erro ao atualizar o álbum no ${plataforma}:`, error.message);
  }
}

async function cassandraMenu(){
  rl.question(
    "Bem-Vindo ao Menu do Banco Cassandra, Selecione uma ação:\n" +
    "1 - Inserir Álbuns\n" +
    "2 - Limpar todos Dados\n" +
    "3 - Consultar todos Dados\n" +
    "0 - Voltar ao Menu principal\n",

    async function (answer) {
      if(answer === "1"){
        await inserirDados("albumsCassandra", "Cassandra");
        cassandraMenu();
      } else if(answer === "2"){
        await removerDados("albumsCassandra", "Cassandra");
        cassandraMenu();
      } else if(answer === "3"){
        await contarDados("albumsCassandra", "Cassandra");
        cassandraMenu();
      }
      else if(answer === "0"){
        console.log("Retornando ao menu...")
        mainMenu();
      }
      else {
        console.log("Opção invalida!")
        cassandraMenu();
      }
    }
  )
}

async function mongoMenu(){
  rl.question(
    "Bem-Vindo ao Menu do MongoDB, Selecione uma ação:\n" +
    "1 - Inserir Álbuns\n" +
    "2 - Limpar todos Dados\n" +
    "3 - Consultar todos Dados\n" +
    "0 - Voltar ao Menu principal\n",

    async function (answer) {
      if(answer === "1"){
        await inserirDados("albums", "MongoDB");
        mongoMenu();
      } else if(answer === "2"){
        await removerDados("albums", "MongoDB");
        mongoMenu();
      } else if(answer === "3"){
        await contarDados("albums", "MongoDB");
        mongoMenu();
      } else if(answer === "0"){
        console.log("Retornando ao menu...")
        mainMenu();
      }
      else {
        console.log("Opção invalida!")
        mongoMenu();
      }
    }
  )
}

async function dynamoMenu(){
  rl.question(
    "Bem-Vindo ao Menu do DynamoDB, Selecione uma ação:\n" +
    "1 - Inserir Álbuns\n" +
    "2 - Limpar todos Dados\n" +
    "3 - Consultar todos Dados\n" +
    "4 - Consultar expecifico\n" +
    "5 - Consultar a pelo índice\n" +
    "6 - Editar um Álbum\n" +
    "0 - Voltar ao Menu principal\n",

    async function (answer) {
      if(answer === "1"){
        await inserirDados("albumsDynamo", "DynamoDB");
        dynamoMenu();
      } else if(answer === "2"){
        await removerDados("albumsDynamo", "DynamoDB");
        dynamoMenu();
      } else if(answer ===  "3"){
        await contarDados("albumsDynamo", "DynamoDB");
        dynamoMenu();
      } else if(answer === "4"){
        rl.question(
          "Digite o album que deseja buscar:\n",
          async function(resposta){
            await buscarAlbum("albumsDynamo", "DynamoDB", resposta);
            dynamoMenu();
          }
        )
      } else if(answer === "5"){
        rl.question(
          "Digite o artista que deseja buscar:\n",
          async function(resposta){
            await buscarIndex("albumsDynamo", "DynamoDB", resposta);
            dynamoMenu();
          }
        )
      } else if(answer === "6"){
            await updateAlbum("albumsDynamo", "DynamoDB");
            dynamoMenu();
      } else if(answer === "0"){
        console.log("Retornando ao menu...")
        mainMenu();
      }
      else {
        console.log("Opção invalida!")
        dynamoMenu();
      }
    }
  )
}



async function mainMenu() {
  rl.question(
    "Escolha o banco de dados que deseja acessar:\n" +
    "1- MongoDB\n" +
    "2- Cassandra\n" +
    "3- DynamoDB\n" +
    "0- Sair\n",
    async function (answer) {
      if (answer === "1") {
        await mongoMenu();
        mainMenu();
      } else if (answer === "2") {
        await cassandraMenu();
        mainMenu();
      } else if (answer === "3") {
        await dynamoMenu();
        mainMenu();
      } else if (answer === "0") {
        console.log("Saindo...");
        rl.close();
      } else {
        console.log("Escolha inválida. Por favor, escolha 1, 2, 3 ou 0.");
        mainMenu();
      }
    }
  );
}

setTimeout(mainMenu, 2000);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Aplicação executando na porta ${PORT}!`);
});
