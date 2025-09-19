import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select('*')

  if (error) {
    console.error('Error fetching todos:', error)
    return <div>Error loading todos</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lista de Todos</h1>
      
      {!todos || todos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum todo encontrado</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo, index) => (
            <li key={todo.id || index} className="bg-white p-4 rounded-lg shadow border">
              {/* Se o todo tem propriedades específicas, acesse-as diretamente */}
              <div className="flex items-center justify-between">
                <div>
                  {todo.title && <h3 className="font-medium">{todo.title}</h3>}
                  {todo.description && <p className="text-gray-600 text-sm mt-1">{todo.description}</p>}
                  {todo.content && <p className="text-gray-800">{todo.content}</p>}
                  {todo.task && <p className="text-gray-800">{todo.task}</p>}
                  
                  {/* Fallback: mostrar todas as propriedades se a estrutura for desconhecida */}
                  {!todo.title && !todo.description && !todo.content && !todo.task && (
                    <pre className="text-sm text-gray-600">
                      {JSON.stringify(todo, null, 2)}
                    </pre>
                  )}
                </div>
                
                {todo.completed !== undefined && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    todo.completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {todo.completed ? 'Concluído' : 'Pendente'}
                  </span>
                )}
              </div>
              
              {todo.created_at && (
                <div className="mt-2 text-xs text-gray-400">
                  Criado em: {new Date(todo.created_at).toLocaleString('pt-BR')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
