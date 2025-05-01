import { useState } from "react";
import axios from "axios";
import '../pages/login.css'

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      const res = await axios.post("http://localhost:5000/api/clientes/login", {
        email,
        password: senha,
      });

      console.log("Login bem-sucedido:", res.data.user);
      alert("Login bem-sucedido!");
    } catch (err) {
      setErro("Email ou senha incorretos");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <div className="login-links">
          <a href="/recuperar">Esqueci minha senha</a>
          <a href="/registrar">Criar conta</a>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
