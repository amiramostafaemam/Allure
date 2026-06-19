import { Show, SignInButton, SignUpButton, useAuth, UserButton,  } from '@clerk/react'
import PageLoader from "./components/PageLoader"
import Layout from './components/Layout'
function App() {
  const {isLoaded}=useAuth()

  if(!isLoaded) return <PageLoader/>

  return (
    <Layout>
      <header>
        <Show when="signed-out">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <p className="text-amber-400 font-bold font-stretch-75%">hhello there</p>
      <button className='btn btn-primary'>clickk me</button>
      <button className='btn btn-secondary'>ckkk</button>
    </Layout>
  )
}

export default App
