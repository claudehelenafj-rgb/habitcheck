import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { BancoCaderninho } from './banco'

/** Cria um banco "antigo" (versão 18 do Dexie = 180 no IndexedDB) só com hábitos e registros. */
async function bancoAntigo(nome: string) {
  await new Promise<void>((ok, erro) => {
    const pedido = indexedDB.open(nome, 180)
    pedido.onupgradeneeded = () => {
      const db = pedido.result
      db.createObjectStore('habitos', { keyPath: 'id' }).put({ id: 'h1', titulo: 'Caminhar', adesivo: 'haltere' })
      const registros = db.createObjectStore('registrosHabito', { keyPath: 'id' })
      registros.createIndex('habitoId', 'habitoId')
      registros.createIndex('dia', 'dia')
      registros.put({ id: 'h1|2026-10-01', habitoId: 'h1', dia: '2026-10-01', nivel: 'completo', quando: '' })
      registros.put({ id: 'h1|2026-10-02', habitoId: 'h1', dia: '2026-10-02', nivel: 'minimo', quando: '', adesivo: 'foguete' })
      registros.put({ id: 'hx|2026-10-03', habitoId: 'hx', dia: '2026-10-03', nivel: 'completo', quando: '' })
    }
    pedido.onsuccess = () => {
      pedido.result.close()
      ok()
    }
    pedido.onerror = () => erro(pedido.error)
  })
}

describe('atualização do banco', () => {
  it('versão 19: os registros antigos de hábito recebem o adesivo que o hábito tem agora', async () => {
    await bancoAntigo('teste-migracao')
    const banco = new BancoCaderninho('teste-migracao')
    const registros = await banco.registrosHabito.orderBy('id').toArray()
    expect(registros.map((r) => r.adesivo)).toEqual(['haltere', 'foguete', undefined])
    banco.close()
  })
})
