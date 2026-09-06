import {BrowserRouter, Routes,Route} from "react-router-dom"
import Login from "./Login"
import HomePage from "./home/Homepage"

function App() {





  return (


<>


<BrowserRouter>

<Routes>






  <Route path="/" element={<HomePage/>} />
   <Route path="/login" element={<Login/>} />
    {/* <Route path="/register" element={} /> */}
</Routes>






</BrowserRouter>








</>

  )










}

export default App