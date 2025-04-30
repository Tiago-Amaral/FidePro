
import express from "express";
import { auth, db } from "../firebase-config.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";


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
 router.post("/register", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      res.status(201).json({ message: "Usuário registrado com sucesso", user: userCredential.user });
    } catch (error) {
      res.status(400).json({ message: "Erro ao registrar usuário", error: error.message });
    }
  });


   //recuperar senha
   router.post("/recover-password", async (req, res) => {
    const { email } = req.body;
  
    try {
      await sendPasswordResetEmail(auth, email);
      res.status(200).json({ message: "Instruções para recuperação de senha enviadas com sucesso para o e-mail." });
    } catch (error) {
      res.status(400).json({ message: "Erro ao enviar e-mail de recuperação", error: error.message });
    }
  });
  
//Listar clientes cadastrados
router.get("/list-client", async (req, res) => {
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
 

 

export default router;
