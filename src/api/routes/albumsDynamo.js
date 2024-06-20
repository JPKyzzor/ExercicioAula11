const express = require("express");
const router = express.Router();
const uuid = require("uuid");

const AWS = require("aws-sdk");

// Configuração do AWS SDK para apontar para o DynamoDB Local
AWS.config.update({
  region: "local", // Configuração da região para o DynamoDB Local
  endpoint: "http://localhost:8000", // Endpoint para o DynamoDB Local
  credentials: {
    accessKeyId: "anyid", // Chave de acesso falsa
    secretAccessKey: "anyfakekey", // Chave de acesso secreta fictícia
  },
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const DynamoDB = new AWS.DynamoDB();
const tableName = "Albums"; // Nome da tabela no DynamoDB
const indexName = "ArtistaIndex";

// Cria Tabela Normal
const createTable = async () => {
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }, // Chave primária
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }, // Tipo de atributo para a chave primária
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, // Capacidade de leitura
      WriteCapacityUnits: 5, // Capacidade de gravação
    },
  };

  try {
    await DynamoDB.createTable(params).promise();
    console.log("Tabela de álbuns criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar a tabela de álbuns:", error);
    throw error;
  }
};

const atualizarTabela = async () => {
  const params = {
    TableName: "Albums",
    AttributeDefinitions: [{ AttributeName: "artista", AttributeType: "S" }],
    GlobalSecondaryIndexUpdates: [
      {
        Create: {
          IndexName: "ArtistaIndex",
          KeySchema: [{ AttributeName: "artista", KeyType: "HASH" }],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      },
    ],
  };

  try {
    const data = await DynamoDB.updateTable(params).promise();
    console.log(
      "Índice adicionado com sucesso. JSON:",
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error(
      "Erro ao adicionar índice. JSON:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};


// Função para inserir um álbum no DynamoDB
const insertAlbum = async (album) => {
  // Gere um ID aleatório para o álbum
  album.id = uuid.v4();

  const params = {
    TableName: tableName,
    Item: album,
  };
  try {
    await dynamoDB.put(params).promise();
  } catch (error) {
    console.error("Erro ao inserir o álbum:", error);
    throw error;
  }
};

router.get("/", async (req, res) => {
  const params = {
    TableName: tableName,
    Limit: 20000
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    if (result.Items) {
      res.status(200).json(result.Items);
    } else {
      res.status(404).json({ error: "Tabela não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get("/criaTabela", async (req, res) => {
  try {
    await createTable();
    res.status(500).json({ message: "Tabela criada" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

router.get("/atualizaTabela", async (req, res) => {
  try {
    await atualizarTabela();
    res.status(500).json({ message: "Tabela atualizada" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Rota para inserir múltiplos álbuns
router.post("/", async (req, res) => {
  const albums = req.body.albums;

  try {
    const promises = albums.map((album) => insertAlbum(album));
    await Promise.all(promises);
    //console.log("Álbuns inseridos com sucesso!");
    res.status(201).json({ message: "Álbuns inseridos com sucesso" });
  } catch (error) {
    console.error("Erro ao inserir álbuns:", error.message);
    res.status(500).json({ error: "Erro ao inserir álbuns" });
  }
});

// Função para deletar todos os álbuns
const deleteAllAlbums = async () => {
  const scanParams = {
    TableName: tableName,
  };

  try {
    const scanResult = await dynamoDB.scan(scanParams).promise();
    const deletePromises = scanResult.Items.map((item) =>
      dynamoDB
        .delete({
          TableName: tableName,
          Key: {
            id: item.id,
          },
        })
        .promise()
    );
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Erro ao deletar álbuns:", error);
    throw error;
  }
};

// Rota DELETE para limpar a tabela de álbuns
router.delete("/", async (req, res) => {
  try {
    await deleteAllAlbums();
    res
      .status(200)
      .json({ message: "Todos os álbuns foram deletados com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar álbuns" });
  }
});

router.get("/buscaIndex/:artista", async (req, res) => {
  const params = {
    TableName: tableName,
    IndexName: "ArtistaIndex",
    KeyConditionExpression: "artista = :artista",
    ExpressionAttributeValues: {
      ":artista": req.params.artista,
    },
  };
  console.log("Artista que vou procurar:", req.params.artista);

  try {
    const result = await dynamoDB.query(params).promise();
    res.status(200).json(result.Items);
  } catch (error) {
    console.error("Erro ao buscar por índice:", error.message);
    res.status(500).json({ error: error.message });
  }
});


router.get("/buscaAlbum/:nome", async (req, res) => {
  const params = {
    TableName: tableName,
    FilterExpression: "nome = :nome",
    ExpressionAttributeValues: {
      ":nome": req.params.nome,
    },
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    res.status(200).json(result.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/atualizaAlbum/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, artista, ano, generos, faixas } = req.body;

  const params = {
    TableName: tableName,
    Key: {
      id: id,
    },
    UpdateExpression:
      "set nome = :nome, artista = :artista, ano = :ano, generos = :generos, faixas = :faixas",
    ExpressionAttributeValues: {
      ":nome": nome,
      ":artista": artista,
      ":ano": ano,
      ":generos": generos,
      ":faixas": faixas,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamoDB.update(params).promise();
    res.status(200).json(result.Attributes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
