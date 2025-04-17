const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();



dotenv.config(); // vai carregar variaveis de ambiente

app.use(cors());


//importar rotas
const clienteRoutes = require("./routes/clientesRoutes");
//const authRoutes = require("./routes/authRoutes");

//faz uso das rotas
app.use("/api/clientes", clienteRoutes);
//app.use("/api/auth", authRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});