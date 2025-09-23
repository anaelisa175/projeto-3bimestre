import express from "express";
import prisma from "../db.js";

const router = express.Router();

// POST /products body: { name, price, storeId }
router.post('/', async (req, res) => {
  try {
    const { name, price, storeId } = req.body
    
    // Validar se os campos obrigatórios foram enviados
    if (!name || !price || !storeId) {
      return res.status(400).json({ 
        error: "Nome, preço e storeId são obrigatórios",
        received: { name, price, storeId }
      })
    }
    
    // Converter valores para números e validar
    const priceNumber = Number(price)
    const storeIdNumber = Number(storeId)
    
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({ error: "Preço deve ser um número válido maior que zero" })
    }
    
    if (isNaN(storeIdNumber)) {
      return res.status(400).json({ error: "storeId deve ser um número válido" })
    }
    
    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeIdNumber }
    })
    
    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" })
    }
    
    const product = await prisma.product.create({
      data: { name, price: priceNumber, storeId: storeIdNumber },
      include: { store: { include: { user: true } } }
    })
    res.status(201).json(product)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /products -> inclui a loja e o dono da loja
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { store: { include: { user: true } } },
      orderBy: { id: "asc" }
    })
    res.json(products)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /products/:id - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { store: { include: { user: true } } }
    })
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
    res.json(product)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// PUT /products/:id - Atualizar produto
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

export default router;