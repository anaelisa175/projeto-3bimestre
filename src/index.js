// Importar as bibliotecas necessárias
import express from "express";
import dotenv from "dotenv";
import prisma from "./db.js"; // Importar nossa conexão com o banco
import storesRouter from "./routes/stores.js"; // Importar rotas de stores

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Criar aplicação Express
const app = express();

// Middleware para processar JSON nas requisições
app.use(express.json());

// Usar rotas de stores
app.use("/stores", storesRouter);

//Healthcheck
app.get("/", (_req, res) => res.json({ ok: true, service: "API 3º Bimestre" }));

//CREATE: POST /usuarios
app.post("/usuarios", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const novoUsuario = await prisma.user.create({
      data: { name, email, password }
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

//READ: GET /usuarios
app.get("/usuarios", async (_req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { id: "asc" }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

//READ: GET /usuarios/:id - Buscar usuário por ID
app.get("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { store: { include: { products: true } } }
    });
    
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

//UPDATE: PUT /usuarios/:id - Atualizar usuário
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    
    const usuarioAtualizado = await prisma.user.update({
      where: { id: Number(id) },
      data: { 
        name: name || undefined,
        email: email || undefined, 
        password: password || undefined 
      },
      include: { store: { include: { products: true } } }
    });
    
    res.json(usuarioAtualizado);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

//DELETE: DELETE /usuarios/:id - Deletar usuário
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

//=== ROTAS PARA PRODUCT ===

// POST /products body: { name, price, storeId }
app.post('/products', async (req, res) => {
  try {
    const { name, price, storeId } = req.body
    const product = await prisma.product.create({
      data: { name, price: Number(price), storeId: Number(storeId) }
    })
    res.status(201).json(product)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /products -> inclui a loja e o dono da loja
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { store: { include: { user: true } } }
    })
    res.json(products)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /products/:id - Atualizar produto
app.put('/products/:id', async (req, res) => {
  try {
    const { name, price } = req.body
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { 
        name, 
        price: price ? Number(price) : undefined 
      },
      include: { store: { include: { user: true } } }
    })
    res.json(product)
  } catch (e) { 
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produto não encontrado' })
    res.status(400).json({ error: e.message }) 
  }
})

// DELETE /products/:id - Deletar produto
app.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(204).send()
  } catch (e) { 
    if (e.code === 'P2025') return res.status(404).json({ error: 'Produto não encontrado' })
    res.status(400).json({ error: e.message }) 
  }
})

//ROTA DE TESTE
app.get("/status", (req, res) => {
  res.json({ message: "API Online" });
});
