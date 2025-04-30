// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clienteRoutes from './routes/clientesRoutes.js'; // 👈 Importação correta com .js no final

dotenv.config(); // Carrega variáveis de ambiente

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rota base
app.get('/', (req, res) => {
  res.send('API rodando!');
});

// Usando as rotas de clientes
app.use("/api/clientes", clienteRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
