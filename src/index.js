const express = require("express");
const app = express();
const routes = require("./api/routes");
const Axios = require("axios");
const readline = require("readline");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/api", routes);

function gerarDados(num) {
  const dados = [];
  for (let i = 1; i <= num; i++) {
    dados.push({
      nome: `Álbum ${i}`,
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Escolha o banco de dados para inserção ou limpeza:\n1- Inserir no MongoDB\n2- Inserir no Cassandra\n3- Limpar MongoDB\n4- Limpar Cassandra\n",
  async function (answer) {
    if (answer === "1") {
      await inserirDados("albums", "MongoDB");
      rl.close();
    } else if (answer === "2") {
      await inserirDados("albumsCassandra", "Cassandra");
      rl.close();
    } else if (answer === "3") {
      await removerDados("albums", "MongoDB");
      rl.close();
    } else if (answer === "4") {
      await removerDados("albumsCassandra", "Cassandra");
      rl.close();
    } else {
      console.log("Escolha inválida. Por favor, escolha 1, 2, 3 ou 4.");
      rl.close();
    }
  }
);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Aplicação executando na porta ${PORT}!`);
});
