// excelToJson.js
const xlsx = require("xlsx");
const fs = require("fs");

// Lê o arquivo Excel
const workbook = xlsx.readFile("produtos.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Converte para JSON
const data = xlsx.utils.sheet_to_json(sheet).map((item, index) => ({
  id: index + 1,
  nome: item.nome,
  preco: item.preco,
  imagem: "/produtos/medicamento.png" // imagem padrão
}));

// Salva como produtos.json dentro da pasta data
fs.writeFileSync("./data/produtos.json", JSON.stringify(data, null, 2), "utf-8");

console.log("✅ Arquivo produtos.json gerado com sucesso!");