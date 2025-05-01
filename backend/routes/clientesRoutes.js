
import express from "express";
import { auth, db } from "../firebase-config.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc, updateDoc } from "firebase/firestore";
import axios from "axios";

const router = express.Router();

// Rota principal de clientes
router.get("/", (req, res) => {
  res.send("Lista de Clientes");
});

//Logar no sistema
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    res.status(200).json({ message: "Login bem-sucedido", user: userCredential.user });
  } catch (error) {
    res.status(400).json({ message: "Erro no login", error: error.message });
  }
});

 // registrar Usuarios no sistema
 router.post("/registrar", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      res.status(201).json({ message: "Usuário registrado com sucesso", user: userCredential.user });
    } catch (error) {
      res.status(400).json({ message: "Erro ao registrar usuário", error: error.message });
    }
  });


   //recuperar senha
   router.post("/recuperar-senha", async (req, res) => {
    const { email } = req.body;
  
    try {
      await sendPasswordResetEmail(auth, email);
      res.status(200).json({ message: "Instruções para recuperação de senha enviadas com sucesso para o e-mail." });
    } catch (error) {
      res.status(400).json({ message: "Erro ao enviar e-mail de recuperação", error: error.message });
    }
  });

  //Cadastrar clientes
  router.post("/cadastrar", async (req, res) => {
    try {
      const {
        nome,
        email,
        telefone,
        cidade,
        nascimento,
        produto,
        categoria,
        quantidade,
        preco,
        dataCompra,
        duracao
      } = req.body;
  
      const novoCliente = {
        nome,
        email,
        telefone,
        cidade,
        nascimento,
        ultimaCompra: {
          produto,
          categoria,
          quantidade: Number(quantidade),
          preco: Number(preco),
          dataCompra,
          duracao: Number(duracao),
        },
        criadoEm: new Date().toISOString()
      };
  
      const docRef = await addDoc(collection(db, "clientes"), novoCliente);
  
      res.status(201).json({ message: "Cliente cadastrado com sucesso!", id: docRef.id });
    } catch (error) {
      res.status(500).json({ message: "Erro ao cadastrar cliente", error: error.message });
    }
  });
  
//Listar clientes cadastrados
router.get("/listar-clientes", async (req, res) => {
    try {
      const clientesSnapshot = await getDocs(collection(db, "clientes")); // nome da coleção no Firestore
      const listaClientes = [];
  
      clientesSnapshot.forEach(doc => {
        listaClientes.push({ id: doc.id, ...doc.data() });
      });
  
      res.status(200).json(listaClientes);
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      res.status(500).json({ message: "Erro ao listar clientes", error: error.message });
    }
  });

  //editar os clientes quando houver uma recompra
  router.put('/editar-compra/:id', async (req, res) => {
    const clienteId = req.params.id;
    const {
      recompra,
      produto,
      categoria,
      quantidade,
      preco,
      dataCompra,
      duracao
    } = req.body;
  
    try {
      const clienteRef = doc(db, 'clientes', clienteId);
  
      await updateDoc(clienteRef, {
        recompra,
        produto,
        categoria,
        quantidade,
        preco,
        dataCompra,
        duracao
      });
  
      res.status(200).json({ message: 'Dados de recompra atualizados com sucesso.' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar cliente', error: error.message });
    }
  });

  //Clientes fazendo aniversario e clientes com potencial de recompra
  router.get("/notificacoes", async (req, res) => {
    try {
      const hoje = dayjs();
      const clientesSnapshot = await getDocs(collection(db, "clientes"));
  
      const aniversariantes = [];
      const potenciaisRecompra = [];
  
      clientesSnapshot.forEach(doc => {
        const cliente = doc.data();
  
        // ANIVERSARIANTES
        if (cliente.nascimento) {
          const nascimento = dayjs(cliente.nascimento);
          if (
            nascimento.date() === hoje.date() &&
            nascimento.month() === hoje.month()
          ) {
            aniversariantes.push({
              id: doc.id,
              ...cliente,
              nascimento: nascimento.format("DD/MM/YYYY")
            });
          }
        }
  
        // POTENCIAIS RECOMPRA
        if (cliente.dataCompra && cliente.duracao) {
          const dataCompra = dayjs(cliente.dataCompra.toDate?.() || cliente.dataCompra);
          const diasDesdeCompra = hoje.diff(dataCompra, "day");
  
          if (diasDesdeCompra >= cliente.duracao) {
            potenciaisRecompra.push({
              id: doc.id,
              ...cliente,
              dataCompra: dataCompra.format("DD/MM/YYYY"),
              diasDesdeCompra
            });
          }
        }
      });
  
      res.status(200).json({ aniversariantes, potenciaisRecompra });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar notificações", detalhes: error.message });
    }
  });
  
 // Gerar graficos e Relatorios
 router.get("/relatorio-produtos", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "clientes"));
    const produtosVendas = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const { produto, quantidade } = data?.ultimaCompra || {};

      if (produto && quantidade) {
        if (!produtosVendas[produto]) {
          produtosVendas[produto] = 0;
        }
        produtosVendas[produto] += Number(quantidade);
      }
    });

    // Ordenar os produtos por quantidade vendida
    const ordenado = Object.entries(produtosVendas)
      .sort((a, b) => b[1] - a[1])
      .map(([produto, quantidade]) => ({ produto, quantidade }));

    const maisVendido = ordenado[0]?.produto;
    const menosVendido = ordenado[ordenado.length - 1]?.produto;

    // Dados do gráfico com destaque
    const dadosGrafico = ordenado.map(p => ({
      ...p,
      destaque: p.produto === maisVendido ? "maisVendido"
               : p.produto === menosVendido ? "menosVendido"
               : "neutro"
    }));

    // Prompt IA (sem lista completa no retorno)
    const prompt = `Você é um especialista em análise de vendas.

Com base nas informações abaixo:
- Produto mais vendido: ${maisVendido}
- Produto menos vendido: ${menosVendido}

Crie um relatório com:
1. Análise de desempenho dos produtos.
2. Sugestões de marketing para aumentar vendas dos menos vendidos.
3. Estratégias para manter a liderança dos mais vendidos.
4. Dicas gerais de venda com base nesses dados.`;

    const respostaIA = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const textoIA = respostaIA.data.choices[0].message.content;

    res.json({
      grafico: dadosGrafico, // prontos para o frontend usar como destaque
      relatorioIA: textoIA
    });

  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ erro: "Erro ao gerar relatório" });
  }
});

 

export default router;
