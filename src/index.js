// index.js

const express = require("express");
const app = express();
const routes = require("./api/routes");
const Axios = require("axios");

app.use(function (req, res, next) {
  //
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
}); //

app.use("/api", routes);

app.listen(8080, async function () {
  console.log("Aplicação executando na porta 8080!");
  // Inserir dados mockados em lotes
  const batchSize = 100;
  const totalRecords = dadosMockados.length;
  const startTime = new Date();
  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = dadosMockados.slice(i, i + batchSize);
    const batchStartTime = new Date();
    await Axios.post('http://localhost:8080/api/albums', {
      albums: batch
    });
    const batchEndTime = new Date();
    const batchTime = batchEndTime - batchStartTime;
    console.log(`Lote ${i / batchSize + 1} de ${Math.ceil(totalRecords / batchSize)} inserido em ${batchTime}ms`);
  }
  const endTime = new Date();
  const totalTime = endTime - startTime;
  console.log(`Tempo total para inserir ${totalRecords} registros: ${totalTime}ms`);
});

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
console.log(dadosMockados);
