import express from "express";
import prisma from "../db.js";

const router = express.Router();

// GET /stores - Listar todas as lojas
router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: { user: true, products: true },
      orderBy: { id: "asc" }
    })
    res.json(stores)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// POST /stores body: { name, userId }
router.post('/', async (req, res) => {
  try {
    console.log('Body recebido:', req.body); // Debug
    const { name, userId } = req.body
    
    // Validar se os campos obrigatórios foram enviados
    if (!name || !userId) {
      return res.status(400).json({ 
        error: "Nome e userId são obrigatórios",
        received: { name, userId }
      })
    }
    
    // Converter userId para número e validar
    const userIdNumber = Number(userId)
    if (isNaN(userIdNumber)) {
      return res.status(400).json({ error: "userId deve ser um número válido" })
    }
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userIdNumber }
    })
    
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" })
    }
    
    // Verificar se o usuário já tem uma loja
    const existingStore = await prisma.store.findUnique({
      where: { userId: userIdNumber }
    })
    
    if (existingStore) {
      return res.status(409).json({ error: "Usuário já possui uma loja" })
    }
    
    const store = await prisma.store.create({
      data: { name, userId: userIdNumber },
      include: { user: true, products: true }
    })
    res.status(201).json(store)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /stores/:id -> retorna loja + user (dono) + produtos
router.get('/:id', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, products: true }
    })
    if (!store) return res.status(404).json({ error: 'Loja não encontrada' })
    res.json(store)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /stores/:id - Atualizar loja
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    const store = await prisma.store.update({
      where: { id: Number(req.params.id) },
      data: { name },
      include: { user: true, products: true }
    })
    res.json(store)
  } catch (e) { 
    if (e.code === 'P2025') return res.status(404).json({ error: 'Loja não encontrada' })
    res.status(400).json({ error: e.message }) 
  }
})

// DELETE /stores/:id - Deletar loja
router.delete('/:id', async (req, res) => {
  try {
    await prisma.store.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(204).send()
  } catch (e) { 
    if (e.code === 'P2025') return res.status(404).json({ error: 'Loja não encontrada' })
    res.status(400).json({ error: e.message }) 
  }
})

export default router;
