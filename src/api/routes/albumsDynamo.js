const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const uuid = require('uuid');

AWS.config.update({ 
    accessKeyId: 'AKIATCKAR66343GDHXAG',
    secretAccessKey: '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',
    region: 'sa-east-1' 
}); // Defina a região AWS correta

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const DynamoDB = new AWS.DynamoDB();
const tableName = 'Albums'; // Nome da tabela no DynamoDB
const indexName = 'ArtistaIndex';
//Cria Tabela Normal
const createTable = async () => {
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' } // Chave primária
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' } // Tipo de atributo para a chave primária
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, // Capacidade de leitura
      WriteCapacityUnits: 5 // Capacidade de gravação
    }
  };

  try {
    await dynamoDB.createTable(params).promise();
    console.log('Tabela de álbuns criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar a tabela de álbuns:', error);
    throw error;
  }
};

// const atualizarTabela = async () =>{
// const params = {
//   TableName: 'Albums',
//   AttributeDefinitions: [
//     { AttributeName: 'artista', AttributeType: 'S' }
//   ],
//   GlobalSecondaryIndexUpdates: [
//     {
//       Create: {
//         IndexName: 'ArtistaIndex',
//         KeySchema: [
//           { AttributeName: 'artista', KeyType: 'HASH' }
//         ],
//         Projection: {
//           ProjectionType: 'ALL'
//         },
//         ProvisionedThroughput: {
//           ReadCapacityUnits: 5,
//           WriteCapacityUnits: 5
//         }
//       }
//     }
//   ]
// };

// DynamoDB.updateTable(params, function (err, data) {
//   if (err) {
//     console.error("Erro ao adicionar índice. JSON:", JSON.stringify(err, null, 2));
//   } else {
//     console.log("Índice adicionado com sucesso. JSON:", JSON.stringify(data, null, 2));
//   }
// });
// }
// atualizarTabela();
// Função para inserir um álbum no DynamoDB
const insertAlbum = async (album) => {
  // Gere um ID aleatório para o álbum
  album.id = uuid.v4();

  const params = {
    TableName: tableName,
    Item: album
  };
  try {
    await dynamoDB.put(params).promise();
    console.log('Álbum inserido com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir o álbum:', error);
    throw error;
  }
};




router.get('/', async (req, res) => {
  const params = {
    TableName: tableName
  }

  try {
    const result = await dynamoDB.scan(params).promise();
    if (result.Items) {
      console.log(result.Items)
    } else {
      res.status(404).json({ error: 'Tabela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para inserir múltiplos álbuns
router.post('/', async (req, res) => {
  const albums = req.body.albums;

  try {
    const promises = albums.map(album => insertAlbum(album));
    await Promise.all(promises);
    console.log('Álbuns inseridos com sucesso!');
    res.status(201).json({ message: 'Álbuns inseridos com sucesso' });
  } catch (error) {
    console.error('Erro ao inserir álbuns:', error.message);
    res.status(500).json({ error: 'Erro ao inserir álbuns' });
  }
});

// Função para deletar todos os álbuns
const deleteAllAlbums = async () => {
  const params = {
    TableName: tableName
  };

  try {
    const scanResult = await dynamoDB.scan(params).promise();
    const deletePromises = scanResult.Items.map(async (item) => {
      const deleteParams = {
        TableName: tableName,
        Key: {
          id: item.id
        }
      };
      await dynamoDB.delete(deleteParams).promise();
      console.log(`Item com ID ${item.id} excluído com sucesso`);
    });
    await Promise.all(deletePromises);
    console.log('Todos os itens foram excluídos com sucesso');
  } catch (error) {
    console.error('Erro ao excluir itens:', error);
    throw error;
  }
};

// Rota DELETE para limpar a tabela de álbuns
router.delete('/', async (req, res) => {
  try {
    await deleteAllAlbums();
    res.status(200).json({ message: 'Tabela de álbuns limpa com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar a tabela de álbuns' });
  }
});

router.get('/buscaIndex/:artista', async (req, res) => {
  const params = {
    TableName: tableName,
    IndexName: 'ArtistaIndex',
    KeyConditionExpression: 'artista = :artista',
    ExpressionAttributeValues: {
      ':artista': req.params.artista
    }
  };

  try {
    const result = await dynamoDB.query(params).promise();
    res.status(200).json(result.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/buscaAlbum/:nome', async (req, res) => {
  const params = {
    TableName: tableName,
    FilterExpression: 'nome = :nome',
    ExpressionAttributeValues: {
      ':nome': req.params.nome
    }
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    res.status(200).json(result.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

router.put('/atualizaAlbum/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, artista, ano, generos, faixas, lancamento } = req.body;

  const params = {
    TableName: tableName,
    Key: {
      id: id
    },
    UpdateExpression: 'set nome = :nome, artista = :artista, ano = :ano, generos = :generos, faixas = :faixas, lancamento = :lancamento',
    ExpressionAttributeValues: {
      ':nome': nome,
      ':artista': artista,
      ':ano': ano,
      ':generos': generos,
      ':faixas': faixas,
      ':lancamento': lancamento
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await dynamoDB.update(params).promise();
    res.status(200).json(result.Attributes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;