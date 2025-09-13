import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

function Page() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true)
        const { data: todos, error } = await supabase.from('todos').select()
        
        if (error) {
          console.error('Error fetching todos:', error)
          return
        }

        if (todos && todos.length > 0) {
          setTodos(todos)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {todos.map((todo, index) => (
        <li key={todo.id || index}>
          {todo.title || todo.content || JSON.stringify(todo)}
        </li>
      ))}
    </div>
  )
}

export default Page
